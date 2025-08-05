import { Hero } from "@/components/features/Home/Hero";
import { HowDiagram } from "@/components/features/Home/HowDiagram";
import { CommunitySection } from "@/components/features/Home/CommunitySection";

const Home: React.FC = () => {
  return (
    <>
      <Hero />
      <HowDiagram />
      <CommunitySection />
    </>
  );
};

export default Home