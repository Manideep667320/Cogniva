import express from 'express';
import memoryService from '../services/memoryService.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @route   POST /api/memory/add
 * @desc    Add a new semantic memory for the current user
 * @access  Private
 */
router.post('/add', verifyToken, async (req, res) => {
  try {
    const { memory_type, content, metadata } = req.body;
    
    if (!memory_type || !content) {
      return res.status(400).json({ success: false, message: 'memory_type and content are required' });
    }

    const memory = await memoryService.storeMemory(req.userId, memory_type, content, metadata);

    res.status(201).json({
      success: true,
      message: 'Memory stored successfully',
      data: memory
    });
  } catch (error) {
    console.error('Error adding memory:', error);
    res.status(500).json({ success: false, message: 'Failed to add memory' });
  }
});

/**
 * @route   POST /api/memory/search
 * @desc    Search for relevant semantic memories
 * @access  Private
 */
router.post('/search', verifyToken, async (req, res) => {
  try {
    const { query, memory_type, top_k = 5 } = req.body;
    
    if (!query) {
      return res.status(400).json({ success: false, message: 'query is required' });
    }

    const results = await memoryService.semanticSearch(req.userId, query, memory_type, top_k);

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error searching memory:', error);
    res.status(500).json({ success: false, message: 'Failed to search memory' });
  }
});

/**
 * @route   GET /api/memory/recent
 * @desc    Get recent memories by type
 * @access  Private
 */
router.get('/recent', verifyToken, async (req, res) => {
  try {
    const { memory_type, limit = 10 } = req.query;
    
    if (!memory_type) {
      return res.status(400).json({ success: false, message: 'memory_type query parameter is required' });
    }

    const memories = await memoryService.getRecentMemories(req.userId, memory_type, parseInt(limit));

    res.status(200).json({
      success: true,
      data: memories
    });
  } catch (error) {
    console.error('Error fetching recent memories:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch recent memories' });
  }
});

export default router;
