-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_model_3d_jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "providerJobId" TEXT,
    "inputImageUrls" TEXT NOT NULL,
    "outputModelUrl" TEXT,
    "errorMessage" TEXT,
    "texturePrompt" TEXT,
    "textureImageUrl" TEXT,
    "enablePbr" BOOLEAN NOT NULL DEFAULT false,
    "shouldRemesh" BOOLEAN NOT NULL DEFAULT true,
    "targetPolycount" INTEGER,
    "symmetryMode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "model_3d_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_model_3d_jobs" ("createdAt", "errorMessage", "id", "inputImageUrls", "outputModelUrl", "provider", "providerJobId", "status", "updatedAt", "userId") SELECT "createdAt", "errorMessage", "id", "inputImageUrls", "outputModelUrl", "provider", "providerJobId", "status", "updatedAt", "userId" FROM "model_3d_jobs";
DROP TABLE "model_3d_jobs";
ALTER TABLE "new_model_3d_jobs" RENAME TO "model_3d_jobs";
CREATE INDEX "model_3d_jobs_userId_idx" ON "model_3d_jobs"("userId");
CREATE INDEX "model_3d_jobs_status_idx" ON "model_3d_jobs"("status");
CREATE INDEX "model_3d_jobs_createdAt_idx" ON "model_3d_jobs"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
