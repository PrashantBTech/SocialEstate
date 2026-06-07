const express = require('express');
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// All admin routes require admin/superadmin role
router.use(protect, restrictTo('admin', 'superadmin'));

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Listings
router.get('/listings', adminController.getAllListings);
router.patch('/listings/:id/approve', adminController.approveListing);
router.patch('/listings/:id/reject', adminController.rejectListing);
router.patch('/listings/:id/approve-edit', adminController.approveEdit);
router.patch('/listings/:id/reject-edit', adminController.rejectEdit);
router.patch('/listings/:id/feature', adminController.toggleFeature);

// Projects
router.get('/projects', adminController.getAllProjects);
router.patch('/projects/:id/approve', adminController.approveProject);
router.patch('/projects/:id/reject', adminController.rejectProject);

// Enquiries
router.get('/enquiries', adminController.getAllEnquiries);
router.patch('/enquiries/:id', adminController.updateEnquiry);
router.post('/enquiries/:id/log-call', adminController.logCall);

// Deals
router.get('/deals', adminController.getAllDeals);
router.post('/deals', adminController.createDeal);
router.patch('/deals/:id', adminController.updateDeal);

// Users
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id', adminController.updateUser);

module.exports = router;
