import { RecruiterDashboard } from '@/components/features/RecruiterDashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recruiter Dashboard | Postly',
  description: 'Elegant pipeline manager with AI suggestions for recruiting talent.',
};

export default function RecruitersPage() {
  return <RecruiterDashboard />;
}
