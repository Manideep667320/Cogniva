import ReviewState from '../models/ReviewState.js';
import Flashcard from '../models/Flashcard.js';
import { Enrollment } from '../models/Enrollment.js';
import { Course } from '../models/Course.js';

class WeaknessService {
  
  /**
   * Calculate dynamic weakness score based on the formula
   * @param {Object} reviewState 
   */
  calculateWeaknessScore(reviewState) {
    if (!reviewState) return 0;

    const WEIGHT_INCORRECT = 5.0;
    const WEIGHT_TIME_PENALTY = 0.001; // 1 pt per 1000ms over baseline
    const BASELINE_TIME_MS = 3000; // 3 seconds expected answer time
    const WEIGHT_FORGETTING = 3.0;

    // Time penalty only applies if they took longer than baseline
    const timePenalty = Math.max(0, (reviewState.avg_response_time_ms - BASELINE_TIME_MS) * WEIGHT_TIME_PENALTY);
    
    // Inactivity Decay: If they haven't reviewed it in a long time, weakness score decays 
    // because FSRS handles the spaced repetition decay. We don't want to double penalize.
    
    let weaknessScore = 
      (reviewState.total_incorrect * WEIGHT_INCORRECT) +
      timePenalty +
      (reviewState.forgetting_frequency * WEIGHT_FORGETTING);

    // Reduce weakness if they've answered it correctly consecutively recently
    if (reviewState.consecutive_correct > 2) {
      weaknessScore = Math.max(0, weaknessScore - (reviewState.consecutive_correct * 2));
    }

    return parseFloat(weaknessScore.toFixed(2));
  }

  /**
   * Get the prioritized review queue for a student
   * Combines FSRS Urgency with Weakness Score
   * @param {string} userId 
   */
  async getPriorityQueue(userId) {
    const now = new Date();

    try {
      // 1. Fetch courses student is enrolled in
      const enrollments = await Enrollment.find({ user_id: userId });
      const courseIds = enrollments.map(e => e.course_id);

      // 2. Fetch faculty IDs for those enrolled courses
      const enrolledCourses = await Course.find({ _id: { $in: courseIds } });
      const facultyIds = enrolledCourses.map(c => c.faculty_id);

      // 3. Find approved flashcards belonging to either the student or their course instructors
      const approvedCards = await Flashcard.find({
        userId: { $in: [userId, ...facultyIds] },
        status: 'approved'
      });
      const approvedCardIds = approvedCards.map(c => c._id);

      // 4. Find which of these approved flashcards already have a ReviewState
      const existingStates = await ReviewState.find({
        userId,
        flashcardId: { $in: approvedCardIds }
      });
      const existingCardIds = new Set(existingStates.map(state => state.flashcardId.toString()));

      // 5. Automatically initialize ReviewState for missing approved flashcards (due immediately)
      const missingCards = approvedCards.filter(card => !existingCardIds.has(card._id.toString()));
      if (missingCards.length > 0) {
        const statesToInsert = missingCards.map(card => ({
          userId,
          flashcardId: card._id,
          due: new Date()
        }));
        try {
          await ReviewState.insertMany(statesToInsert, { ordered: false });
        } catch (insertErr) {
          // Ignore duplicate key warnings in case of concurrency
          console.warn('[WeaknessService] insertMany ReviewState warning:', insertErr.message);
        }
      }
    } catch (dbErr) {
      console.error('[WeaknessService] Error initializing ReviewState records:', dbErr);
    }

    // 6. Find all review states for the user due within the next 24 hours
    const dueCards = await ReviewState.find({
      userId,
      due: { $lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) } // due within next 24 hours
    }).populate('flashcardId');

    // 7. Filter to ensure we only queue valid, currently approved flashcards
    const validDueCards = dueCards.filter(cardState => 
      cardState.flashcardId && cardState.flashcardId.status === 'approved'
    );

    // Calculate priority:
    // FSRS Urgency = (Now - DueDate) in days
    // Priority = Urgency + WeaknessScore
    const queue = validDueCards.map(cardState => {
      const urgencyDays = (now - new Date(cardState.due)) / (1000 * 60 * 60 * 24);
      const weaknessScore = this.calculateWeaknessScore(cardState);
      
      const priority = urgencyDays + weaknessScore;

      return {
        ...cardState.toObject(),
        weaknessScore,
        urgencyDays,
        priority
      };
    });

    // Sort descending by priority
    queue.sort((a, b) => b.priority - a.priority);

    // Return the sorted list of actual flashcards
    return queue.map(q => ({
      ...q.flashcardId.toObject ? q.flashcardId.toObject() : q.flashcardId, // The populated flashcard
      reviewState: {
        state: q.state,
        difficulty: q.difficulty,
        stability: q.stability,
        weaknessScore: q.weaknessScore,
        priority: q.priority
      }
    }));
  }
}

export default new WeaknessService();
