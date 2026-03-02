import { MigrationInterface, QueryRunner } from 'typeorm';

export class PrimariesSchema1709100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Enum Types ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "election_status_enum" AS ENUM ('draft', 'upcoming', 'active', 'voting', 'counting', 'completed', 'cancelled')
    `);
    await queryRunner.query(`
      CREATE TYPE "rsvp_status_enum" AS ENUM ('interested', 'going', 'not_going')
    `);
    await queryRunner.query(`
      CREATE TYPE "badge_type_enum" AS ENUM ('quiz_taker', 'first_vote', 'endorser', 'poll_voter', 'event_goer', 'top_contributor', 'early_bird', 'social_sharer')
    `);
    await queryRunner.query(`
      CREATE TYPE "point_action_enum" AS ENUM ('quiz_complete', 'endorsement', 'poll_vote', 'event_rsvp', 'comment', 'share', 'login_streak', 'profile_complete')
    `);

    // ── 1. primary_elections ──────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "primary_elections" (
        "id"                     uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title"                  varchar(500) NOT NULL,
        "subtitle"               text,
        "description"            text,
        "electionDate"           TIMESTAMP NOT NULL,
        "registrationDeadline"   TIMESTAMP,
        "status"                 "election_status_enum" NOT NULL DEFAULT 'draft',
        "coverImageUrl"          varchar(2000),
        "isActive"               boolean NOT NULL DEFAULT true,
        "createdAt"              TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"              TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_primary_elections" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_primary_elections_status" ON "primary_elections" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_primary_elections_date" ON "primary_elections" ("electionDate")
    `);

    // ── 2. candidates ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "candidates" (
        "id"                     uuid NOT NULL DEFAULT uuid_generate_v4(),
        "electionId"             uuid NOT NULL,
        "fullName"               varchar(300) NOT NULL,
        "slug"                   varchar(300) NOT NULL,
        "district"               varchar(200),
        "position"               varchar(300),
        "photoUrl"               varchar(2000),
        "coverImageUrl"          varchar(2000),
        "bio"                    text,
        "bioBlocks"              jsonb NOT NULL DEFAULT '[]',
        "quizPositions"          jsonb NOT NULL DEFAULT '{}',
        "socialLinks"            jsonb NOT NULL DEFAULT '{}',
        "phone"                  varchar(50),
        "email"                  varchar(300),
        "website"                varchar(2000),
        "endorsementCount"       int NOT NULL DEFAULT 0,
        "sortOrder"              int NOT NULL DEFAULT 0,
        "isActive"               boolean NOT NULL DEFAULT true,
        "createdAt"              TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"              TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_candidates" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_candidates_slug" UNIQUE ("slug"),
        CONSTRAINT "FK_candidates_election" FOREIGN KEY ("electionId")
          REFERENCES "primary_elections" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_candidates_election" ON "candidates" ("electionId")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_candidates_slug" ON "candidates" ("slug")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_candidates_district" ON "candidates" ("district")
    `);

    // ── 3. candidate_endorsements ─────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "candidate_endorsements" (
        "id"                     uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId"                 uuid NOT NULL,
        "candidateId"            uuid NOT NULL,
        "electionId"             uuid NOT NULL,
        "createdAt"              TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_candidate_endorsements" PRIMARY KEY ("id"),
        CONSTRAINT "FK_candidate_endorsements_user" FOREIGN KEY ("userId")
          REFERENCES "app_users" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_candidate_endorsements_candidate" FOREIGN KEY ("candidateId")
          REFERENCES "candidates" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_candidate_endorsements_election" FOREIGN KEY ("electionId")
          REFERENCES "primary_elections" ("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_candidate_endorsements_user_election" UNIQUE ("userId", "electionId")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_candidate_endorsements_user" ON "candidate_endorsements" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_candidate_endorsements_candidate" ON "candidate_endorsements" ("candidateId")
    `);

    // ── 4. quiz_questions ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "quiz_questions" (
        "id"                     uuid NOT NULL DEFAULT uuid_generate_v4(),
        "electionId"             uuid NOT NULL,
        "questionText"           text NOT NULL,
        "options"                jsonb NOT NULL DEFAULT '[]',
        "importance"             varchar(20) NOT NULL DEFAULT 'medium',
        "category"               varchar(100),
        "sortOrder"              int NOT NULL DEFAULT 0,
        "isActive"               boolean NOT NULL DEFAULT true,
        "createdAt"              TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_quiz_questions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_quiz_questions_election" FOREIGN KEY ("electionId")
          REFERENCES "primary_elections" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_quiz_questions_election" ON "quiz_questions" ("electionId")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_quiz_questions_sort" ON "quiz_questions" ("sortOrder")
    `);

    // ── 5. quiz_responses ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "quiz_responses" (
        "id"                     uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId"                 uuid NOT NULL,
        "electionId"             uuid NOT NULL,
        "answers"                jsonb NOT NULL DEFAULT '[]',
        "matchResults"           jsonb NOT NULL DEFAULT '[]',
        "completedAt"            TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_quiz_responses" PRIMARY KEY ("id"),
        CONSTRAINT "FK_quiz_responses_user" FOREIGN KEY ("userId")
          REFERENCES "app_users" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_quiz_responses_election" FOREIGN KEY ("electionId")
          REFERENCES "primary_elections" ("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_quiz_responses_user_election" UNIQUE ("userId", "electionId")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_quiz_responses_user" ON "quiz_responses" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_quiz_responses_election" ON "quiz_responses" ("electionId")
    `);

    // ── 6. polling_stations ───────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "polling_stations" (
        "id"                     uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name"                   varchar(500) NOT NULL,
        "address"                text NOT NULL,
        "city"                   varchar(200),
        "district"               varchar(200),
        "latitude"               decimal(10,7),
        "longitude"              decimal(10,7),
        "capacity"               int,
        "isAccessible"           boolean NOT NULL DEFAULT false,
        "openingTime"            varchar(10),
        "closingTime"            varchar(10),
        "contactPhone"           varchar(50),
        "notes"                  text,
        "electionId"             uuid,
        "isActive"               boolean NOT NULL DEFAULT true,
        "createdAt"              TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_polling_stations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_polling_stations_election" FOREIGN KEY ("electionId")
          REFERENCES "primary_elections" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_polling_stations_election" ON "polling_stations" ("electionId")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_polling_stations_district" ON "polling_stations" ("district")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_polling_stations_coords" ON "polling_stations" ("latitude", "longitude")
    `);

    // ── 7. station_reports ────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "station_reports" (
        "id"                     uuid NOT NULL DEFAULT uuid_generate_v4(),
        "stationId"              uuid NOT NULL,
        "userId"                 uuid NOT NULL,
        "waitTimeMinutes"        int NOT NULL,
        "crowdLevel"             varchar(20) NOT NULL DEFAULT 'moderate',
        "note"                   text,
        "reportedAt"             TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_station_reports" PRIMARY KEY ("id"),
        CONSTRAINT "FK_station_reports_station" FOREIGN KEY ("stationId")
          REFERENCES "polling_stations" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_station_reports_user" FOREIGN KEY ("userId")
          REFERENCES "app_users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_station_reports_station" ON "station_reports" ("stationId")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_station_reports_reported" ON "station_reports" ("reportedAt")
    `);

    // ── 8. election_results ───────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "election_results" (
        "id"                     uuid NOT NULL DEFAULT uuid_generate_v4(),
        "electionId"             uuid NOT NULL,
        "candidateId"            uuid NOT NULL,
        "stationId"              uuid,
        "voteCount"              int NOT NULL DEFAULT 0,
        "percentage"             decimal(5,2),
        "isOfficial"             boolean NOT NULL DEFAULT false,
        "publishedAt"            TIMESTAMP,
        "createdAt"              TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"              TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_election_results" PRIMARY KEY ("id"),
        CONSTRAINT "FK_election_results_election" FOREIGN KEY ("electionId")
          REFERENCES "primary_elections" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_election_results_candidate" FOREIGN KEY ("candidateId")
          REFERENCES "candidates" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_election_results_station" FOREIGN KEY ("stationId")
          REFERENCES "polling_stations" ("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_election_results_combo" UNIQUE ("electionId", "candidateId", "stationId")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_election_results_election" ON "election_results" ("electionId")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_election_results_candidate" ON "election_results" ("candidateId")
    `);

    // ── 9. turnout_snapshots ──────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "turnout_snapshots" (
        "id"                     uuid NOT NULL DEFAULT uuid_generate_v4(),
        "electionId"             uuid NOT NULL,
        "district"               varchar(200),
        "eligibleVoters"         int NOT NULL DEFAULT 0,
        "actualVoters"           int NOT NULL DEFAULT 0,
        "percentage"             decimal(5,2) NOT NULL DEFAULT 0,
        "snapshotAt"             TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_turnout_snapshots" PRIMARY KEY ("id"),
        CONSTRAINT "FK_turnout_snapshots_election" FOREIGN KEY ("electionId")
          REFERENCES "primary_elections" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_turnout_snapshots_election" ON "turnout_snapshots" ("electionId")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_turnout_snapshots_time" ON "turnout_snapshots" ("snapshotAt")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_turnout_snapshots_district" ON "turnout_snapshots" ("district")
    `);

    // ── 10. community_polls ───────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "community_polls" (
        "id"                     uuid NOT NULL DEFAULT uuid_generate_v4(),
        "question"               text NOT NULL,
        "description"            text,
        "options"                jsonb NOT NULL DEFAULT '[]',
        "totalVotes"             int NOT NULL DEFAULT 0,
        "isPinned"               boolean NOT NULL DEFAULT false,
        "isActive"               boolean NOT NULL DEFAULT true,
        "closedAt"               TIMESTAMP,
        "createdAt"              TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"              TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_community_polls" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_community_polls_active" ON "community_polls" ("isActive")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_community_polls_pinned" ON "community_polls" ("isPinned")
    `);

    // ── 11. poll_votes ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "poll_votes" (
        "id"                     uuid NOT NULL DEFAULT uuid_generate_v4(),
        "pollId"                 uuid NOT NULL,
        "userId"                 uuid NOT NULL,
        "optionIndex"            int NOT NULL,
        "createdAt"              TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_poll_votes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_poll_votes_poll" FOREIGN KEY ("pollId")
          REFERENCES "community_polls" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_poll_votes_user" FOREIGN KEY ("userId")
          REFERENCES "app_users" ("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_poll_votes_poll_user" UNIQUE ("pollId", "userId")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_poll_votes_poll" ON "poll_votes" ("pollId")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_poll_votes_user" ON "poll_votes" ("userId")
    `);

    // ── 12. campaign_events ───────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "campaign_events" (
        "id"                     uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title"                  varchar(500) NOT NULL,
        "description"            text,
        "imageUrl"               varchar(2000),
        "location"               text,
        "city"                   varchar(200),
        "district"               varchar(200),
        "latitude"               decimal(10,7),
        "longitude"              decimal(10,7),
        "startTime"              TIMESTAMP NOT NULL,
        "endTime"                TIMESTAMP,
        "candidateId"            uuid,
        "electionId"             uuid,
        "rsvpCount"              int NOT NULL DEFAULT 0,
        "isActive"               boolean NOT NULL DEFAULT true,
        "createdAt"              TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"              TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_campaign_events" PRIMARY KEY ("id"),
        CONSTRAINT "FK_campaign_events_candidate" FOREIGN KEY ("candidateId")
          REFERENCES "candidates" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_campaign_events_election" FOREIGN KEY ("electionId")
          REFERENCES "primary_elections" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_campaign_events_start" ON "campaign_events" ("startTime")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_campaign_events_candidate" ON "campaign_events" ("candidateId")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_campaign_events_district" ON "campaign_events" ("district")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_campaign_events_election" ON "campaign_events" ("electionId")
    `);

    // ── 13. event_rsvps ───────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "event_rsvps" (
        "id"                     uuid NOT NULL DEFAULT uuid_generate_v4(),
        "eventId"                uuid NOT NULL,
        "userId"                 uuid NOT NULL,
        "status"                 "rsvp_status_enum" NOT NULL DEFAULT 'interested',
        "createdAt"              TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"              TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_event_rsvps" PRIMARY KEY ("id"),
        CONSTRAINT "FK_event_rsvps_event" FOREIGN KEY ("eventId")
          REFERENCES "campaign_events" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_event_rsvps_user" FOREIGN KEY ("userId")
          REFERENCES "app_users" ("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_event_rsvps_event_user" UNIQUE ("eventId", "userId")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_event_rsvps_event" ON "event_rsvps" ("eventId")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_event_rsvps_user" ON "event_rsvps" ("userId")
    `);

    // ── 14. user_points ───────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "user_points" (
        "id"                     uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId"                 uuid NOT NULL,
        "action"                 "point_action_enum" NOT NULL,
        "points"                 int NOT NULL,
        "metadata"               jsonb NOT NULL DEFAULT '{}',
        "earnedAt"               TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_points" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_points_user" FOREIGN KEY ("userId")
          REFERENCES "app_users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_user_points_user" ON "user_points" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_user_points_action" ON "user_points" ("action")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_user_points_earned" ON "user_points" ("earnedAt")
    `);

    // ── 15. user_badges ───────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "user_badges" (
        "id"                     uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId"                 uuid NOT NULL,
        "badgeType"              "badge_type_enum" NOT NULL,
        "earnedAt"               TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_badges" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_badges_user" FOREIGN KEY ("userId")
          REFERENCES "app_users" ("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_user_badges_user_type" UNIQUE ("userId", "badgeType")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_user_badges_user" ON "user_badges" ("userId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ── Drop tables (reverse order) ───────────────────────────────────
    await queryRunner.query(`DROP TABLE IF EXISTS "user_badges"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_points"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "event_rsvps"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "campaign_events"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "poll_votes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "community_polls"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "turnout_snapshots"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "election_results"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "station_reports"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "polling_stations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "quiz_responses"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "quiz_questions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "candidate_endorsements"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "candidates"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "primary_elections"`);

    // ── Drop enums ────────────────────────────────────────────────────
    await queryRunner.query(`DROP TYPE IF EXISTS "point_action_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "badge_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "rsvp_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "election_status_enum"`);
  }
}
