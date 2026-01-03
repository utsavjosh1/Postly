import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { authService } from '../services/auth.service';
import type { ApiError } from '../types/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      await authService.login(formData);
      navigate('/');
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiError;
        if (apiError.errors) {
          setErrors(apiError.errors);
        } else {
          setErrors({ general: apiError.message || 'Login failed. Please try again.' });
        }
      } else {
        setErrors({ general: 'Network error. Please check your connection.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Welcome back</h1>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
              <p className="text-sm text-error">{errors.general}</p>
            </div>
          )}

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
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={errors.password}
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

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-border text-foreground focus:ring-ring"
              />
              <span className="text-muted-foreground">Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-foreground hover:underline font-medium">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-foreground font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
