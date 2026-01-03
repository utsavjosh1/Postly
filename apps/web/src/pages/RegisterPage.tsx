import { Link } from 'react-router-dom';
import { useState } from 'react';
import { GradientText } from '../components/ui/GradientText';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');

  const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return { strength: 0, label: '', color: '' };
    if (pass.length < 6) return { strength: 25, label: 'Weak', color: 'bg-red-500' };
    if (pass.length < 10) return { strength: 50, label: 'Fair', color: 'bg-amber-500' };
    if (pass.length < 12 && /[A-Z]/.test(pass) && /[0-9]/.test(pass))
      return { strength: 75, label: 'Good', color: 'bg-primary-500' };
    if (pass.length >= 12 && /[A-Z]/.test(pass) && /[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass))
      return { strength: 100, label: 'Strong', color: 'bg-green-500' };
    return { strength: 60, label: 'Fair', color: 'bg-amber-500' };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  return (
    <div className="max-w-md mx-auto py-12 animate-fade-in-up">
      <Card variant="glass" className="p-8 md:p-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Join <GradientText>Postly</GradientText> Today
          </h1>
          <p className="text-gray-600">Start your journey to finding the perfect job</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            type="text"
            label="Full Name"
            placeholder="John Doe"
            required
            autoComplete="name"
          />

          <Input
            type="email"
            label="Email Address"
            placeholder="you@example.com"
            required
            autoComplete="email"
          />

          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="••••••••"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              helperText="Use at least 12 characters with uppercase, numbers, and symbols"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-10.5 text-gray-500 hover:text-primary-600 transition-colors text-sm font-medium"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>

            {/* Password strength indicator */}
            {password.length > 0 && (
              <div className="mt-2 animate-fade-in">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${passwordStrength.color} transition-all duration-300`}
                      style={{ width: `${passwordStrength.strength}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-600">{passwordStrength.label}</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="user-type" className="block text-sm font-medium text-gray-700 mb-2">
              I am a... <span className="text-red-500" aria-label="required">*</span>
            </label>
            <select
              id="user-type"
              required
              className="w-full px-4 py-3 rounded-lg glass border-2 border-transparent focus:border-primary-500 focus:ring-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200"
            >
              <option value="">Select your role</option>
              <option value="job_seeker">Job Seeker</option>
              <option value="employer">Employer</option>
            </select>
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="terms"
              required
              className="mt-1 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="terms" className="text-sm text-gray-600">
              I agree to the{' '}
              <Link to="/terms" className="text-primary-600 hover:text-primary-700 font-medium">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary-600 hover:text-primary-700 font-medium">
                Privacy Policy
              </Link>
            </label>
          </div>

          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        {/* Social signup divider */}
        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-glass-white text-gray-500">Or sign up with</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              className="glass px-4 py-2.5 rounded-lg hover:shadow-glass-lg transition-all duration-200 font-medium text-gray-700 hover:scale-105"
            >
              Google
            </button>
            <button
              type="button"
              className="glass px-4 py-2.5 rounded-lg hover:shadow-glass-lg transition-all duration-200 font-medium text-gray-700 hover:scale-105"
            >
              LinkedIn
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
