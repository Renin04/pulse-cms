-- CreateTable
CREATE TABLE "survey_responses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entry_id" TEXT NOT NULL,
    "survey_hash" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "voter_hash" TEXT NOT NULL,
    "user_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "survey_responses_entry_id_survey_hash_idx" ON "survey_responses"("entry_id", "survey_hash");

-- CreateIndex
CREATE INDEX "survey_responses_entry_id_survey_hash_question_id_idx" ON "survey_responses"("entry_id", "survey_hash", "question_id");
