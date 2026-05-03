import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cogniva';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  full_name: { type: String, default: '' },
  role: { type: String, enum: ['student', 'faculty'], default: 'student' },
  is_active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

async function seed() {
  try {
    console.log('⏳ Connecting to MongoDB...');
    const conn = await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log(`📍 Connection Host: ${conn.connection.host}`);
    console.log(`📍 Database Name: ${conn.connection.name}`);

    const email = 'faculty@cogniva.com';
    const password = 'Password123';
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('⚠️ Faculty user already exists. Updating password...');
      existingUser.password = await bcrypt.hash(password, 10);
      await existingUser.save();
      console.log('✅ Password updated successfully');
    } else {
      console.log('👤 Creating mock faculty user...');
      const hashedPassword = await bcrypt.hash(password, 10);
      await User.create({
        email,
        password: hashedPassword,
        full_name: 'Dr. Cogniva (Faculty)',
        role: 'faculty'
      });
      console.log('✅ Faculty user created successfully');
    }

    console.log('\n-----------------------------------');
    console.log('Login Credentials:');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log('-----------------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seed();
