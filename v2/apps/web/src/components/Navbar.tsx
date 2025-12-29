import { Link } from 'react-router-dom';

export function Navbar() {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-primary-600">
            Postly
          </Link>

          <div className="flex items-center gap-6">
            <Link to="/chat" className="text-gray-700 hover:text-primary-600 transition">
              AI Chat
            </Link>
            <Link to="/login" className="text-gray-700 hover:text-primary-600 transition">
              Login
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
