-- CreateTable
CREATE TABLE "recruiters" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recruiters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interviews" (
    "id" UUID NOT NULL,
    "recruiter_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "candidate_name" VARCHAR(255) NOT NULL,
    "candidate_email" VARCHAR(255) NOT NULL,
    "join_token" VARCHAR(64) NOT NULL,
    "token_expires_at" TIMESTAMPTZ NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "scheduled_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "interview_id" UUID NOT NULL,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ,
    "consent_given" BOOLEAN NOT NULL DEFAULT false,
    "consent_given_at" TIMESTAMPTZ,
    "system_check_passed" BOOLEAN NOT NULL DEFAULT false,
    "current_integrity_score" INTEGER NOT NULL DEFAULT 100,
    "current_risk_state" VARCHAR(50) NOT NULL DEFAULT 'normal',
    "peak_integrity_score" INTEGER NOT NULL DEFAULT 100,
    "event_sequence_number" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detection_events" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "sequence_number" INTEGER NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "detector_id" VARCHAR(100) NOT NULL,
    "client_timestamp" TIMESTAMPTZ NOT NULL,
    "server_timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "severity" VARCHAR(50) NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "payload" JSONB NOT NULL,
    "score_before" INTEGER,
    "score_after" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detection_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_snapshots" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "integrity_score" INTEGER NOT NULL,
    "risk_state" VARCHAR(50) NOT NULL,
    "explanation" TEXT NOT NULL,
    "contributing_event_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_items" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "event_id" UUID,
    "evidence_type" VARCHAR(50) NOT NULL,
    "timestamp" TIMESTAMPTZ NOT NULL,
    "file_path" VARCHAR(500),
    "file_size_bytes" INTEGER,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "retention_expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruiter_reviews" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "recruiter_id" UUID NOT NULL,
    "decision" VARCHAR(50) NOT NULL,
    "notes" TEXT,
    "reviewed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recruiter_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recruiters_email_key" ON "recruiters"("email");

-- CreateIndex
CREATE UNIQUE INDEX "interviews_join_token_key" ON "interviews"("join_token");

-- CreateIndex
CREATE INDEX "idx_interviews_recruiter" ON "interviews"("recruiter_id");

-- CreateIndex
CREATE INDEX "idx_interviews_status" ON "interviews"("status");

-- CreateIndex
CREATE INDEX "idx_interviews_token" ON "interviews"("join_token");

-- CreateIndex
CREATE INDEX "idx_sessions_interview" ON "sessions"("interview_id");

-- CreateIndex
CREATE INDEX "idx_events_session" ON "detection_events"("session_id");

-- CreateIndex
CREATE INDEX "idx_events_session_time" ON "detection_events"("session_id", "server_timestamp");

-- CreateIndex
CREATE INDEX "idx_events_type" ON "detection_events"("event_type");

-- CreateIndex
CREATE UNIQUE INDEX "idx_events_session_seq" ON "detection_events"("session_id", "sequence_number");

-- CreateIndex
CREATE INDEX "idx_risk_session" ON "risk_snapshots"("session_id");

-- CreateIndex
CREATE INDEX "idx_evidence_session" ON "evidence_items"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "recruiter_reviews_session_id_key" ON "recruiter_reviews"("session_id");

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_recruiter_id_fkey" FOREIGN KEY ("recruiter_id") REFERENCES "recruiters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "interviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detection_events" ADD CONSTRAINT "detection_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_snapshots" ADD CONSTRAINT "risk_snapshots_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_snapshots" ADD CONSTRAINT "risk_snapshots_contributing_event_id_fkey" FOREIGN KEY ("contributing_event_id") REFERENCES "detection_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_items" ADD CONSTRAINT "evidence_items_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_items" ADD CONSTRAINT "evidence_items_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "detection_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruiter_reviews" ADD CONSTRAINT "recruiter_reviews_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruiter_reviews" ADD CONSTRAINT "recruiter_reviews_recruiter_id_fkey" FOREIGN KEY ("recruiter_id") REFERENCES "recruiters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
