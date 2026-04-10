require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Product = require('./src/models/Product');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Create demo seller
  let seller = await User.findOne({ email: 'seller@dikhaao.pk' });
  if (!seller) {
    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash('seller123', salt);
    seller = await User.create({
      name: 'Dikhaao Store',
      email: 'seller@dikhaao.pk',
      password: hashed,
      role: 'seller',
      city: 'Lahore',
      isActive: true,
      isVerified: true,
      sellerProfile: {
        storeName: 'Dikhaao Official Store',
        storeDescription: 'Pakistan ki best online store',
        category: 'fashion',
        isVerified: true,
        rating: 4.8,
        totalSales: 1200,
      }
    });
    console.log('✅ Demo seller created: seller@dikhaao.pk / seller123');
  } else {
    console.log('ℹ️  Seller already exists');
  }

  // Delete old seed products
  await Product.deleteMany({ seller: seller._id });

  const products = [
    {
      name: 'Women Lawn Suit (3-Piece)',
      nameUrdu: 'خواتین لان سوٹ',
      description: 'Beautiful embroidered lawn suit, perfect for summer. Includes shirt, dupatta, and trouser.',
      category: 'fashion',
      price: 3500,
      salePrice: 2800,
      stock: 50,
      codAvailable: true,
      freeShipping: true,
      rating: 4.7,
      reviewCount: 128,
      totalSold: 340,
      influencerCommission: 10,
      tags: ['lawn', 'suit', 'summer', 'women'],
      thumbnail: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400',
    },
    {
      name: 'Men Shalwar Kameez (Eid Collection)',
      nameUrdu: 'مردوں کا شلوار قمیض',
      description: 'Premium quality cotton shalwar kameez, ideal for Eid and formal occasions.',
      category: 'fashion',
      price: 4200,
      salePrice: 3500,
      stock: 30,
      codAvailable: true,
      freeShipping: false,
      rating: 4.5,
      reviewCount: 89,
      totalSold: 210,
      influencerCommission: 10,
      tags: ['shalwar', 'kameez', 'eid', 'men'],
      thumbnail: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400',
    },
    {
      name: 'Skin Whitening Cream (Original)',
      nameUrdu: 'سکن وائٹننگ کریم',
      description: 'Dermatologist tested skin whitening and brightening cream. Safe for all skin types.',
      category: 'beauty',
      price: 1200,
      salePrice: 950,
      stock: 100,
      codAvailable: true,
      freeShipping: true,
      rating: 4.3,
      reviewCount: 204,
      totalSold: 890,
      influencerCommission: 15,
      tags: ['cream', 'skin', 'beauty', 'whitening'],
      thumbnail: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
    },
    {
      name: 'iPhone 15 Back Cover',
      nameUrdu: 'آئی فون 15 کور',
      description: 'Premium silicone back cover for iPhone 15. Shockproof and durable.',
      category: 'electronics',
      price: 800,
      stock: 200,
      codAvailable: true,
      freeShipping: true,
      rating: 4.6,
      reviewCount: 56,
      totalSold: 430,
      influencerCommission: 8,
      tags: ['iphone', 'cover', 'mobile', 'accessories'],
      thumbnail: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400',
      variants: [{ name: 'Color', options: [{ value: 'Black' }, { value: 'Clear' }, { value: 'Blue' }] }]
    },
    {
      name: 'Non-Stick Cookware Set (5 Pieces)',
      nameUrdu: 'نان اسٹک برتن سیٹ',
      description: 'Complete 5-piece non-stick cookware set for Pakistani kitchen. Includes karahi, pots, and pan.',
      category: 'home',
      price: 5500,
      salePrice: 4200,
      stock: 25,
      codAvailable: true,
      freeShipping: false,
      rating: 4.8,
      reviewCount: 312,
      totalSold: 760,
      influencerCommission: 10,
      tags: ['cookware', 'kitchen', 'nonstick', 'home'],
      thumbnail: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400',
    },
    {
      name: 'Kids School Bag (Durable)',
      nameUrdu: 'بچوں کا اسکول بیگ',
      description: 'Lightweight and durable school bag for kids. Multiple compartments, ergonomic design.',
      category: 'kids',
      price: 1800,
      salePrice: 1400,
      stock: 75,
      codAvailable: true,
      freeShipping: true,
      rating: 4.4,
      reviewCount: 98,
      totalSold: 280,
      influencerCommission: 10,
      tags: ['school', 'bag', 'kids', 'children'],
      thumbnail: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
      variants: [{ name: 'Color', options: [{ value: 'Blue' }, { value: 'Red' }, { value: 'Pink' }] }]
    },
    {
      name: 'Cricket Bat (Full Size)',
      nameUrdu: 'کرکٹ بیٹ',
      description: 'Professional grade Kashmir willow cricket bat. Perfect for gully cricket and club play.',
      category: 'sports',
      price: 3200,
      stock: 40,
      codAvailable: true,
      freeShipping: false,
      rating: 4.6,
      reviewCount: 145,
      totalSold: 390,
      influencerCommission: 8,
      tags: ['cricket', 'bat', 'sports', 'pakistan'],
      thumbnail: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400',
    },
    {
      name: 'Desi Ghee (1kg Pure)',
      nameUrdu: 'دیسی گھی خالص',
      description: 'Pure desi ghee from fresh cow milk. No additives, no preservatives. Direct from farm.',
      category: 'food',
      price: 2800,
      stock: 60,
      codAvailable: true,
      freeShipping: true,
      rating: 4.9,
      reviewCount: 278,
      totalSold: 1100,
      influencerCommission: 8,
      tags: ['ghee', 'desi', 'food', 'organic'],
      thumbnail: 'https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?w=400',
    },
    {
      name: 'Ladies Handbag (Premium)',
      nameUrdu: 'لیڈیز ہینڈ بیگ',
      description: 'Stylish premium quality handbag for women. PU leather, multiple pockets.',
      category: 'fashion',
      price: 2500,
      salePrice: 1999,
      stock: 35,
      codAvailable: true,
      freeShipping: true,
      rating: 4.5,
      reviewCount: 167,
      totalSold: 520,
      influencerCommission: 12,
      tags: ['handbag', 'ladies', 'fashion', 'bag'],
      thumbnail: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400',
      variants: [{ name: 'Color', options: [{ value: 'Black' }, { value: 'Brown' }, { value: 'Maroon' }] }]
    },
    {
      name: 'Wireless Earbuds (TWS)',
      nameUrdu: 'وائرلیس ائربڈز',
      description: 'True wireless stereo earbuds with 20hr battery life. Compatible with all devices.',
      category: 'electronics',
      price: 2200,
      salePrice: 1750,
      stock: 80,
      codAvailable: true,
      freeShipping: true,
      rating: 4.4,
      reviewCount: 234,
      totalSold: 670,
      influencerCommission: 10,
      tags: ['earbuds', 'wireless', 'tws', 'audio'],
      thumbnail: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400',
    },
  ];

  const created = await Product.insertMany(
    products.map(p => ({ ...p, seller: seller._id, isActive: true, isApproved: true, isFeatured: true }))
  );

  console.log(`✅ ${created.length} products seeded successfully!`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
