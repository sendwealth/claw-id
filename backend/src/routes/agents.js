/**
 * Agent Routes - API endpoints for agent management
 * Part of CLAW ID backend system
 */

const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const tokenManager = require('../services/tokenManager');

/**
 * POST /api/agents
 * Create a new agent with email and tokens
 * 
 * Request body:
 * {
 *   "name": "Agent Name",
 *   "platforms": ["platform1", "platform2"]
 * }
 * 
 * Response:
 * {
 *   "id": "agent_xxx",
 *   "name": "Agent Name",
 *   "email": "agent-xxx@claw.id",
 *   "apiKey": "claw_xxx",
 *   "createdAt": "2026-02-28T..."
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { name, platforms } = req.body;

    // Validate required fields
    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Agent name is required and must be a string'
      });
    }

    // Generate agent ID
    const agentId = emailService.generateAgentId();
    
    // Generate email address
    const email = emailService.generateEmail(agentId);
    
    // Generate API key
    const { apiKey, keyHash } = tokenManager.generateApiKey(agentId);

    // TODO: Store in database
    // For now, we'll just return the created agent data
    const agent = {
      id: agentId,
      name: name.trim(),
      email,
      platforms: platforms || [],
      apiKey,
      apiKeyHash: keyHash,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    // Log agent creation (in production, this would be a database insert)
    console.log(`[Agent Created] ID: ${agentId}, Name: ${name}, Email: ${email}`);

    res.status(201).json({
      id: agent.id,
      name: agent.name,
      email: agent.email,
      platforms: agent.platforms,
      apiKey: agent.apiKey,
      createdAt: agent.createdAt
    });

  } catch (error) {
    console.error('[Agent Creation Error]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create agent'
    });
  }
});

/**
 * GET /api/agents/:id
 * Retrieve agent information by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Fetch from database
    // For now, return a placeholder response
    res.status(200).json({
      id,
      message: 'Agent retrieval not yet implemented - database integration required'
    });

  } catch (error) {
    console.error('[Agent Retrieval Error]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve agent'
    });
  }
});

/**
 * GET /api/agents
 * List all agents (with pagination support)
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // TODO: Fetch from database with pagination
    res.status(200).json({
      message: 'Agent listing not yet implemented - database integration required',
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('[Agent Listing Error]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to list agents'
    });
  }
});

/**
 * DELETE /api/agents/:id
 * Deactivate or delete an agent
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Implement database deletion/deactivation
    res.status(200).json({
      id,
      message: 'Agent deletion not yet implemented - database integration required'
    });

  } catch (error) {
    console.error('[Agent Deletion Error]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete agent'
    });
  }
});

module.exports = router;
