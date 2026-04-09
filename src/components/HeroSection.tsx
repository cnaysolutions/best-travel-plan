import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Globe, MapPin, Plane } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden">
      {/* Animated background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 left-1/2 h-[32rem] w-[56rem] -translate-x-1/2 rounded-full bg-primary/8 blur-[100px] animate-pulse-slow" />
        <div className="absolute -bottom-28 right-[-10rem] h-96 w-96 rounded-full bg-accent/15 blur-[80px] animate-float-slow" />
        <div className="absolute top-1/3 left-[10%] h-64 w-64 rounded-full bg-accent/10 blur-[60px] animate-float-reverse" />
      </div>

      {/* Floating travel icons */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <Plane className="absolute top-[15%] right-[15%] h-6 w-6 text-accent/20 animate-float-slow hidden md:block" />
        <Globe className="absolute bottom-[25%] left-[12%] h-8 w-8 text-primary/15 animate-float-reverse hidden md:block" />
        <MapPin className="absolute top-[40%] right-[8%] h-5 w-5 text-accent/15 animate-float-slow hidden lg:block" />
      </div>

      {/* Subtle warm tint overlay */}
      <div
        className="absolute inset-0 bg-amber-50/10 dark:bg-slate-900/25"
        aria-hidden="true"
      />

      <div className="relative z-10 container mx-auto px-4 py-20 md:py-32 lg:py-36">
        <div className="mx-auto max-w-4xl text-center space-y-8">
          {/* Animated pill badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-background/50 px-5 py-2 text-sm text-muted-foreground backdrop-blur-md shadow-soft animate-fade-in-up hero-badge-glow">
            <Sparkles className="h-4 w-4 text-accent animate-pulse-slow" />
            <span className="font-medium">Plan your total holiday cost in minutes</span>
          </div>

          {/* Main headline with gradient text */}
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] tracking-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            How much will my{" "}
            <span className="hero-gradient-text">
              holiday really cost?
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            See the full picture before you travel — flights, accommodation, transport, and realistic daily expenses, all in one clear view.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Button
              variant="premium"
              size="lg"
              onClick={() => {
                const el = document.getElementById("plan");
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="w-full sm:w-auto h-14 px-8 text-base font-medium shadow-elevated hover:shadow-glow transition-all duration-300 hover:scale-[1.02]"
            >
              Start planning <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onClick={() => {
                const el = document.getElementById("how-it-works");
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="w-full sm:w-auto h-14 px-8 text-base text-muted-foreground hover:text-foreground border border-border/40 hover:border-border/80 backdrop-blur-sm transition-all duration-300"
            >
              See how it works
            </Button>
          </div>

          {/* Trust tagline */}
          <p className="text-sm text-muted-foreground/70 max-w-lg mx-auto animate-fade-in-up tracking-wide" style={{ animationDelay: '0.4s' }}>
            No booking &middot; No pressure &middot; Just clarity
          </p>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />
    </section>
  );
}
