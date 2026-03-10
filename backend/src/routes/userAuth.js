/**
 * User Authentication Routes
 * Part of CLAW ID backend system
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const userService = require('../services/userService');
const logger = require('../utils/logger');
const { InputValidator, validateRequest } = require('../middleware/validation');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: 用户注册
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: 注册成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *       400:
 *         description: 输入验证失败
 *       409:
 *         description: 邮箱已被注册
 */
/**
 * POST /api/auth/register
 * Register a new user
 * 
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "password": "password123",
 *   "name": "User Name" (optional)
 * }
 * 
 * Response:
 * {
 *   "user": { "id": "...", "email": "...", "name": "...", ... },
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 */
router.post('/register',
  validateRequest({
    email: InputValidator.validateEmail,
    password: InputValidator.validatePassword,
    name: InputValidator.validateName
  }),
  async (req, res, next) => {
    try {
      const { email, password, name } = req.body;

      // Register user
      const user = await userService.registerUser(req.prisma, email, password, name);

      // Generate JWT token
      const token = userService.generateJWT(user.id);

      logger.info('User registered successfully', {
        userId: user.id,
        email: user.email,
        ip: req.ip
      });

      res.status(201).json({
        user,
        token
      });

    } catch (error) {
      logger.error('User registration failed', {
        error: error.message,
        email: req.body.email,
        ip: req.ip
      });
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 用户登录
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *       401:
 *         description: 邮箱或密码错误
 */
/**
 * POST /api/auth/login
 * Login user and get JWT token
 * 
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "password": "password123"
 * }
 * 
 * Response:
 * {
 *   "user": { "id": "...", "email": "...", ... },
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 */
router.post('/login',
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  async (req, res, next) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: errors.array()
        });
      }

      const { email, password } = req.body;

      // Login user
      const { user, token } = await userService.loginUser(req.prisma, email, password);

      logger.info('User logged in successfully', {
        userId: user.id,
        email: user.email,
        ip: req.ip
      });

      res.status(200).json({
        user,
        token
      });

    } catch (error) {
      logger.error('User login failed', {
        error: error.message,
        email: req.body.email,
        ip: req.ip
      });
      next(error);
    }
  }
);

/**
 * GET /api/auth/me
 * Get current authenticated user information
 * 
 * Headers:
 *   Authorization: Bearer <token>
 * 
 * Response:
 * {
 *   "id": "...",
 *   "email": "...",
 *   "name": "...",
 *   "agentCount": 3,
 *   ...
 * }
 */
router.get('/me', async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'No authentication token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    let decoded;
    try {
      decoded = userService.verifyJWT(token);
    } catch (error) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: error.message
      });
    }

    // Get user information
    const user = await userService.getUserById(req.prisma, decoded.userId);

    if (!user) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    res.status(200).json(user);

  } catch (error) {
    logger.error('Get user info failed', {
      error: error.message,
      ip: req.ip
    });
    next(error);
  }
});

/**
 * PUT /api/auth/me
 * Update current user information
 * 
 * Headers:
 *   Authorization: Bearer <token>
 * 
 * Request body:
 * {
 *   "name": "New Name"
 * }
 */
router.put('/me',
  validateRequest({
    name: InputValidator.validateName
  }),
  async (req, res, next) => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'No authentication token provided'
        });
      }

      const token = authHeader.substring(7);

      // Verify JWT token
      let decoded;
      try {
        decoded = userService.verifyJWT(token);
      } catch (error) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: error.message
        });
      }

      // Update user
      const { name } = req.body;
      const updatedUser = await userService.updateUser(req.prisma, decoded.userId, { name });

      logger.info('User profile updated', {
        userId: updatedUser.id,
        ip: req.ip
      });

      res.status(200).json(updatedUser);

    } catch (error) {
      logger.error('User update failed', {
        error: error.message,
        ip: req.ip
      });
      next(error);
    }
  }
);

/**
 * POST /api/auth/change-password
 * Change user password
 * 
 * Headers:
 *   Authorization: Bearer <token>
 * 
 * Request body:
 * {
 *   "oldPassword": "current123",
 *   "newPassword": "newpassword123"
 * }
 */
router.post('/change-password',
  validateRequest({
    newPassword: InputValidator.validatePassword
  }),
  async (req, res, next) => {
    // Initialize decoded outside try block for error handler access
    let decoded = null;
    
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'No authentication token provided'
        });
      }

      const token = authHeader.substring(7);

      // Verify JWT token
      try {
        decoded = userService.verifyJWT(token);
      } catch (error) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: error.message
        });
      }

      // Validate oldPassword presence
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Current password is required'
        });
      }

      // Change password
      const result = await userService.changePassword(
        req.prisma,
        decoded.userId,
        oldPassword,
        newPassword
      );

      logger.info('Password changed successfully', {
        userId: decoded.userId,
        ip: req.ip
      });

      res.status(200).json(result);

    } catch (error) {
      logger.error('Password change failed', {
        error: error.message,
        userId: decoded?.userId,
        ip: req.ip
      });
      next(error);
    }
  }
);

module.exports = router;
