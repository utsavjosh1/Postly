import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div className="max-w-4xl mx-auto text-center py-20">
      <h1 className="text-5xl font-bold text-gray-900 mb-6">
        Find Your Dream Job with AI
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        Upload your resume and let our AI match you with the perfect opportunities.
        Get personalized job recommendations powered by advanced machine learning.
      </p>

      <div className="flex justify-center gap-4">
        <Link
          to="/chat"
          className="px-8 py-3 bg-primary-600 text-white rounded-lg text-lg font-semibold hover:bg-primary-700 transition"
        >
          Start Matching
        </Link>
        <Link
          to="/register"
          className="px-8 py-3 bg-white border-2 border-primary-600 text-primary-600 rounded-lg text-lg font-semibold hover:bg-primary-50 transition"
        >
          Sign Up Free
        </Link>
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-6 bg-white rounded-lg shadow-sm">
          <div className="text-4xl mb-4">🤖</div>
          <h3 className="text-xl font-semibold mb-2">AI-Powered Matching</h3>
          <p className="text-gray-600">
            Our AI analyzes your resume and matches you with jobs that fit your skills perfectly.
          </p>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-sm">
          <div className="text-4xl mb-4">📄</div>
          <h3 className="text-xl font-semibold mb-2">Resume Builder</h3>
          <p className="text-gray-600">
            Get AI-powered suggestions to improve your resume and increase your chances.
          </p>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-sm">
          <div className="text-4xl mb-4">🚀</div>
          <h3 className="text-xl font-semibold mb-2">Real-Time Updates</h3>
          <p className="text-gray-600">
            Get notified instantly when new jobs matching your profile are posted.
          </p>
        </div>
      </div>
    </div>
  );
}
