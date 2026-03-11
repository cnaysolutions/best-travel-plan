import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden">
      {/* Background decorative blurs */}
      <div className="absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-28 right-[-10rem] h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
      </div>

      {/* Very light warm tint — NOT opaque, lets travel-bg show through vividly */}
      <div
        className="absolute inset-0 bg-amber-50/15 dark:bg-slate-900/25"
        aria-hidden="true"
      />

      <div className="relative z-10 container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center animate-fade-in-up space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur">
            <Sparkles className="h-4 w-4" />
            Plan your total holiday cost in minutes
          </div>

          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground leading-tight drop-shadow-sm">
            How much will my <span className="text-accent">holiday really cost?</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed drop-shadow-sm">
            See the full picture before you travel — flights, accommodation, transport, and realistic daily expenses.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              variant="premium"
              size="lg"
              onClick={() => {
                const el = document.getElementById("plan");
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="w-full sm:w-auto"
            >
              Start planning <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onClick={() => {
                const el = document.getElementById("how-it-works");
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="w-full sm:w-auto text-muted-foreground"
            >
              See how it works
            </Button>
          </div>

          <p className="text-sm text-muted-foreground/80 max-w-lg mx-auto">
            No booking. No pressure. Just clarity.
          </p>
        </div>
      </div>
    </section>
  );
}
