import { JobExplorer } from "@/components/features/JobExplorer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Job Explorer | Postly",
  description:
    "Find roles that match your skills and impact. Advanced filtering and AI-powered matching.",
};

export default function ExplorePage() {
  return <JobExplorer />;
}
