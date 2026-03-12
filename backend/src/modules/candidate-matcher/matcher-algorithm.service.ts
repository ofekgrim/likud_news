import { Injectable } from '@nestjs/common';
import {
  CandidatePosition,
  PositionValue,
} from './entities/candidate-position.entity';
import {
  MemberQuizResponse,
  QuizAnswer,
} from './entities/member-quiz-response.entity';
import { PolicyCategory } from './entities/policy-statement.entity';

/**
 * Position-match scoring table:
 * - agree + agree   = 1.0
 * - agree + neutral = 0.5
 * - agree + disagree = 0.0
 * - disagree + disagree = 1.0
 * - disagree + neutral  = 0.5
 * - disagree + agree    = 0.0
 */
const POSITION_SCORE: Record<QuizAnswer, Record<PositionValue, number>> = {
  [QuizAnswer.AGREE]: {
    [PositionValue.AGREE]: 1.0,
    [PositionValue.NEUTRAL]: 0.5,
    [PositionValue.DISAGREE]: 0.0,
  },
  [QuizAnswer.DISAGREE]: {
    [PositionValue.AGREE]: 0.0,
    [PositionValue.NEUTRAL]: 0.5,
    [PositionValue.DISAGREE]: 1.0,
  },
  [QuizAnswer.SKIP]: {
    [PositionValue.AGREE]: 0,
    [PositionValue.NEUTRAL]: 0,
    [PositionValue.DISAGREE]: 0,
  },
};

export interface MatchResult {
  matchPct: number;
  categoryBreakdown: Record<string, number>;
}

/**
 * Pure computation service for the candidate matcher algorithm.
 * Stateless — no database or cache dependencies, easily unit-testable.
 */
@Injectable()
export class MatcherAlgorithmService {
  /**
   * Compute overall match percentage between a user's responses and a candidate's positions.
   *
   * Formula: score = SUM(importance_weight * position_match) / SUM(importance_weight) * 100
   *
   * - Skip answers are excluded from both numerator AND denominator.
   * - If no non-skip answers match candidate positions, returns 0.
   */
  computeMatch(
    responses: MemberQuizResponse[],
    positions: CandidatePosition[],
  ): MatchResult {
    // Build a lookup: statementId -> CandidatePosition
    const positionMap = new Map<string, CandidatePosition>();
    for (const pos of positions) {
      positionMap.set(pos.statementId, pos);
    }

    // Also track category for breakdown
    // We need the statement's category — stored on the response's statement relation
    // or we can derive from positions which have statement relation
    const categoryScores: Record<
      string,
      { weightedSum: number; weightTotal: number }
    > = {};

    let weightedSum = 0;
    let weightTotal = 0;

    for (const response of responses) {
      // Skip answers are excluded from computation
      if (response.answer === QuizAnswer.SKIP) {
        continue;
      }

      const candidatePos = positionMap.get(response.statementId);
      if (!candidatePos) {
        // Candidate has no position on this statement — skip
        continue;
      }

      const posScore = POSITION_SCORE[response.answer][candidatePos.position];
      const weight = response.importanceWeight;

      weightedSum += weight * posScore;
      weightTotal += weight;

      // Category breakdown
      const category = response.statement?.category || 'unknown';
      if (!categoryScores[category]) {
        categoryScores[category] = { weightedSum: 0, weightTotal: 0 };
      }
      categoryScores[category].weightedSum += weight * posScore;
      categoryScores[category].weightTotal += weight;
    }

    const matchPct =
      weightTotal > 0
        ? Math.round((weightedSum / weightTotal) * 100 * 10) / 10
        : 0;

    // Compute category breakdown
    const categoryBreakdown: Record<string, number> = {};
    for (const [cat, scores] of Object.entries(categoryScores)) {
      categoryBreakdown[cat] =
        scores.weightTotal > 0
          ? Math.round(
              (scores.weightedSum / scores.weightTotal) * 100 * 10,
            ) / 10
          : 0;
    }

    return { matchPct, categoryBreakdown };
  }

  /**
   * Compute matches for multiple candidates at once.
   * Returns results sorted by matchPct descending.
   */
  computeMatchesForCandidates(
    responses: MemberQuizResponse[],
    candidatePositionsMap: Map<string, CandidatePosition[]>,
  ): Array<{ candidateId: string; matchPct: number; categoryBreakdown: Record<string, number> }> {
    const results: Array<{
      candidateId: string;
      matchPct: number;
      categoryBreakdown: Record<string, number>;
    }> = [];

    for (const [candidateId, positions] of candidatePositionsMap) {
      const { matchPct, categoryBreakdown } = this.computeMatch(
        responses,
        positions,
      );
      results.push({ candidateId, matchPct, categoryBreakdown });
    }

    // Sort by match percentage descending
    results.sort((a, b) => b.matchPct - a.matchPct);

    return results;
  }
}
