import { Link } from 'react-router-dom';
import { AIMatchingIcon, ResumeIcon, RocketIcon, CheckCircleIcon } from '@components/icons';

export function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="container mx-auto px-4">
          {/* Badge */}
          <div className="flex justify-center mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted text-muted-foreground rounded-full text-sm font-medium">
              AI-Powered Job Matching Platform
            </div>
          </div>

          {/* Main Heading */}
          <div className="text-center max-w-3xl mx-auto animate-slide-up">
            <h1 className="text-4xl md:text-6xl font-semibold text-foreground mb-6 leading-tight tracking-tight">
              Find Your Dream Job with AI-Powered Matching
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Upload your resume and let our AI match you with perfect opportunities.
              Get personalized recommendations tailored to your skills and experience.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
              <Link
                to="/register"
                className="px-6 py-3 bg-foreground text-background rounded-lg font-medium hover:opacity-90 transition-all"
              >
                Get Started Free
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 text-foreground border border-border rounded-lg font-medium hover:bg-muted transition-colors"
              >
                Sign In
              </Link>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-8 max-w-xl mx-auto pt-8 border-t border-border">
              <div>
                <div className="text-2xl font-semibold text-foreground">10K+</div>
                <div className="text-sm text-muted-foreground mt-1">Active Jobs</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-foreground">95%</div>
                <div className="text-sm text-muted-foreground mt-1">Match Accuracy</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-foreground">5K+</div>
                <div className="text-sm text-muted-foreground mt-1">Happy Users</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
              Why Choose Postly?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We combine cutting-edge AI technology with deep industry expertise.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Feature 1 */}
            <div className="bg-card border border-border rounded-xl p-6 hover:shadow-soft-md transition-all duration-200">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center mb-4 text-foreground">
                <AIMatchingIcon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">AI-Powered Matching</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Our advanced AI analyzes your resume and matches you with jobs that fit your skills.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircleIcon className="w-4 h-4 text-success shrink-0" />
                  Smart skill matching
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircleIcon className="w-4 h-4 text-success shrink-0" />
                  Personalized recommendations
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircleIcon className="w-4 h-4 text-success shrink-0" />
                  95% accuracy rate
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-card border border-border rounded-xl p-6 hover:shadow-soft-md transition-all duration-200">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center mb-4 text-foreground">
                <ResumeIcon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Resume Builder</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Get AI-powered suggestions to improve your resume and increase interview chances.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircleIcon className="w-4 h-4 text-success shrink-0" />
                  ATS-optimized templates
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircleIcon className="w-4 h-4 text-success shrink-0" />
                  Real-time feedback
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircleIcon className="w-4 h-4 text-success shrink-0" />
                  Industry-specific tips
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-card border border-border rounded-xl p-6 hover:shadow-soft-md transition-all duration-200">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center mb-4 text-foreground">
                <RocketIcon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Real-Time Updates</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Get notified instantly when new jobs matching your profile are posted.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircleIcon className="w-4 h-4 text-success shrink-0" />
                  Instant job alerts
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircleIcon className="w-4 h-4 text-success shrink-0" />
                  Email notifications
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircleIcon className="w-4 h-4 text-success shrink-0" />
                  Daily job digests
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-foreground text-background rounded-full flex items-center justify-center text-lg font-semibold mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Upload Resume</h3>
              <p className="text-muted-foreground text-sm">
                Upload your resume and our AI will analyze your skills
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-foreground text-background rounded-full flex items-center justify-center text-lg font-semibold mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Get Matches</h3>
              <p className="text-muted-foreground text-sm">
                Receive personalized job recommendations
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-foreground text-background rounded-full flex items-center justify-center text-lg font-semibold mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Apply & Track</h3>
              <p className="text-muted-foreground text-sm">
                Apply to jobs and track your applications
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of job seekers who found their dream careers.
            </p>
            <Link
              to="/register"
              className="inline-block px-8 py-3 bg-foreground text-background rounded-lg font-medium hover:opacity-90 transition-all"
            >
              Create Free Account
            </Link>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
