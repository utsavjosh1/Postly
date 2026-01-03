import { Link } from 'react-router-dom';
import { GradientText } from '../components/ui/GradientText';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

export function HomePage() {
  const [heroRef, heroVisible] = useIntersectionObserver({ threshold: 0.1, freezeOnceVisible: true });
  const [featuresRef, featuresVisible] = useIntersectionObserver({ threshold: 0.1, freezeOnceVisible: true });
  const [ctaRef, ctaVisible] = useIntersectionObserver({ threshold: 0.1, freezeOnceVisible: true });

  const features = [
    {
      icon: '🤖',
      gradient: 'from-primary-400 to-accent-purple-500',
      title: 'AI-Powered Matching',
      description: 'Our AI analyzes your resume and matches you with jobs that fit your skills perfectly.',
    },
    {
      icon: '📄',
      gradient: 'from-accent-pink-400 to-accent-purple-500',
      title: 'Resume Builder',
      description: 'Get AI-powered suggestions to improve your resume and increase your chances.',
    },
    {
      icon: '🚀',
      gradient: 'from-primary-400 to-accent-pink-500',
      title: 'Real-Time Updates',
      description: 'Get notified instantly when new jobs matching your profile are posted.',
    },
  ];

  const stats = [
    { value: '10K+', label: 'Active Jobs' },
    { value: '5K+', label: 'Companies' },
    { value: '95%', label: 'Match Rate' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <section
        ref={heroRef as any}
        className={`text-center py-20 transition-all duration-1000 ${
          heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="mb-6">
          <GradientText as="h1" className="text-5xl md:text-6xl lg:text-7xl mb-6 animate-fade-in-up">
            Find Your Dream Job
          </GradientText>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 animate-fade-in-up">
            with AI-Powered Matching
          </h2>
        </div>

        <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          Upload your resume and let our AI match you with the perfect opportunities.
          Get personalized job recommendations powered by advanced machine learning.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <Link to="/chat">
            <Button variant="primary" size="lg" className="w-full sm:w-auto min-w-50">
              Start Matching →
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="glass" size="lg" className="w-full sm:w-auto min-w-50">
              Sign Up Free
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">{stat.value}</div>
              <div className="text-sm md:text-base text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section
        ref={featuresRef as any}
        className={`py-20 transition-all duration-1000 ${
          featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose <GradientText>Postly</GradientText>?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We combine cutting-edge AI technology with deep industry expertise to deliver exceptional results.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              variant="glass"
              className={`p-8 text-center transition-all duration-500`}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div
                className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-linear-to-br ${feature.gradient} flex items-center justify-center text-4xl shadow-glow`}
              >
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section
        ref={ctaRef as any}
        className={`py-20 transition-all duration-1000 ${
          ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <Card variant="gradient" className="p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of job seekers who found their dream careers with Postly's AI-powered platform.
          </p>
          <Link to="/register">
            <Button variant="glass" size="lg" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
              Create Free Account →
            </Button>
          </Link>
        </Card>
      </section>
    </div>
  );
}
