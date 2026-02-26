import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { paymentService } from "../services/payment.service";
import { useAuthStore } from "../stores/auth.store";
import { Check } from "lucide-react";
import { ParticleBackground } from "../components/ui/ParticleBackground";

const PRICING_PLANS = [
  {
    id: "pdt_starter",
    name: "Starter",
    price: "$9",
    period: "/month",
    description: "Perfect for individuals starting their job search journey.",
    features: [
      "Up to 5 resume versions",
      "Basic AI chat support",
      "Weekly job alerts",
      "Discord community access",
    ],
    buttonText: "Start Starter",
    pro: false,
  },
  {
    id: "pdt_pro",
    name: "Professional",
    price: "$29",
    period: "/month",
    description: "The complete toolkit for serious career seekers.",
    features: [
      "Unlimited resume versions",
      "Advanced AI career coaching",
      "Daily real-time job alerts",
      "Priority Discord support",
      "Custom cover letter generator",
    ],
    buttonText: "Go Pro",
    pro: true,
  },
  {
    id: "pdt_enterprise",
    name: "Team",
    price: "$99",
    period: "/month",
    description: "For recruiting teams and career coaching agencies.",
    features: [
      "Everything in Professional",
      "Team collaboration tools",
      "Bulk resume processing",
      "API access",
      "Dedicated account manager",
    ],
    buttonText: "Contact Sales",
    pro: false,
  },
];

export const PricingPage: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (productId: string) => {
    if (!isAuthenticated) {
      window.location.href = "/login?redirect=/pricing";
      return;
    }

    setLoadingPlan(productId);
    try {
      const { checkout_url } =
        await paymentService.createCheckoutSession(productId);
      window.location.href = checkout_url;
    } catch (error) {
      console.error("Failed to initiate checkout:", error);
      // alert("Failed to start checkout. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="relative min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center overflow-hidden font-sans py-12 lg:py-6">
      <ParticleBackground />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        <div className="text-center mb-10 animate-fade-in space-y-3">
          <Badge className="bg-white/10 text-zinc-300 border-white/10 hover:bg-white/20 transition-colors py-0.5 px-3 text-[10px] uppercase tracking-wider">
            Pricing Plans
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-bold text-white tracking-tight leading-none drop-shadow-2xl">
            Scale your career,
            <span className="text-zinc-400"> simplified.</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto backdrop-blur-sm font-light">
            Choose the plan that fits your needs. All plans include a 14-day
            money-back guarantee.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {PRICING_PLANS.map((plan, index) => (
            <Card
              key={plan.id}
              className={`flex flex-col h-full relative bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl transition-all duration-500 hover:border-white/20 group animate-slide-up opacity-0 ${
                plan.pro ? "ring-1 ring-white/20 md:scale-105 z-10" : ""
              }`}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {plan.pro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black text-[9px] font-bold px-3 py-0.5 rounded-full uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                  Most Popular
                </div>
              )}
              <CardHeader className="pb-6 pt-6">
                <CardTitle className="text-xl font-bold tracking-tight">
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-zinc-400 font-light mt-1 text-xs">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 flex-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tighter">
                    {plan.price}
                  </span>
                  <span className="text-zinc-500 font-medium text-sm">
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-3 text-zinc-400 transition-colors duration-300 hover:text-white group/item"
                    >
                      <div className="shrink-0 w-4 h-4 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover/item:border-white/30 transition-colors">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </div>
                      <span className="text-xs">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-6 pb-6 mt-auto">
                <Button
                  className={`w-full py-5 text-base font-bold transition-all duration-300 rounded-xl overflow-hidden relative group/btn ${
                    plan.pro
                      ? "bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.02]"
                      : "bg-zinc-800/50 hover:bg-zinc-800 text-white border border-white/5 hover:border-white/20"
                  }`}
                  onClick={() => handleSubscribe(plan.id)}
                  isLoading={loadingPlan === plan.id}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {plan.buttonText}
                  </span>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center animate-fade-in [animation-delay:600ms] opacity-0">
          <p className="text-zinc-500 mb-4 text-xs font-medium">
            Already a subscriber?
          </p>
          <Button
            variant="outline"
            className="px-6 py-2.5 text-white border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold transition-all backdrop-blur-md"
            onClick={async () => {
              const customerId = user?.email || "";
              try {
                const { portal_url } =
                  await paymentService.getCustomerPortal(customerId);
                window.location.href = portal_url;
              } catch (error) {
                console.error("Portal error:", error);
              }
            }}
          >
            Manage Subscription
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
