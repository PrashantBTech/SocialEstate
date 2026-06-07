const Listing = require('../models/Listing');
const Enquiry = require('../models/Enquiry');
const User = require('../models/User');
const { createOrder } = require('../services/paymentService');
const { notify } = require('../services/notificationService');
const cache = require('../services/cacheService');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const apiRes = require('../utils/apiResponse');
const cloudinary = require('../config/cloudinary');

// POST /listings - Create listing (Step 1-3, pay later)
exports.createListing = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'owner' && req.user.role !== 'builder') return next(new AppError('Only property owners and builders can create listings.', 403));

  const listingData = { ...req.body, owner: req.user._id, status: 'pending_review' };

  // Attempt to geocode location to get coordinates for "Near Me" feature
  try {
    const loc = listingData.location;
    if (loc && loc.locality && loc.city) {
      const addressString = `${loc.locality}, ${loc.city}, ${loc.state || ''}, India`;
      // Nominatim requires a user-agent
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressString)}&format=json&limit=1`, {
        headers: { 'User-Agent': 'SocialEstate/1.0 (contact@socialestate.com)' }
      });
      const data = await response.json();
      if (data && data.length > 0) {
        listingData.location.coordinates = {
          type: 'Point',
          coordinates: [parseFloat(data[0].lon), parseFloat(data[0].lat)]
        };
      }
    }
  } catch (error) {
    console.error('Geocoding error during listing creation:', error);
  }

  const listing = await Listing.create(listingData);
  listing.calculateScore();
  await listing.save();

  apiRes.created(res, 'Listing created. Please complete payment to go live.', { listing });
});

// PATCH /listings/:id - Update listing
exports.updateListing = catchAsync(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return next(new AppError('Listing not found.', 404));
  if (listing.owner.toString() !== req.user._id.toString()) return next(new AppError('Not authorized.', 403));

  const updateData = req.body;
  delete updateData.owner;
  delete updateData.status;
  delete updateData._id;
  delete updateData.editStatus;
  delete updateData.proposedEdits;

  // If the listing is active, we don't apply the changes directly.
  // Instead, we save them as proposedEdits for admin approval.
  if (listing.status === 'active') {
    listing.proposedEdits = updateData;
    listing.editStatus = 'pending';
    await listing.save();
    return apiRes.success(res, 'Edits submitted for admin approval.', { listing });
  }

  // Otherwise (pending, rejected), apply directly
  Object.keys(updateData).forEach(key => {
    listing[key] = updateData[key];
  });

  listing.calculateScore();
  
  // If it was rejected, put it back to pending review after they edit
  if (listing.status === 'rejected') {
    listing.status = 'pending_review';
  }

  await listing.save();
  await cache.delPattern(`listings:*`);

  apiRes.success(res, 'Listing updated.', { listing });
});

// POST /listings/:id/upload-photos
exports.uploadPhotos = catchAsync(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return next(new AppError('Listing not found.', 404));
  if (listing.owner.toString() !== req.user._id.toString()) return next(new AppError('Not authorized.', 403));

  if (!req.files || req.files.length === 0) return next(new AppError('No photos uploaded.', 400));

  const photos = req.files.map(file => ({
    url: file.path,
    publicId: file.filename,
  }));

  listing.photos.push(...photos);
  listing.calculateScore();
  await listing.save();

  apiRes.success(res, 'Photos uploaded.', { photos, propertyScore: listing.propertyScore });
});

// DELETE /listings/:id/photos/:photoId
exports.deletePhoto = catchAsync(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return next(new AppError('Listing not found.', 404));
  if (listing.owner.toString() !== req.user._id.toString()) return next(new AppError('Not authorized.', 403));

  const photo = listing.photos.id(req.params.photoId);
  if (!photo) return next(new AppError('Photo not found.', 404));

  await cloudinary.uploader.destroy(photo.publicId).catch(() => {});
  listing.photos.pull(req.params.photoId);
  listing.calculateScore();
  await listing.save();

  apiRes.success(res, 'Photo deleted.');
});

// POST /listings/:id/pay-service-fee
exports.payServiceFee = catchAsync(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return next(new AppError('Listing not found.', 404));
  if (listing.owner.toString() !== req.user._id.toString()) return next(new AppError('Not authorized.', 403));
  if (listing.serviceFee.status === 'paid') return next(new AppError('Service fee already paid.', 400));
  if (['rejected', 'expired', 'sold', 'archived'].includes(listing.status)) {
    return next(new AppError(`Cannot pay for a ${listing.status} listing.`, 400));
  }

  const amount = parseInt(process.env.SERVICE_FEE_AMOUNT) || 15000;
  const { order, paymentId } = await createOrder({
    userId: req.user._id,
    amount,
    type: 'service_fee',
    listingId: listing._id,
  });

  apiRes.success(res, 'Payment order created.', { order, paymentId });
});

// GET /listings/my-listings
exports.getMyListings = catchAsync(async (req, res) => {
  const { status } = req.query;
  const filter = { owner: req.user._id };
  if (status) filter.status = status;

  const listings = await Listing.find(filter).sort({ createdAt: -1 });
  apiRes.success(res, 'Your listings fetched.', { listings, count: listings.length });
});

// GET /listings/:id
exports.getListingById = catchAsync(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id).populate('owner', 'fullName mobile builderProfile');
  if (!listing) return next(new AppError('Listing not found.', 404));

  // Increment view count
  listing.views += 1;
  await listing.save({ validateBeforeSave: false });

  // Hide sensitive data for non-owners
  if (!req.user || listing.owner._id.toString() !== req.user._id.toString()) {
    listing.owner.mobile = undefined;
    listing.location.flatNo = undefined;
  }

  apiRes.success(res, 'Listing details fetched.', { listing });
});

// GET /listings - Public feed (location priority, filters)
exports.getListings = catchAsync(async (req, res) => {
  const {
    city, locality, pincode, propertyType, intent, budgetMin, budgetMax, bhk, status = 'active',
    sort = '-propertyScore', page = 1, limit = 20, lat, lng,
  } = req.query;

  const cacheKey = `listings:${JSON.stringify(req.query)}`;
  const cached = await cache.get(cacheKey);
  if (cached) return apiRes.success(res, 'Listings fetched (cached).', cached);

  const filter = { status };
  if (intent) filter.intent = intent;
  if (city) filter['location.city'] = new RegExp(city, 'i');
  if (locality) filter['location.locality'] = new RegExp(locality, 'i');
  if (pincode) filter['location.pincode'] = pincode;
  if (propertyType) filter.propertyType = propertyType;
  if (budgetMin || budgetMax) {
    filter.askingPrice = {};
    if (budgetMin) filter.askingPrice.$gte = parseInt(budgetMin);
    if (budgetMax) filter.askingPrice.$lte = parseInt(budgetMax);
  }
  if (bhk) filter.bedrooms = bhk;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const parsedLimit = parseInt(limit);

  // Geo-proximity sort using $geoNear aggregation (returns distance in meters)
  if (lat && lng) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    // Build a match filter without regex (aggregation doesn't support RegExp objects directly)
    const matchFilter = { status };
    if (intent) matchFilter.intent = intent;
    if (city) matchFilter['location.city'] = { $regex: city, $options: 'i' };
    if (locality) matchFilter['location.locality'] = { $regex: locality, $options: 'i' };
    if (pincode) matchFilter['location.pincode'] = pincode;
    if (propertyType) matchFilter.propertyType = propertyType;
    if (budgetMin || budgetMax) {
      matchFilter.askingPrice = {};
      if (budgetMin) matchFilter.askingPrice.$gte = parseInt(budgetMin);
      if (budgetMax) matchFilter.askingPrice.$lte = parseInt(budgetMax);
    }
    if (bhk) matchFilter.bedrooms = bhk;

    const pipeline = [
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [userLng, userLat] },
          distanceField: 'distance', // distance in meters
          spherical: true,
          query: matchFilter,
          key: 'location.coordinates', // explicitly specify which 2dsphere index to use
        },
      },
      { $skip: skip },
      { $limit: parsedLimit },
      {
        $project: {
          'owner.mobile': 0,
          'location.flatNo': 0,
        },
      },
    ];

    const listings = await Listing.aggregate(pipeline);
    const total = await Listing.countDocuments(matchFilter);

    const result = {
      listings,
      pagination: { page: parseInt(page), limit: parsedLimit, total, pages: Math.ceil(total / parsedLimit) },
    };

    await cache.set(cacheKey, result, 180);
    return apiRes.success(res, 'Listings fetched (sorted by distance).', result);
  }

  // Standard query (no geo)
  let query = Listing.find(filter).select('-owner.mobile -location.flatNo').sort(sort);
  const listings = await query.skip(skip).limit(parsedLimit).lean();
  const total = await Listing.countDocuments(filter);

  const result = {
    listings,
    pagination: { page: parseInt(page), limit: parsedLimit, total, pages: Math.ceil(total / parsedLimit) },
  };

  await cache.set(cacheKey, result, 180);
  apiRes.success(res, 'Listings fetched.', result);
});

// POST /listings/:id/enquire
exports.createEnquiry = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'buyer') return next(new AppError('Only buyers can express interest.', 403));
  if (!req.user.isMobileVerified) return next(new AppError('Please verify your mobile number first.', 403));

  const listing = await Listing.findById(req.params.id);
  if (!listing) return next(new AppError('Listing not found.', 404));
  if (listing.status !== 'active') return next(new AppError('This listing is not available.', 400));

  const existing = await Enquiry.findOne({ buyer: req.user._id, listing: listing._id });
  if (existing) return next(new AppError('You have already expressed interest in this listing.', 400));

  const enquiry = await Enquiry.create({
    buyer: req.user._id,
    listing: listing._id,
    buyerSnapshot: { name: req.user.fullName, mobile: req.user.mobile, email: req.user.email },
    source: 'platform',
  });

  listing.enquiryCount += 1;
  await listing.save({ validateBeforeSave: false });

  // Notify admin & seller
  await notify({
    recipientId: listing.owner,
    type: 'new_enquiry',
    title: 'New Buyer Interest',
    message: `${req.user.fullName} is interested in your property.`,
    data: { listingId: listing._id, enquiryId: enquiry._id },
  });

  apiRes.created(res, 'Interest registered. Our team will contact you soon.', { enquiry });
});

// POST /listings/:id/shortlist
exports.toggleShortlist = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  const index = user.shortlistedListings.indexOf(req.params.id);
  if (index > -1) {
    user.shortlistedListings.splice(index, 1);
    await user.save();
    return apiRes.success(res, 'Removed from shortlist.');
  }
  user.shortlistedListings.push(req.params.id);
  await user.save();
  apiRes.success(res, 'Added to shortlist.');
});
