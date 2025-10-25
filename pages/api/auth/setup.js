import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ username: 'BenGlobal' });
    
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('08068609964', 10);

    // Create user
    const user = await User.create({
      username: 'BenGlobal',
      password: hashedPassword,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}