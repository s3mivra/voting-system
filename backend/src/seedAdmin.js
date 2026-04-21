const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@voting-system.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = bcrypt.hashSync('Sup3rAdm!n123', 10);
    const admin = await User.create({
      email: 'admin@voting.com',
      password: hashedPassword,
      role: 'admin',
      hasVoted: false,
      isScreened: true,
      profile: {
        name: 'System Administrator',
        department: 'IT',
        age: 30,
        employeeId: 'ADMIN001',
      },
    });

    console.log('Admin user created successfully');
    console.log('Email: admin@voting-system.com');
    console.log('Password: admin123');
    console.log('Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
