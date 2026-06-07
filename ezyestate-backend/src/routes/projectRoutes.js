const express = require('express');
const projectController = require('../controllers/projectController');
const { protect, optionalAuth } = require('../middleware/auth');
const { uploadBuilderImages } = require('../middleware/upload');

const router = express.Router();

router.get('/', optionalAuth, projectController.getProjects);
router.get('/my-projects', protect, projectController.getMyProjects);
router.get('/:id', optionalAuth, projectController.getProjectById);

router.post('/', protect, projectController.createProject);
router.patch('/:id', protect, projectController.updateProject);
router.post('/:id/upload-images', protect, uploadBuilderImages, projectController.uploadImages);

router.post('/:id/enquire', protect, projectController.createEnquiry);
router.post('/:id/shortlist', protect, projectController.toggleShortlist);

module.exports = router;
