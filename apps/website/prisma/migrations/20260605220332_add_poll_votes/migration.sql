-- CreateTable
CREATE TABLE "poll_votes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entry_id" TEXT NOT NULL,
    "poll_hash" TEXT NOT NULL,
    "option_id" TEXT NOT NULL,
    "user_id" TEXT,
    "voter_hash" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "poll_votes_entry_id_poll_hash_idx" ON "poll_votes"("entry_id", "poll_hash");

-- CreateIndex
CREATE UNIQUE INDEX "poll_votes_entry_id_poll_hash_option_id_voter_hash_key" ON "poll_votes"("entry_id", "poll_hash", "option_id", "voter_hash");
