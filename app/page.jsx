import HeroRifa from "@/components/rifa/HeroRifa";
import PrizeSection from "@/components/rifa/PrizeSection";
import TicketSection from "@/components/rifa/TicketSection";
import InfoSection from "@/components/rifa/InfoSection";
import FooterRifa from "@/components/rifa/FooterRifa";

export default function Home() {
  return (
    <main className="min-h-screen bg-bg">
      <HeroRifa />
      <PrizeSection />
      <TicketSection />
      <InfoSection />
      <FooterRifa />
    </main>
  );
}
