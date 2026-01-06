import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { authService } from '../services/auth.service';
import type { ApiError } from '../types/auth';

export function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    userType: '' as 'job_seeker' | 'employer' | '',
  });
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    userType?: string;
    general?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    if (!formData.userType) {
      setErrors({ userType: 'Please select your role' });
      setIsLoading(false);
      return;
    }

    try {
      await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        userType: formData.userType as 'job_seeker' | 'employer',
      });
      navigate('/');
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiError;
        if (apiError.errors) {
          setErrors(apiError.errors);
        } else {
          setErrors({ general: apiError.message || 'Registration failed. Please try again.' });
        }
      } else {
        setErrors({ general: 'Network error. Please check your connection.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    // TODO: Implement Google OAuth integration
    console.log('Google sign-up clicked');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Create an account</h1>
          <p className="text-muted-foreground">Start your journey to finding the perfect job</p>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignUp}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg font-medium text-gray-700 transition-colors duration-200 mb-6"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <g fill="none" fillRule="evenodd">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </g>
          </svg>
          Continue with Google
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-card text-muted-foreground">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
              <p className="text-sm text-error">{errors.general}</p>
            </div>
          )}

          <Input
            type="text"
            label="Full Name"
            placeholder="John Doe"
            required
            autoComplete="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
          />

          <Input
            type="email"
            label="Email"
            placeholder="you@example.com"
            required
            autoComplete="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
          />

          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="Create a password"
              required
              autoComplete="new-password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={errors.password}
              helperText="Use at least 12 characters with uppercase, numbers, and symbols"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-muted-foreground hover:text-foreground text-sm transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <div>
            <label htmlFor="user-type" className="block text-sm font-medium text-foreground mb-1.5">
              I am a... <span className="text-error" aria-label="required">*</span>
            </label>
            <select
              id="user-type"
              required
              value={formData.userType}
              onChange={(e) => setFormData({ ...formData, userType: e.target.value as 'job_seeker' | 'employer' })}
              className={`w-full px-3 py-2.5 rounded-lg bg-background border text-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/50 ${
                errors.userType ? 'border-error' : 'border-border'
              }`}
            >
              <option value="">Select your role</option>
              <option value="job_seeker">Job Seeker</option>
              <option value="employer">Employer</option>
            </select>
            {errors.userType && <p className="mt-1.5 text-sm text-error">{errors.userType}</p>}
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="terms"
              required
              className="mt-1 w-4 h-4 rounded border-border text-foreground focus:ring-ring"
            />
            <label htmlFor="terms" className="text-sm text-muted-foreground">
              I agree to the{' '}
              <Link to="/terms" className="text-foreground hover:underline font-medium">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-foreground hover:underline font-medium">
                Privacy Policy
              </Link>
            </label>
          </div>

          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-foreground font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}