ALTER TABLE "jobs" ALTER COLUMN "embedding" SET DATA TYPE vector(1024);--> statement-breakpoint
ALTER TABLE "resumes" ALTER COLUMN "embedding" SET DATA TYPE vector(1024);