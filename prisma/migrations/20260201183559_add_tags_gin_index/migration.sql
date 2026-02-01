-- CreateIndex
CREATE INDEX "JobApplication_tags_idx" ON "JobApplication" USING GIN ("tags");
