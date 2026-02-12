import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import Problem from "@/components/home/Problem";
import HowItWorks from "@/components/home/HowItWorks";
import Pricing from "@/components/home/Pricing";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <Problem />
        <HowItWorks />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
