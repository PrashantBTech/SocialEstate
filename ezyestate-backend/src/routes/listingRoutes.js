const express = require('express');
const listingController = require('../controllers/listingController');
const { protect, optionalAuth } = require('../middleware/auth');
const { uploadListingPhotos } = require('../middleware/upload');

const router = express.Router();

router.get('/', optionalAuth, listingController.getListings);
router.get('/my-listings', protect, listingController.getMyListings);
router.get('/:id', optionalAuth, listingController.getListingById);

router.post('/', protect, listingController.createListing);
router.patch('/:id', protect, listingController.updateListing);

router.post('/:id/upload-photos', protect, uploadListingPhotos, listingController.uploadPhotos);
router.delete('/:id/photos/:photoId', protect, listingController.deletePhoto);

router.post('/:id/pay-service-fee', protect, listingController.payServiceFee);
router.post('/:id/enquire', protect, listingController.createEnquiry);
router.post('/:id/shortlist', protect, listingController.toggleShortlist);

module.exports = router;
