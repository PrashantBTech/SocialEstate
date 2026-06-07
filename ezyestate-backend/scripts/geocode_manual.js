const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Listing = mongoose.model('Listing', new mongoose.Schema({}, {strict: false}), 'listings');
  
  // Set fallback coordinates for Paonta Sahib listings that Nominatim couldn't find
  const result = await Listing.updateMany(
    { 'location.city': 'Paonta Sahib', 'location.coordinates.coordinates': { $exists: false } },
    { $set: { 'location.coordinates': { type: 'Point', coordinates: [77.6144, 30.4556] } } }
  );
  
  console.log('Fixed', result.modifiedCount, 'listings manually');
  await mongoose.disconnect();
}).catch(console.error);
