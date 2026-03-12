import { MatcherAlgorithmService } from './matcher-algorithm.service';
import { MemberQuizResponse, QuizAnswer } from './entities/member-quiz-response.entity';
import { CandidatePosition, PositionValue } from './entities/candidate-position.entity';
import { PolicyCategory } from './entities/policy-statement.entity';

function makeResponse(
  statementId: string,
  answer: QuizAnswer,
  importanceWeight = 1.0,
  category: PolicyCategory = PolicyCategory.SECURITY,
): MemberQuizResponse {
  return {
    id: `resp-${statementId}`,
    appUserId: 'user-1',
    deviceId: null,
    statementId,
    electionId: 'election-1',
    answer,
    importanceWeight,
    answeredAt: new Date(),
    statement: { category } as any,
    election: {} as any,
  } as any;
}

function makePosition(
  statementId: string,
  position: PositionValue,
  candidateId = 'candidate-1',
): CandidatePosition {
  return {
    id: `pos-${statementId}`,
    candidateId,
    statementId,
    position,
    justificationHe: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    candidate: {} as any,
    statement: {} as any,
  } as any;
}

describe('MatcherAlgorithmService', () => {
  let service: MatcherAlgorithmService;

  beforeEach(() => {
    service = new MatcherAlgorithmService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // computeMatch
  // ---------------------------------------------------------------------------
  describe('computeMatch', () => {
    it('should return 100% when all user answers agree with candidate agree positions', () => {
      const responses = [
        makeResponse('s1', QuizAnswer.AGREE),
        makeResponse('s2', QuizAnswer.AGREE),
        makeResponse('s3', QuizAnswer.AGREE),
      ];
      const positions = [
        makePosition('s1', PositionValue.AGREE),
        makePosition('s2', PositionValue.AGREE),
        makePosition('s3', PositionValue.AGREE),
      ];

      const result = service.computeMatch(responses, positions);

      expect(result.matchPct).toBe(100);
    });

    it('should return 0% when all user answers agree but candidate disagrees', () => {
      const responses = [
        makeResponse('s1', QuizAnswer.AGREE),
        makeResponse('s2', QuizAnswer.AGREE),
        makeResponse('s3', QuizAnswer.AGREE),
      ];
      const positions = [
        makePosition('s1', PositionValue.DISAGREE),
        makePosition('s2', PositionValue.DISAGREE),
        makePosition('s3', PositionValue.DISAGREE),
      ];

      const result = service.computeMatch(responses, positions);

      expect(result.matchPct).toBe(0);
    });

    it('should return 100% when both user and candidate disagree', () => {
      const responses = [
        makeResponse('s1', QuizAnswer.DISAGREE),
        makeResponse('s2', QuizAnswer.DISAGREE),
      ];
      const positions = [
        makePosition('s1', PositionValue.DISAGREE),
        makePosition('s2', PositionValue.DISAGREE),
      ];

      const result = service.computeMatch(responses, positions);

      expect(result.matchPct).toBe(100);
    });

    it('should give 50% when candidate is neutral on all positions', () => {
      const responses = [
        makeResponse('s1', QuizAnswer.AGREE),
        makeResponse('s2', QuizAnswer.DISAGREE),
      ];
      const positions = [
        makePosition('s1', PositionValue.NEUTRAL),
        makePosition('s2', PositionValue.NEUTRAL),
      ];

      const result = service.computeMatch(responses, positions);

      expect(result.matchPct).toBe(50);
    });

    it('should compute correct weighted average with different importance weights', () => {
      // agree+agree (weight 2.0) => score 2.0
      // agree+disagree (weight 1.0) => score 0.0
      // Total: 2.0 / 3.0 = 66.7%
      const responses = [
        makeResponse('s1', QuizAnswer.AGREE, 2.0),
        makeResponse('s2', QuizAnswer.AGREE, 1.0),
      ];
      const positions = [
        makePosition('s1', PositionValue.AGREE),
        makePosition('s2', PositionValue.DISAGREE),
      ];

      const result = service.computeMatch(responses, positions);

      expect(result.matchPct).toBe(66.7);
    });

    it('should exclude SKIP answers from calculation', () => {
      const responses = [
        makeResponse('s1', QuizAnswer.AGREE),
        makeResponse('s2', QuizAnswer.SKIP), // should be ignored
        makeResponse('s3', QuizAnswer.AGREE),
      ];
      const positions = [
        makePosition('s1', PositionValue.AGREE),
        makePosition('s2', PositionValue.DISAGREE), // irrelevant since user skipped
        makePosition('s3', PositionValue.AGREE),
      ];

      const result = service.computeMatch(responses, positions);

      // Only s1 and s3 count: 2.0/2.0 = 100%
      expect(result.matchPct).toBe(100);
    });

    it('should return 0 when all responses are SKIP', () => {
      const responses = [
        makeResponse('s1', QuizAnswer.SKIP),
        makeResponse('s2', QuizAnswer.SKIP),
      ];
      const positions = [
        makePosition('s1', PositionValue.AGREE),
        makePosition('s2', PositionValue.AGREE),
      ];

      const result = service.computeMatch(responses, positions);

      expect(result.matchPct).toBe(0);
    });

    it('should return 0 when there are no responses', () => {
      const result = service.computeMatch([], []);

      expect(result.matchPct).toBe(0);
      expect(result.categoryBreakdown).toEqual({});
    });

    it('should return 0 when candidate has no positions for user responses', () => {
      const responses = [
        makeResponse('s1', QuizAnswer.AGREE),
        makeResponse('s2', QuizAnswer.AGREE),
      ];
      // Candidate has positions for different statements
      const positions = [
        makePosition('s99', PositionValue.AGREE),
      ];

      const result = service.computeMatch(responses, positions);

      expect(result.matchPct).toBe(0);
    });

    it('should compute category breakdown correctly', () => {
      const responses = [
        makeResponse('s1', QuizAnswer.AGREE, 1.0, PolicyCategory.SECURITY),
        makeResponse('s2', QuizAnswer.AGREE, 1.0, PolicyCategory.SECURITY),
        makeResponse('s3', QuizAnswer.AGREE, 1.0, PolicyCategory.ECONOMY),
      ];
      const positions = [
        makePosition('s1', PositionValue.AGREE),   // security: 1.0
        makePosition('s2', PositionValue.DISAGREE), // security: 0.0
        makePosition('s3', PositionValue.AGREE),    // economy: 1.0
      ];

      const result = service.computeMatch(responses, positions);

      // Security: (1.0+0.0)/2.0 = 50%
      expect(result.categoryBreakdown[PolicyCategory.SECURITY]).toBe(50);
      // Economy: 1.0/1.0 = 100%
      expect(result.categoryBreakdown[PolicyCategory.ECONOMY]).toBe(100);
    });

    it('should handle mixed match with equal weights correctly', () => {
      // agree+agree = 1.0, agree+disagree = 0.0, agree+neutral = 0.5
      // Total: (1.0 + 0.0 + 0.5) / 3.0 = 50%
      const responses = [
        makeResponse('s1', QuizAnswer.AGREE),
        makeResponse('s2', QuizAnswer.AGREE),
        makeResponse('s3', QuizAnswer.AGREE),
      ];
      const positions = [
        makePosition('s1', PositionValue.AGREE),
        makePosition('s2', PositionValue.DISAGREE),
        makePosition('s3', PositionValue.NEUTRAL),
      ];

      const result = service.computeMatch(responses, positions);

      expect(result.matchPct).toBe(50);
    });
  });

  // ---------------------------------------------------------------------------
  // computeMatchesForCandidates
  // ---------------------------------------------------------------------------
  describe('computeMatchesForCandidates', () => {
    it('should return results sorted by matchPct descending', () => {
      const responses = [
        makeResponse('s1', QuizAnswer.AGREE),
        makeResponse('s2', QuizAnswer.AGREE),
      ];

      const candidatePositionsMap = new Map<string, CandidatePosition[]>();
      // Candidate A: 50% (one agree, one disagree)
      candidatePositionsMap.set('candidate-a', [
        makePosition('s1', PositionValue.AGREE, 'candidate-a'),
        makePosition('s2', PositionValue.DISAGREE, 'candidate-a'),
      ]);
      // Candidate B: 100% (both agree)
      candidatePositionsMap.set('candidate-b', [
        makePosition('s1', PositionValue.AGREE, 'candidate-b'),
        makePosition('s2', PositionValue.AGREE, 'candidate-b'),
      ]);
      // Candidate C: 0% (both disagree)
      candidatePositionsMap.set('candidate-c', [
        makePosition('s1', PositionValue.DISAGREE, 'candidate-c'),
        makePosition('s2', PositionValue.DISAGREE, 'candidate-c'),
      ]);

      const results = service.computeMatchesForCandidates(
        responses,
        candidatePositionsMap,
      );

      expect(results).toHaveLength(3);
      expect(results[0].candidateId).toBe('candidate-b');
      expect(results[0].matchPct).toBe(100);
      expect(results[1].candidateId).toBe('candidate-a');
      expect(results[1].matchPct).toBe(50);
      expect(results[2].candidateId).toBe('candidate-c');
      expect(results[2].matchPct).toBe(0);
    });

    it('should return empty array when no candidates are provided', () => {
      const responses = [makeResponse('s1', QuizAnswer.AGREE)];
      const candidatePositionsMap = new Map<string, CandidatePosition[]>();

      const results = service.computeMatchesForCandidates(
        responses,
        candidatePositionsMap,
      );

      expect(results).toEqual([]);
    });

    it('should include categoryBreakdown for each candidate', () => {
      const responses = [
        makeResponse('s1', QuizAnswer.AGREE, 1.0, PolicyCategory.SECURITY),
      ];

      const candidatePositionsMap = new Map<string, CandidatePosition[]>();
      candidatePositionsMap.set('candidate-a', [
        makePosition('s1', PositionValue.AGREE, 'candidate-a'),
      ]);

      const results = service.computeMatchesForCandidates(
        responses,
        candidatePositionsMap,
      );

      expect(results[0].categoryBreakdown).toEqual({
        [PolicyCategory.SECURITY]: 100,
      });
    });
  });
});
