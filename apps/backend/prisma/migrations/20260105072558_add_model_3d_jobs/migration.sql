-- CreateTable
CREATE TABLE "model_3d_jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "providerJobId" TEXT,
    "inputImageUrls" TEXT NOT NULL,
    "outputModelUrl" TEXT,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "model_3d_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "model_3d_jobs_userId_idx" ON "model_3d_jobs"("userId");

-- CreateIndex
CREATE INDEX "model_3d_jobs_status_idx" ON "model_3d_jobs"("status");

-- CreateIndex
CREATE INDEX "model_3d_jobs_createdAt_idx" ON "model_3d_jobs"("createdAt");
