import { useState } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { TripIntakeForm } from "@/components/TripIntakeForm";
import { TripResults } from "@/components/TripResults";
import { Footer } from "@/components/Footer";
import { ContactSection } from "@/components/ContactSection";
import { generateMockTripPlan } from "@/data/mockTripData";
import { useTheme } from "@/hooks/useTheme";
import type { TripDetails, TripPlan } from "@/types/trip";

const Index = () => {
  const [tripDetails, setTripDetails] = useState<TripDetails | null>(null);
  const [tripPlan, setTripPlan] = useState<TripPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { theme, toggleTheme, setResultsMode, setPlanningMode, themeClass, modeClass } = useTheme();

  const handleFormSubmit = async (details: TripDetails) => {
    setIsLoading(true);
    setTripDetails(details);

    await new Promise((resolve) => setTimeout(resolve, 1500));
    const plan = await generateMockTripPlan(details);

    setTripPlan(plan);
    setIsLoading(false);
    setResultsMode();

    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
  };

  const handleToggleItem = (type: string, id: string) => {
    if (!tripPlan) return;

    setTripPlan((prev) => {
      if (!prev) return prev;

      if (type === "outboundFlight" && prev.outboundFlight) {
        return {
          ...prev,
          outboundFlight: { ...prev.outboundFlight, included: !prev.outboundFlight.included },
        };
      }
      if (type === "returnFlight" && prev.returnFlight) {
        return {
          ...prev,
          returnFlight: { ...prev.returnFlight, included: !prev.returnFlight.included },
        };
      }
      if (type === "carRental" && prev.carRental) {
        return {
          ...prev,
          carRental: { ...prev.carRental, included: !prev.carRental.included },
        };
      }
      if (type === "hotel" && prev.hotel) {
        return {
          ...prev,
          hotel: { ...prev.hotel, included: !prev.hotel.included },
        };
      }
      if (type === "itinerary") {
        return {
          ...prev,
          itinerary: prev.itinerary.map((day) => ({
            ...day,
            items: day.items.map((item) =>
              item.id === id ? { ...item, included: !item.included } : item
            ),
          })),
        };
      }

      return prev;
    });
  };

  const handleReset = () => {
    setTripDetails(null);
    setTripPlan(null);
    setPlanningMode();
  };

  return (
    <div className={`app-shell travel-bg ${themeClass} ${modeClass}`}>
      {/* Thinking traveler silhouette overlay */}
      <div className="travel-overlay" aria-hidden="true">
        <svg viewBox="0 0 900 700" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Sun */}
          <circle cx="700" cy="130" r="55" fill="currentColor" opacity="0.35" />

          {/* Head */}
          <circle cx="610" cy="280" r="55" fill="currentColor" opacity="0.9" />

          {/* Body */}
          <path
            d="M560 420C560 370 595 345 630 345C675 345 710 375 710 430V560H560V420Z"
            fill="currentColor"
            opacity="0.9"
          />

          {/* Arm / thinking pose */}
          <path
            d="M640 385C610 410 590 450 585 480C580 510 590 535 610 545"
            stroke="currentColor"
            strokeWidth="26"
            strokeLinecap="round"
            opacity="0.85"
          />
          <path
            d="M610 540C635 530 655 515 670 495"
            stroke="currentColor"
            strokeWidth="26"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* Suitcase */}
          <rect x="450" y="470" width="85" height="115" rx="14" fill="currentColor" opacity="0.85" />
          <path
            d="M475 470V445C475 430 486 420 500 420H505C520 420 530 430 530 445V470"
            stroke="currentColor"
            strokeWidth="14"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* Thought bubble */}
          <path
            d="M715 250C760 250 795 280 795 320C795 360 760 390 715 390C705 390 695 388 686 385L650 405L658 372C645 360 635 342 635 320C635 280 670 250 715 250Z"
            fill="currentColor"
            opacity="0.75"
          />

          {/* Calculator icon inside bubble */}
          <rect x="690" y="290" width="70" height="80" rx="10" fill="white" opacity="0.65" />
          <rect x="702" y="302" width="46" height="16" rx="5" fill="currentColor" opacity="0.65" />
          <circle cx="712" cy="332" r="5" fill="currentColor" opacity="0.65" />
          <circle cx="728" cy="332" r="5" fill="currentColor" opacity="0.65" />
          <circle cx="744" cy="332" r="5" fill="currentColor" opacity="0.65" />
          <circle cx="712" cy="352" r="5" fill="currentColor" opacity="0.65" />
          <circle cx="728" cy="352" r="5" fill="currentColor" opacity="0.65" />
          <circle cx="744" cy="352" r="5" fill="currentColor" opacity="0.65" />
        </svg>
      </div>

      <Header theme={theme} onToggleTheme={toggleTheme} />

      {!tripPlan ? (
        <>
          <HeroSection />
          <FeaturesSection />
          <HowItWorksSection />

          <main id="plan" className="container mx-auto px-4 pb-16">
            <div className="mx-auto max-w-2xl">
              <div className="text-center mb-10">
                <h2 className="font-display text-3xl font-semibold text-foreground mb-3">
                  Plan My Holiday Cost
                </h2>
                <p className="text-muted-foreground leading-relaxed max-w-lg mx-auto">
                  Get a clear estimate of your full holiday — flights, hotel, car rental, and daily expenses.
                </p>
                <p className="text-muted-foreground/80 text-sm mt-2">
                  No booking. No commitment. Just clarity.
                </p>
              </div>

              <TripIntakeForm onSubmit={handleFormSubmit} isLoading={isLoading} />
            </div>
          </main>

          <ContactSection />
        </>
      ) : (
        <main className="container mx-auto px-4 py-10 max-w-4xl">
          {tripDetails && (
            <TripResults
              tripDetails={tripDetails}
              tripPlan={tripPlan}
              tripId={undefined}
              onToggleItem={handleToggleItem}
              onReset={handleReset}
            />
          )}
        </main>
      )}

      <Footer />
    </div>
  );
};

export default Index;
