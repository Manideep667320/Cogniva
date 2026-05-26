import ReviewState from '../models/ReviewState.js';

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

    // Find all review states for the user where due date has passed or is imminent
    const dueCards = await ReviewState.find({
      userId,
      due: { $lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) } // due within next 24 hours
    }).populate('flashcardId');

    // Calculate priority:
    // FSRS Urgency = (Now - DueDate) in days
    // Priority = Urgency + WeaknessScore
    const queue = dueCards.map(cardState => {
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
      ...q.flashcardId, // The populated flashcard
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
