import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Ticker from "@/components/Ticker";
import About from "@/components/About";
import Process from "@/components/Process";
import SelectedWork from "@/components/SelectedWork";
import Sleeves from "@/components/Sleeves";
import Studio from "@/components/Studio";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import CTAFinal from "@/components/CTAFinal";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="bg-bg overflow-x-hidden">
        <Hero />
        <Ticker />
        <About />
        <Process />
        <SelectedWork />
        <Sleeves />
        <Studio />
        <Testimonials />
        <FAQ />
        <CTAFinal />
      </main>
      <Footer />
    </>
  );
}
