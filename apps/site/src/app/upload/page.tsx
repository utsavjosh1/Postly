import { ResumeUpload } from '@/components/features/ResumeUpload';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Resume Upload | Postly',
  description: 'Upload your resume and let AI parse your skills and experience for better job matching.',
};

export default function UploadPage() {
  return <ResumeUpload />;
}
