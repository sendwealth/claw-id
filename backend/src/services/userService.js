/**
 * User Service - User authentication and JWT management
 * Part of CLAW ID backend system
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const cache = require('../utils/cache');

const BCRYPT_SALT_ROUNDS = 10;
const JWT_EXPIRES_IN = '7d';

/**
 * Register a new user
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {string} email - User email
 * @param {string} password - User password (plain text)
 * @param {string} name - User name (optional)
 * @returns {Object} Created user (without password hash)
 */
async function registerUser(prisma, email, password, name = null) {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  // Validate password strength (min 8 chars, at least 1 letter and 1 number)
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  if (!/[a-zA-Z]/.test(password)) {
    throw new Error('Password must contain at least one letter');
  }
  if (!/[0-9]/.test(password)) {
    throw new Error('Password must contain at least one number');
  }

  // Check if email already exists
  const existingUser = await prisma.users.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new Error('Email already registered');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  // Generate API key
  const apiKey = `claw_user_${uuidv4().replace(/-/g, '')}`;

  // Create user
  const user = await prisma.users.create({
    data: {
      id: uuidv4(),
      email: email.toLowerCase().trim(),
      passwordHash,
      name: name?.trim() || null,
      apiKey,
      role: 'USER',
      updatedAt: new Date()
    }
  });

  logger.info('User registered successfully', { 
    userId: user.id, 
    email: user.email 
  });

  // Return user without password hash
  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Login user and generate JWT token
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {string} email - User email
 * @param {string} password - User password (plain text)
 * @returns {Object} User info and JWT token
 */
async function loginUser(prisma, email, password) {
  // Find user by email
  const user = await prisma.users.findUnique({
    where: { email: email.toLowerCase().trim() }
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    logger.warn('Failed login attempt', { email: user.email });
    throw new Error('Invalid email or password');
  }

  // Generate JWT token
  const token = generateJWT(user.id);

  logger.info('User logged in successfully', { userId: user.id, email: user.email });

  // Return user without password hash
  const { passwordHash: _, ...userWithoutPassword } = user;
  return {
    user: userWithoutPassword,
    token
  };
}

/**
 * Get user by ID
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {string} userId - User ID
 * @returns {Object} User info (without password hash)
 */
async function getUserById(prisma, userId) {
  // Try to get from cache first
  const cacheKey = `user:${userId}`;
  const cached = await cache.get(cacheKey);
  
  if (cached) {
    return cached;
  }

  // Query from database
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: { agents: true }
      }
    }
  });

  if (!user) {
    return null;
  }

  // Return user without password hash
  const { passwordHash: _, ...userWithoutPassword } = user;
  const result = {
    ...userWithoutPassword,
    agentCount: user._count.agents
  };

  // Cache for 5 minutes
  await cache.set(cacheKey, result, 300);

  return result;
}

/**
 * Generate JWT token for user
 * @param {string} userId - User ID
 * @returns {string} JWT token
 */
function generateJWT(userId) {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.sign(
    { userId },
    secret,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verify JWT token and extract user ID
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
function verifyJWT(token) {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }

  try {
    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
}

/**
 * Update user information
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Object} Updated user (without password hash)
 */
async function updateUser(prisma, userId, updates) {
  const allowedFields = ['name'];
  const updateData = {};

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      updateData[field] = updates[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error('No valid fields to update');
  }

  updateData.updatedAt = new Date();

  const user = await prisma.users.update({
    where: { id: userId },
    data: updateData
  });

  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Change user password
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {string} userId - User ID
 * @param {string} oldPassword - Current password
 * @param {string} newPassword - New password
 */
async function changePassword(prisma, userId, oldPassword, newPassword) {
  // Get user
  const user = await prisma.users.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Verify old password
  const isValidPassword = await bcrypt.compare(oldPassword, user.passwordHash);

  if (!isValidPassword) {
    throw new Error('Current password is incorrect');
  }

  // Validate new password
  if (newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  if (!/[a-zA-Z]/.test(newPassword)) {
    throw new Error('Password must contain at least one letter');
  }
  if (!/[0-9]/.test(newPassword)) {
    throw new Error('Password must contain at least one number');
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

  // Update password
  await prisma.users.update({
    where: { id: userId },
    data: {
      passwordHash,
      updatedAt: new Date()
    }
  });

  logger.info('Password changed successfully', { userId });

  return { message: 'Password changed successfully' };
}

module.exports = {
  registerUser,
  loginUser,
  getUserById,
  generateJWT,
  verifyJWT,
  updateUser,
  changePassword
};
