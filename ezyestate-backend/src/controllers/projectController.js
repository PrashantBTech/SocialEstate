const Project = require('../models/Project');
const Enquiry = require('../models/Enquiry');
const User = require('../models/User');
const { createOrder } = require('../services/paymentService');
const { notify } = require('../services/notificationService');
const cache = require('../services/cacheService');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const apiRes = require('../utils/apiResponse');

// POST /projects - Create project
exports.createProject = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'builder') return next(new AppError('Only builders can create projects.', 403));

  const projectData = {
    ...req.body,
    builder: req.user._id,
    companyName: req.user.builderProfile?.companyName || req.body.companyName,
    builderLogo: req.user.builderProfile?.logo,
    totalProjectsCompleted: req.user.builderProfile?.totalProjectsCompleted || 0,
    status: 'pending_review',
  };

  const project = await Project.create(projectData);
  apiRes.created(res, 'Project created. Please complete payment to go live.', { project });
});

// PATCH /projects/:id
exports.updateProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new AppError('Project not found.', 404));
  if (project.builder.toString() !== req.user._id.toString()) return next(new AppError('Not authorized.', 403));

  const allowed = ['projectName', 'location', 'amenities', 'unitTypes', 'availableUnits', 'expectedPossessionDate'];
  allowed.forEach(key => { if (req.body[key] !== undefined) project[key] = req.body[key]; });

  await project.save();
  await cache.delPattern('projects:*');

  apiRes.success(res, 'Project updated.', { project });
});

// POST /projects/:id/upload-images
exports.uploadImages = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new AppError('Project not found.', 404));
  if (project.builder.toString() !== req.user._id.toString()) return next(new AppError('Not authorized.', 403));

  if (req.files.logo) project.builderLogo = req.files.logo[0].path;
  if (req.files.bannerImage) project.bannerImage = req.files.bannerImage[0].path;
  if (req.files.images) {
    const newImages = req.files.images.map(f => ({ url: f.path, publicId: f.filename }));
    project.images.push(...newImages);
  }

  await project.save();
  apiRes.success(res, 'Images uploaded.', { project });
});

// GET /projects/my-projects
exports.getMyProjects = catchAsync(async (req, res) => {
  const projects = await Project.find({ builder: req.user._id }).sort({ createdAt: -1 });
  apiRes.success(res, 'Your projects fetched.', { projects, count: projects.length });
});

// GET /projects/:id
exports.getProjectById = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id).populate('builder', 'builderProfile fullName');
  if (!project) return next(new AppError('Project not found.', 404));

  project.views += 1;
  await project.save({ validateBeforeSave: false });

  apiRes.success(res, 'Project details fetched.', { project });
});

// GET /projects - Public feed
exports.getProjects = catchAsync(async (req, res) => {
  const { city, projectStatus, projectType, sort = '-createdAt', page = 1, limit = 20 } = req.query;

  const cacheKey = `projects:${JSON.stringify(req.query)}`;
  const cached = await cache.get(cacheKey);
  if (cached) return apiRes.success(res, 'Projects fetched (cached).', cached);

  const filter = { status: 'active' };
  if (city) filter['location.city'] = new RegExp(city, 'i');
  if (projectStatus) filter.projectStatus = projectStatus;
  if (projectType) filter.projectType = projectType;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const projects = await Project.find(filter).sort(sort).skip(skip).limit(parseInt(limit)).lean();
  const total = await Project.countDocuments(filter);

  const result = {
    projects,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
  };

  await cache.set(cacheKey, result, 180);
  apiRes.success(res, 'Projects fetched.', result);
});

// POST /projects/:id/enquire
exports.createEnquiry = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'buyer') return next(new AppError('Only buyers can express interest.', 403));

  const project = await Project.findById(req.params.id);
  if (!project) return next(new AppError('Project not found.', 404));
  if (project.status !== 'active') return next(new AppError('This project is not available.', 400));

  const existing = await Enquiry.findOne({ buyer: req.user._id, project: project._id });
  if (existing) return next(new AppError('You have already expressed interest in this project.', 400));

  const enquiry = await Enquiry.create({
    buyer: req.user._id,
    project: project._id,
    unitType: req.body.unitType,
    buyerSnapshot: { name: req.user.fullName, mobile: req.user.mobile, email: req.user.email },
    source: 'platform',
  });

  project.enquiryCount += 1;
  await project.save({ validateBeforeSave: false });

  await notify({
    recipientId: project.builder,
    type: 'new_enquiry',
    title: 'New Project Interest',
    message: `${req.user.fullName} is interested in ${project.projectName}.`,
    data: { projectId: project._id, enquiryId: enquiry._id },
  });

  apiRes.created(res, 'Interest registered. Our team will contact you soon.', { enquiry });
});

// POST /projects/:id/shortlist
exports.toggleShortlist = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  const index = user.shortlistedProjects.indexOf(req.params.id);
  if (index > -1) {
    user.shortlistedProjects.splice(index, 1);
    await user.save();
    return apiRes.success(res, 'Removed from shortlist.');
  }
  user.shortlistedProjects.push(req.params.id);
  await user.save();
  apiRes.success(res, 'Added to shortlist.');
});
