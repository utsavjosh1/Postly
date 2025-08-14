import { Hero } from "@/components/features/Home/Hero";
import { HowDiagram } from "@/components/features/Home/HowDiagram";
import { CommunitySection } from "@/components/features/Home/CommunitySection";
import { Sponsers } from "@/components/features/Home/Sponsors";

const Home: React.FC = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <HowDiagram />
      <Sponsers />
      <CommunitySection />
    </div>
  );
};

export default Home;
