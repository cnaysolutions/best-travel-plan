import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, CalendarDays, ReceiptText } from "lucide-react";

const steps = [
  {
    icon: MapPin,
    title: "Pick your route",
    desc: "Choose departure + destination airports from over 6,000 worldwide.",
    accent: "from-blue-500 to-indigo-600",
    bgAccent: "from-blue-500/10 to-indigo-500/10",
  },
  {
    icon: CalendarDays,
    title: "Set dates & travelers",
    desc: "Adults / kids / infants + flight class + car rental toggle.",
    accent: "from-accent to-amber-500",
    bgAccent: "from-amber-500/10 to-orange-500/10",
  },
  {
    icon: ReceiptText,
    title: "Get your total cost",
    desc: "See a breakdown, adjust items, and re-calc instantly.",
    accent: "from-emerald-500 to-teal-600",
    bgAccent: "from-emerald-500/10 to-teal-500/10",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="container mx-auto px-4 py-20 scroll-mt-28">
      <div className="mx-auto max-w-3xl text-center mb-14">
        <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-xs uppercase tracking-wider font-medium">
          How it works
        </Badge>
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
          Plan in <span className="hero-gradient-text">3 simple steps</span>
        </h2>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
          You stay in control — include or exclude items and instantly see the impact.
        </p>
      </div>

      <div className="relative">
        {/* Connecting line (desktop only) */}
        <div className="hidden md:block absolute top-[4.5rem] left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-[2px] bg-gradient-to-r from-blue-300/50 via-accent/50 to-emerald-300/50" />

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <Card
                key={s.title}
                className="group relative border-border/40 bg-background/60 backdrop-blur-md hover:bg-background/80 transition-all duration-500 hover:shadow-elevated hover:-translate-y-1 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                <CardContent className="p-7 text-center">
                  {/* Step number */}
                  <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${s.bgAccent} mb-5 ring-1 ring-black/5 group-hover:scale-110 transition-transform duration-300 relative`}>
                    <Icon className="h-6 w-6 text-foreground/80" />
                    <span className={`absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gradient-to-br ${s.accent} text-white text-xs font-bold flex items-center justify-center shadow-md`}>
                      {i + 1}
                    </span>
                  </div>

                  <h3 className="font-semibold text-foreground text-lg mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
