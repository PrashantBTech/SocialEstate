const User = require('../models/User');
const Listing = require('../models/Listing');
const Project = require('../models/Project');
const Enquiry = require('../models/Enquiry');
const Deal = require('../models/Deal');
const { notify } = require('../services/notificationService');
const { sendEmail, templates } = require('../services/emailService');
const cache = require('../services/cacheService');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const apiRes = require('../utils/apiResponse');

// ─── Listing Management ───────────────────────────────────

// GET /admin/listings - All listings with filters
exports.getAllListings = catchAsync(async (req, res) => {
  const { status, city, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (city) filter['location.city'] = new RegExp(city, 'i');

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const listings = await Listing.find(filter)
    .populate('owner', 'fullName mobile email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Listing.countDocuments(filter);

  apiRes.success(res, 'Listings fetched.', {
    listings,
    pagination: { page: parseInt(page), limit: parseInt(limit), total },
  });
});

// PATCH /admin/listings/:id/approve
exports.approveListing = catchAsync(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return next(new AppError('Listing not found.', 404));
  if (listing.serviceFee.status !== 'paid') return next(new AppError('Service fee not paid yet.', 400));

  listing.status = 'active';
  listing.isVerified = true;
  listing.listedAt = new Date();
  listing.expiresAt = new Date(Date.now() + (parseInt(process.env.LISTING_ACTIVE_DAYS) || 90) * 24 * 60 * 60 * 1000);
  await listing.save();

  await cache.delPattern('listings:*');

  await notify({
    recipientId: listing.owner,
    type: 'listing_approved',
    title: 'Listing Approved',
    message: `Your listing is now live on EzyEstate!`,
    channels: { email: true, whatsapp: true },
  });

  if (req.body.sendEmail !== false) {
    const owner = await User.findById(listing.owner);
    if (owner?.email) {
      await sendEmail({
        to: owner.email,
        ...templates.listingApproved(owner.fullName, `${listing.propertyType} in ${listing.location.city}`),
      });
    }
  }

  apiRes.success(res, 'Listing approved and is now live.', { listing });
});

// PATCH /admin/listings/:id/reject
exports.rejectListing = catchAsync(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return next(new AppError('Listing not found.', 404));

  listing.status = 'rejected';
  listing.rejectionReason = req.body.reason || 'Does not meet platform guidelines.';
  await listing.save();

  await notify({
    recipientId: listing.owner,
    type: 'listing_rejected',
    title: 'Listing Rejected',
    message: `Reason: ${listing.rejectionReason}`,
  });

  apiRes.success(res, 'Listing rejected.', { listing });
});

// PATCH /admin/listings/:id/approve-edit
exports.approveEdit = catchAsync(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return next(new AppError('Listing not found.', 404));
  if (listing.editStatus !== 'pending') return next(new AppError('No pending edits.', 400));

  if (listing.proposedEdits) {
    Object.keys(listing.proposedEdits).forEach((key) => {
      listing[key] = listing.proposedEdits[key];
    });
  }

  listing.proposedEdits = null;
  listing.editStatus = 'none';
  listing.calculateScore();
  await listing.save();
  await cache.delPattern('listings:*');

  await notify({
    recipientId: listing.owner,
    type: 'listing_approved',
    title: 'Listing Edits Approved',
    message: `Your recent changes to the listing have been approved and are now live.`,
  });

  apiRes.success(res, 'Listing edits approved and applied.', { listing });
});

// PATCH /admin/listings/:id/reject-edit
exports.rejectEdit = catchAsync(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return next(new AppError('Listing not found.', 404));
  if (listing.editStatus !== 'pending') return next(new AppError('No pending edits.', 400));

  listing.proposedEdits = null;
  listing.editStatus = 'rejected';
  await listing.save();

  await notify({
    recipientId: listing.owner,
    type: 'listing_rejected',
    title: 'Listing Edits Rejected',
    message: `Your proposed edits were rejected by the admin. Reason: ${req.body.reason || 'Did not meet guidelines.'}`,
  });

  apiRes.success(res, 'Listing edits rejected.', { listing });
});

// PATCH /admin/listings/:id/feature
exports.toggleFeature = catchAsync(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return next(new AppError('Listing not found.', 404));

  listing.isFeatured = !listing.isFeatured;
  await listing.save();
  await cache.delPattern('listings:*');

  apiRes.success(res, `Listing ${listing.isFeatured ? 'featured' : 'unfeatured'}.`, { listing });
});

// ─── Project Management ───────────────────────────────────

exports.getAllProjects = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const projects = await Project.find(filter)
    .populate('builder', 'fullName mobile email builderProfile')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Project.countDocuments(filter);

  apiRes.success(res, 'Projects fetched.', {
    projects,
    pagination: { page: parseInt(page), limit: parseInt(limit), total },
  });
});

exports.approveProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new AppError('Project not found.', 404));
  if (project.serviceFee.status !== 'paid') return next(new AppError('Service fee not paid.', 400));

  project.status = 'active';
  project.isVerified = true;
  project.listedAt = new Date();
  await project.save();

  await cache.delPattern('projects:*');

  await notify({
    recipientId: project.builder,
    type: 'listing_approved',
    title: 'Project Approved',
    message: `Your project ${project.projectName} is now live!`,
    channels: { email: true, whatsapp: true },
  });

  apiRes.success(res, 'Project approved.', { project });
});

exports.rejectProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new AppError('Project not found.', 404));

  project.status = 'rejected';
  project.rejectionReason = req.body.reason || 'Does not meet platform guidelines.';
  await project.save();

  await notify({
    recipientId: project.builder,
    type: 'listing_rejected',
    title: 'Project Rejected',
    message: `Reason: ${project.rejectionReason}`,
  });

  apiRes.success(res, 'Project rejected.', { project });
});

// ─── CRM & Enquiry Management ─────────────────────────────

exports.getAllEnquiries = catchAsync(async (req, res) => {
  const { status, assignedTo, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (assignedTo) filter.assignedTo = assignedTo;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const enquiries = await Enquiry.find(filter)
    .populate('buyer', 'fullName mobile email preferences')
    .populate('listing', 'propertyType location.city askingPrice')
    .populate('project', 'projectName location.city')
    .populate('assignedTo', 'fullName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Enquiry.countDocuments(filter);

  apiRes.success(res, 'Enquiries fetched.', {
    enquiries,
    pagination: { page: parseInt(page), limit: parseInt(limit), total },
  });
});

exports.updateEnquiry = catchAsync(async (req, res, next) => {
  const enquiry = await Enquiry.findById(req.params.id);
  if (!enquiry) return next(new AppError('Enquiry not found.', 404));

  const allowed = ['status', 'assignedTo', 'notes', 'priority', 'nextFollowUp', 'siteVisit'];
  allowed.forEach(key => { if (req.body[key] !== undefined) enquiry[key] = req.body[key]; });

  await enquiry.save();

  apiRes.success(res, 'Enquiry updated.', { enquiry });
});

exports.logCall = catchAsync(async (req, res, next) => {
  const enquiry = await Enquiry.findById(req.params.id);
  if (!enquiry) return next(new AppError('Enquiry not found.', 404));

  const callLog = {
    calledBy: req.user._id,
    calledAt: new Date(),
    duration: req.body.duration,
    outcome: req.body.outcome,
    notes: req.body.notes,
    followUpDate: req.body.followUpDate,
  };

  enquiry.callLogs.push(callLog);
  if (req.body.followUpDate) enquiry.nextFollowUp = req.body.followUpDate;
  if (req.body.status) enquiry.status = req.body.status;

  await enquiry.save();

  apiRes.success(res, 'Call logged.', { enquiry });
});

// ─── Deal Pipeline ────────────────────────────────────────

exports.getAllDeals = catchAsync(async (req, res) => {
  const { stage, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (stage) filter.stage = stage;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const deals = await Deal.find(filter)
    .populate('buyer', 'fullName mobile')
    .populate('seller', 'fullName mobile')
    .populate('listing', 'propertyType location.city askingPrice')
    .populate('project', 'projectName')
    .populate('managedBy', 'fullName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Deal.countDocuments(filter);

  apiRes.success(res, 'Deals fetched.', {
    deals,
    pagination: { page: parseInt(page), limit: parseInt(limit), total },
  });
});

exports.createDeal = catchAsync(async (req, res) => {
  const deal = await Deal.create({
    ...req.body,
    managedBy: req.user._id,
  });

  apiRes.created(res, 'Deal created.', { deal });
});

exports.updateDeal = catchAsync(async (req, res, next) => {
  const deal = await Deal.findById(req.params.id);
  if (!deal) return next(new AppError('Deal not found.', 404));

  const allowed = ['stage', 'dealValue', 'commissionRate', 'commissionStatus', 'notes'];
  allowed.forEach(key => { if (req.body[key] !== undefined) deal[key] = req.body[key]; });

  if (req.body.stage === 'closed_won') {
    deal.closedAt = new Date();
    deal.closedBy = req.user._id;
  }

  await deal.save();

  apiRes.success(res, 'Deal updated.', { deal });
});

// ─── User Management ──────────────────────────────────────

exports.getAllUsers = catchAsync(async (req, res) => {
  const { role, crmTag, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (crmTag) filter.crmTag = crmTag;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const users = await User.find(filter)
    .select('-password -refreshToken')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await User.countDocuments(filter);

  apiRes.success(res, 'Users fetched.', {
    users,
    pagination: { page: parseInt(page), limit: parseInt(limit), total },
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found.', 404));

  const allowed = ['crmTag', 'isActive', 'isBlocked', 'blockedReason'];
  allowed.forEach(key => { if (req.body[key] !== undefined) user[key] = req.body[key]; });

  if (req.body.crmNotes) {
    user.crmNotes.push({ note: req.body.crmNotes, addedBy: req.user._id });
  }

  await user.save();

  apiRes.success(res, 'User updated.', { user });
});

// ─── Analytics & Reports ──────────────────────────────────

exports.getDashboard = catchAsync(async (req, res) => {
  const [
    totalListings,
    activeListings,
    pendingListings,
    totalProjects,
    totalEnquiries,
    newEnquiries,
    totalDeals,
    dealsInProgress,
    dealsClosedThisMonth,
    totalUsers,
  ] = await Promise.all([
    Listing.countDocuments(),
    Listing.countDocuments({ status: 'active' }),
    Listing.countDocuments({ status: 'pending_review', 'serviceFee.status': 'paid' }),
    Project.countDocuments({ status: 'active' }),
    Enquiry.countDocuments(),
    Enquiry.countDocuments({ status: 'new' }),
    Deal.countDocuments(),
    Deal.countDocuments({ stage: { $in: ['deal_in_progress', 'site_visit_scheduled'] } }),
    Deal.countDocuments({
      stage: 'closed_won',
      closedAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
    }),
    User.countDocuments(),
  ]);

  const months = [];
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    let d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ monthStr: monthNames[d.getMonth()], year: d.getFullYear(), month: d.getMonth() + 1 });
  }

  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const listingsAggr = await Listing.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, count: { $sum: 1 } } }
  ]);

  const dealsAggr = await Deal.aggregate([
    { $match: { closedAt: { $gte: sixMonthsAgo }, stage: 'closed_won' } },
    { $group: { _id: { y: { $year: '$closedAt' }, m: { $month: '$closedAt' } }, count: { $sum: 1 }, val: { $sum: '$dealValue' } } }
  ]);

  const monthlyData = months.map(m => {
    const l = listingsAggr.find(x => x._id.y === m.year && x._id.m === m.month);
    const d = dealsAggr.find(x => x._id.y === m.year && x._id.m === m.month);
    const listingCount = l ? l.count : 0;
    const dealCount = d ? d.count : 0;
    const revFromListings = listingCount * 15000;
    const revFromDeals = d && d.val ? d.val * 0.03 : 0; 
    const totalRevLakhs = (revFromListings + revFromDeals) / 100000;
    return {
      month: m.monthStr,
      listings: listingCount,
      deals: dealCount,
      revenue: parseFloat(totalRevLakhs.toFixed(2)) || 0
    };
  });

  const propertyTypesAggr = await Listing.aggregate([
    { $group: { _id: '$propertyType', count: { $sum: 1 } } }
  ]);

  let pieMap = { Plots: 0, Flats: 0, Houses: 0, Commercial: 0, Other: 0 };
  let totalPropertiesForPie = 0;
  propertyTypesAggr.forEach(pt => {
    totalPropertiesForPie += pt.count;
    if (['plot'].includes(pt._id)) pieMap.Plots += pt.count;
    else if (['flat', '1rk', 'builder_floor'].includes(pt._id)) pieMap.Flats += pt.count;
    else if (['house', 'farmhouse'].includes(pt._id)) pieMap.Houses += pt.count;
    else if (['shop', 'office', 'warehouse'].includes(pt._id)) pieMap.Commercial += pt.count;
    else pieMap.Other += pt.count;
  });

  let pieData = [];
  if (totalPropertiesForPie === 0) {
    pieData = [ { name: 'Plots', value: 35 }, { name: 'Flats', value: 28 }, { name: 'Houses', value: 18 }, { name: 'Commercial', value: 12 }, { name: 'Other', value: 7 } ];
  } else {
    for (let k in pieMap) {
      if (pieMap[k] > 0) pieData.push({ name: k, value: parseFloat(((pieMap[k] / totalPropertiesForPie) * 100).toFixed(1)) });
    }
  }

  const stats = {
    listings: { total: totalListings, active: activeListings, pending: pendingListings },
    projects: { total: totalProjects },
    enquiries: { total: totalEnquiries, new: newEnquiries },
    deals: { total: totalDeals, inProgress: dealsInProgress, closedThisMonth: dealsClosedThisMonth },
    users: { total: totalUsers },
    monthlyData,
    pieData
  };

  apiRes.success(res, 'Dashboard stats fetched.', stats);
});
