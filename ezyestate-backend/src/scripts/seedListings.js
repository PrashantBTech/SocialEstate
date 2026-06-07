/**
 * Seed Script — Creates a fake owner + 6 active listings
 * Run: node src/scripts/seedListings.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Listing = require('../models/Listing');

const MONGO_URI = process.env.MONGO_URI;

const OWNER = {
  fullName: 'Rajesh Sharma',
  mobile: '9876543210',
  email: 'rajesh.sharma@demo.com',
  password: 'Demo@1234',
  role: 'owner',
  isMobileVerified: true,
  isActive: true,
  location: { city: 'Bhopal', state: 'Madhya Pradesh', pincode: '462016' },
};

const LISTINGS = [
  {
    intent: 'sell',
    propertyCategory: 'residential',
    propertyType: 'flat',
    askingPrice: 4500000,
    isPriceNegotiable: true,
    possessionStatus: 'ready',
    location: { state: 'Madhya Pradesh', city: 'Bhopal', locality: 'Arera Colony', pincode: '462016', landmark: 'Near DB Mall' },
    totalArea: { value: 1250, unit: 'sqft' },
    builtupArea: { value: 1100, unit: 'sqft' },
    bedrooms: '3bhk',
    bathrooms: 2,
    floors: '4th',
    totalFloorsInBuilding: 10,
    facing: 'east',
    propertyAge: 'lt5',
    description: 'Spacious 3BHK flat in the heart of Arera Colony with premium fittings, modular kitchen, and stunning city views. Walking distance to schools, hospitals, and DB Mall.',
    ownershipType: 'freehold',
    documentsAvailable: ['registry', 'noc', 'map'],
    amenities: { parking: { available: true, type: 'car' }, powerBackup: 'yes', waterSupply: 'both', isGatedSociety: true, loanAvailable: 'yes', nearbyLandmarks: 'DB Mall, AIIMS Bhopal, Habibganj Station' },
    photos: [
      { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop', caption: 'Living Room' },
      { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', caption: 'Master Bedroom' },
      { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop', caption: 'Kitchen' },
    ],
    isVerified: true,
    isFeatured: true,
    propertyScore: 85,
  },
  {
    intent: 'sell',
    propertyCategory: 'residential',
    propertyType: 'house',
    askingPrice: 12500000,
    isPriceNegotiable: false,
    possessionStatus: 'ready',
    location: { state: 'Madhya Pradesh', city: 'Indore', locality: 'Vijay Nagar', pincode: '452010', landmark: 'Near C21 Mall' },
    totalArea: { value: 2400, unit: 'sqft' },
    builtupArea: { value: 2000, unit: 'sqft' },
    bedrooms: '4bhk+',
    bathrooms: 4,
    floors: 'Ground + 1',
    totalFloorsInBuilding: 2,
    facing: 'north',
    propertyAge: 'new',
    description: 'Brand new independent bungalow in prime Vijay Nagar locality. Italian marble flooring, spacious lawn, modular kitchen with chimney, and servant quarters. Best for families.',
    ownershipType: 'freehold',
    documentsAvailable: ['registry', 'noc', 'mutation', 'map'],
    amenities: { parking: { available: true, type: 'both' }, powerBackup: 'yes', waterSupply: 'both', isGatedSociety: false, loanAvailable: 'yes', nearbyLandmarks: 'C21 Mall, Bombay Hospital, Sapna Sangeeta' },
    photos: [
      { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop', caption: 'Front View' },
      { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop', caption: 'Living Hall' },
      { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop', caption: 'Garden' },
    ],
    isVerified: true,
    isFeatured: true,
    propertyScore: 92,
  },
  {
    intent: 'sell',
    propertyCategory: 'residential',
    propertyType: 'plot',
    askingPrice: 3200000,
    isPriceNegotiable: true,
    possessionStatus: 'ready',
    location: { state: 'Madhya Pradesh', city: 'Bhopal', locality: 'Kolar Road', pincode: '462042', landmark: 'Near People\'s Mall' },
    totalArea: { value: 1500, unit: 'sqft' },
    bedrooms: 'na',
    facing: 'corner',
    roadWidth: 40,
    propertyAge: 'new',
    description: 'Corner plot with 40ft road in a rapidly developing area of Kolar Road. Clear title, ready for construction. 5 minutes from People\'s Mall and upcoming metro station.',
    ownershipType: 'freehold',
    documentsAvailable: ['registry', 'mutation', 'map'],
    amenities: { loanAvailable: 'yes', nearbyLandmarks: 'People\'s Mall, Ayodhya Bypass, Metro Station (upcoming)' },
    photos: [
      { url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop', caption: 'Plot View' },
      { url: 'https://images.unsplash.com/photo-1628624747186-a941c476b7ef?w=800&h=600&fit=crop', caption: 'Road View' },
    ],
    isVerified: true,
    isFeatured: false,
    propertyScore: 72,
  },
  {
    intent: 'rent',
    propertyCategory: 'residential',
    propertyType: 'flat',
    askingPrice: 18000,
    isPriceNegotiable: true,
    possessionStatus: 'ready',
    location: { state: 'Madhya Pradesh', city: 'Bhopal', locality: 'MP Nagar', pincode: '462011', landmark: 'Near DB City Mall' },
    totalArea: { value: 950, unit: 'sqft' },
    builtupArea: { value: 850, unit: 'sqft' },
    bedrooms: '2bhk',
    bathrooms: 2,
    floors: '7th',
    totalFloorsInBuilding: 12,
    facing: 'south',
    propertyAge: 'lt5',
    description: 'Fully furnished 2BHK flat available for rent in MP Nagar Zone 2. AC in both bedrooms, washing machine, fridge, and TV included. Ideal for working professionals.',
    ownershipType: 'freehold',
    documentsAvailable: ['registry'],
    amenities: { parking: { available: true, type: 'car' }, powerBackup: 'yes', waterSupply: 'municipal', isGatedSociety: true, loanAvailable: 'no', nearbyLandmarks: 'DB City Mall, MP Nagar Bus Stop, TCS Office' },
    photos: [
      { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop', caption: 'Living Area' },
      { url: 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&h=600&fit=crop', caption: 'Bedroom' },
      { url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop', caption: 'Kitchen' },
    ],
    isVerified: true,
    isFeatured: false,
    propertyScore: 78,
  },
  {
    intent: 'sell',
    propertyCategory: 'commercial',
    propertyType: 'shop',
    askingPrice: 6800000,
    isPriceNegotiable: false,
    possessionStatus: 'ready',
    location: { state: 'Madhya Pradesh', city: 'Indore', locality: 'Palasia Square', pincode: '452001', landmark: 'Near Treasure Island Mall' },
    totalArea: { value: 600, unit: 'sqft' },
    builtupArea: { value: 580, unit: 'sqft' },
    bedrooms: 'na',
    bathrooms: 1,
    floors: 'Ground',
    facing: 'west',
    propertyAge: '5to10',
    description: 'Prime ground-floor commercial shop at Palasia Square with heavy footfall. Currently rented at ₹35,000/month — great investment opportunity. Glass facade, AC fitted.',
    ownershipType: 'freehold',
    documentsAvailable: ['registry', 'noc'],
    amenities: { parking: { available: true, type: 'car' }, powerBackup: 'yes', waterSupply: 'municipal', isGatedSociety: false, loanAvailable: 'yes', nearbyLandmarks: 'Treasure Island Mall, Palasia Metro, Rajwada' },
    photos: [
      { url: 'https://images.unsplash.com/photo-1582037928769-181f2644ecb7?w=800&h=600&fit=crop', caption: 'Shop Front' },
      { url: 'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=800&h=600&fit=crop', caption: 'Interior' },
    ],
    isVerified: true,
    isFeatured: true,
    propertyScore: 80,
  },
  {
    intent: 'sell',
    propertyCategory: 'residential',
    propertyType: 'farmhouse',
    askingPrice: 25000000,
    isPriceNegotiable: true,
    possessionStatus: 'ready',
    location: { state: 'Madhya Pradesh', city: 'Bhopal', locality: 'Sehore Road', pincode: '462044', landmark: 'Near Kerwa Dam' },
    totalArea: { value: 5, unit: 'acres' },
    bedrooms: '4bhk+',
    bathrooms: 3,
    floors: 'Ground + 1',
    totalFloorsInBuilding: 2,
    facing: 'east',
    propertyAge: '5to10',
    description: 'Luxurious farmhouse on 5 acres with lush greenery, swimming pool, and panoramic views. Perfect weekend getaway or event venue. Fully fenced with caretaker quarters.',
    ownershipType: 'freehold',
    documentsAvailable: ['registry', 'mutation', 'map'],
    amenities: { parking: { available: true, type: 'both' }, powerBackup: 'yes', waterSupply: 'borewell', isGatedSociety: false, loanAvailable: 'not_sure', nearbyLandmarks: 'Kerwa Dam, Van Vihar National Park' },
    photos: [
      { url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop', caption: 'Farmhouse View' },
      { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop', caption: 'Pool Area' },
      { url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop', caption: 'Interior' },
    ],
    isVerified: true,
    isFeatured: true,
    propertyScore: 88,
  },
];

async function seed() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, { maxPoolSize: 5 });
    console.log('✅ Connected to MongoDB');

    // 1. Create or find the owner user
    let owner = await User.findOne({ mobile: OWNER.mobile });
    if (owner) {
      console.log(`👤 Owner already exists: ${owner.fullName} (${owner._id})`);
    } else {
      const hashedPassword = await bcrypt.hash(OWNER.password, 12);
      owner = await User.create({ ...OWNER, password: hashedPassword });
      console.log(`👤 Created owner: ${owner.fullName} (${owner._id})`);
    }

    // 2. Create listings
    let created = 0;
    for (const listingData of LISTINGS) {
      // Check if a similar listing already exists (by type + locality)
      const exists = await Listing.findOne({
        owner: owner._id,
        propertyType: listingData.propertyType,
        'location.locality': listingData.location.locality,
      });

      if (exists) {
        console.log(`⏭️  Skipped: ${listingData.propertyType} in ${listingData.location.locality} (already exists)`);
        continue;
      }

      const listing = await Listing.create({
        ...listingData,
        owner: owner._id,
        status: 'active',
        listedAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        serviceFee: { amount: 15000, status: 'paid', paidAt: new Date() },
      });

      console.log(`🏠 Created: ${listingData.propertyType} in ${listingData.location.city} — ₹${(listingData.askingPrice / 100000).toFixed(1)}L (${listing._id})`);
      created++;
    }

    console.log(`\n🎉 Done! Created ${created} new listing(s).`);
    console.log(`\n📋 Owner Login Credentials:`);
    console.log(`   Mobile: ${OWNER.mobile}`);
    console.log(`   Password: ${OWNER.password}`);
    
  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seed();
