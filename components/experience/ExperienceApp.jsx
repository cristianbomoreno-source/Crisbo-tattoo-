"use client";

import { useExperience } from "@/context/ExperienceContext";
import MobileHeader from "@/components/ui/MobileHeader";
import MobileMenu from "@/components/ui/MobileMenu";
import HomeScreen from "./HomeScreen";
import QuoteFlow from "./QuoteFlow";
import PortfolioScreen from "./PortfolioScreen";
import SocialScreen from "./SocialScreen";

export default function ExperienceApp() {
  const { state } = useExperience();
  const { currentScreen } = state;

  const renderScreen = () => {
    switch (currentScreen) {
      case "home":
        return <HomeScreen />;
      case "quote":
        return <QuoteFlow />;
      case "portfolio":
        return <PortfolioScreen />;
      case "social":
        return <SocialScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <MobileHeader showProgress={currentScreen === "quote"} />
      <MobileMenu />

      <main className="overflow-x-hidden">
        {renderScreen()}
      </main>
    </div>
  );
}
