import { Hero } from "@/components/features/Home/Hero";
import { HowDiagram } from "@/components/features/Home/HowDiagram";
import { CommunitySection } from "@/components/features/Home/CommunitySection";

const Home: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Main content wrapper with consistent spacing */}
      <div className="space-y-8 lg:space-y-12">
        <Hero />
        <HowDiagram />
        <CommunitySection />
      </div>
      
      {/* Spacer for footer */}
      <div className="h-16" />
    </div>
  );
};

export default Home