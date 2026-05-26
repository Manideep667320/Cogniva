import express from 'express';
import { verifyToken } from '../middlewares/auth.js';
import Flashcard from '../models/Flashcard.js';
import fsrsService from '../services/fsrsService.js';
import weaknessService from '../services/weaknessService.js';

const router = express.Router();

/**
 * @route   GET /api/flashcards/queue
 * @desc    Get the student's priority review queue for today
 */
router.get('/queue', verifyToken, async (req, res) => {
  try {
    const queue = await weaknessService.getPriorityQueue(req.userId);
    res.json({ success: true, queue });
  } catch (error) {
    console.error('Error fetching priority queue:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   POST /api/flashcards/review
 * @desc    Submit a flashcard review (Time taken, FSRS Rating)
 */
router.post('/review', verifyToken, async (req, res) => {
  try {
    const { flashcardId, rating, responseTimeMs } = req.body;
    
    if (!flashcardId || !rating || !responseTimeMs) {
      return res.status(400).json({ success: false, message: 'Missing review parameters' });
    }

    const newState = await fsrsService.processReview(req.userId, flashcardId, rating, responseTimeMs);
    res.json({ success: true, state: newState });
  } catch (error) {
    console.error('Error processing review:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   GET /api/flashcards/drafts
 * @desc    Get pending LLM-generated flashcards waiting for human approval
 */
router.get('/drafts', verifyToken, async (req, res) => {
  try {
    const drafts = await Flashcard.find({ userId: req.userId, status: 'draft' }).sort({ createdAt: -1 });
    res.json({ success: true, drafts });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   PUT /api/flashcards/:id/status
 * @desc    Approve, Edit, or Reject a draft flashcard
 */
router.put('/:id/status', verifyToken, async (req, res) => {
  try {
    const { status, front, back } = req.body;
    
    const card = await Flashcard.findOne({ _id: req.params.id, userId: req.userId });
    if (!card) return res.status(404).json({ success: false, message: 'Flashcard not found' });

    if (status) card.status = status;
    if (front) card.front = front;
    if (back) card.back = back;

    await card.save();
    res.json({ success: true, card });
  } catch (error) {
    console.error('Error updating flashcard status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
