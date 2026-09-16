const mongoose = require('mongoose');
const User = require('../models/User');

const defaultAdminEmail = 'pamithkumaranayaka@gmail.com';
const defaultAdminPass = '$2a$10$uOpLOnmOuXBfWumR1sjr3Ox49DMyPQEQrzwLm0hJuzoU7AM1XZwW.'; // bcrypt hash for '45973568'

async function seedAdminUser() {
  try {
    const existing = await User.findOne({ email: defaultAdminEmail });
    if (!existing) {
      await User.create({
        name: 'Pamith Mandiv',
        email: defaultAdminEmail,
        password: defaultAdminPass,
        role: 'admin',
        phone: '+94 77 123 4567',
        artist_name: "SINCE'20 Admin",
        country: 'Sri Lanka'
      });
      console.log("Default admin account seeded: pamithkumaranayaka@gmail.com");
    } else {
      // Ensure password hash is up-to-date
      if (existing.password !== defaultAdminPass) {
        existing.password = defaultAdminPass;
        await existing.save();
      }
    }
  } catch (err) {
    console.error("Error seeding default admin account:", err.message);
  }
}

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/since20_db';
  try {
    await mongoose.connect(uri);
    console.log(`Connected to MongoDB successfully at: ${uri.replace(/:\/\/.*@/, '://***:***@')}`);
    await seedAdminUser();
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    console.error('Please ensure MongoDB is running or specify a valid MONGODB_URI in backend/.env');
  }
}

module.exports = {
  connectDB,
  mongoose
};
