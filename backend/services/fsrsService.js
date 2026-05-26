import { fsrs, createEmptyCard, generatorParameters, Rating } from 'ts-fsrs';
import ReviewState from '../models/ReviewState.js';
import ReviewLog from '../models/ReviewLog.js';

// Initialize FSRS with default parameters
const params = generatorParameters({ enable_fuzz: true });
const f = fsrs(params);

class FSRSService {
  
  /**
   * Helper to map our DB ReviewState to the FSRS Card format
   */
  _buildFSRSCard(dbState) {
    if (!dbState.last_review) {
      return createEmptyCard(new Date());
    }
    return {
      due: dbState.due,
      stability: dbState.stability,
      difficulty: dbState.difficulty,
      elapsed_days: dbState.elapsed_days,
      scheduled_days: dbState.scheduled_days,
      reps: dbState.total_reviews,
      lapses: dbState.total_incorrect,
      state: dbState.state,
      last_review: dbState.last_review
    };
  }

  /**
   * Process a flashcard review
   * @param {string} userId
   * @param {string} flashcardId
   * @param {number} rating - 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)
   * @param {number} responseTimeMs - time taken to answer
   */
  async processReview(userId, flashcardId, rating, responseTimeMs) {
    let reviewState = await ReviewState.findOne({ userId, flashcardId });

    // If first time reviewing, create new state
    if (!reviewState) {
      reviewState = new ReviewState({ userId, flashcardId });
    }

    const fsrsCard = this._buildFSRSCard(reviewState);
    const now = new Date();

    // Map numerical rating to ts-fsrs Rating enum
    let fsrsRating;
    switch (rating) {
      case 1: fsrsRating = Rating.Again; break;
      case 2: fsrsRating = Rating.Hard; break;
      case 3: fsrsRating = Rating.Good; break;
      case 4: fsrsRating = Rating.Easy; break;
      default: fsrsRating = Rating.Good;
    }

    // Calculate next state
    const schedulingCards = f.repeat(fsrsCard, now);
    const recordLog = schedulingCards[fsrsRating];
    const newCard = recordLog.card;

    // Update DB ReviewState with FSRS metrics
    reviewState.stability = newCard.stability;
    reviewState.difficulty = newCard.difficulty;
    reviewState.elapsed_days = newCard.elapsed_days;
    reviewState.scheduled_days = newCard.scheduled_days;
    reviewState.state = newCard.state;
    reviewState.due = newCard.due;
    reviewState.last_review = newCard.last_review;

    // Update Weakness tracking metrics
    reviewState.total_reviews += 1;
    
    // Recalculate average response time (moving average)
    if (reviewState.total_reviews === 1) {
      reviewState.avg_response_time_ms = responseTimeMs;
    } else {
      reviewState.avg_response_time_ms = 
        ((reviewState.avg_response_time_ms * (reviewState.total_reviews - 1)) + responseTimeMs) / reviewState.total_reviews;
    }

    if (rating === 1) { // Incorrect / Again
      reviewState.total_incorrect += 1;
      reviewState.forgetting_frequency += 1;
      reviewState.consecutive_correct = 0;
    } else {
      reviewState.consecutive_correct += 1;
    }

    await reviewState.save();

    // Log the review for timeseries analytics
    await ReviewLog.create({
      userId,
      flashcardId,
      rating,
      responseTimeMs,
      isCorrect: rating !== 1
    });

    return reviewState;
  }
}

export default new FSRSService();
