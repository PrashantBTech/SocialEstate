const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Listing = mongoose.model('Listing', new mongoose.Schema({}, {strict: false}), 'listings');
  
  // Find listings without coordinates
  const listings = await Listing.find({'location.coordinates.coordinates': {$exists: false}});
  console.log(`Found ${listings.length} listings missing coordinates.`);
  
  for (let listing of listings) {
    const loc = listing.get('location');
    if (loc && loc.locality && loc.city) {
      const addressString = `${loc.locality}, ${loc.city}, ${loc.state || ''}, India`;
      console.log(`Geocoding: ${addressString}`);
      
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressString)}&format=json&limit=1`, {
          headers: { 'User-Agent': 'SocialEstate/1.0 (contact@socialestate.com)' }
        });
        const data = await response.json();
        
        if (data && data.length > 0) {
          await Listing.updateOne(
            { _id: listing._id },
            { $set: { 'location.coordinates': { type: 'Point', coordinates: [parseFloat(data[0].lon), parseFloat(data[0].lat)] } } }
          );
          console.log(`Updated coordinates for ${listing._id}`);
        } else {
          console.log(`No results found for ${addressString}`);
        }
      } catch (err) {
        console.error('Error fetching', err.message);
      }
      
      // Delay to respect Nominatim API rate limits
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  console.log('Done updating listings.');
  await mongoose.disconnect();
}).catch(console.error);
