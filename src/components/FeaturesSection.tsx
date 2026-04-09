import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, Plane, Hotel, Car, CheckCircle2, Sparkles } from "lucide-react";

const features = [
  {
    icon: Plane,
    title: "Flights included",
    desc: "Outbound + return flights with realistic pricing logic.",
    gradient: "from-blue-500/20 to-indigo-500/20",
    iconColor: "text-blue-600",
  },
  {
    icon: Hotel,
    title: "Hotel cost visibility",
    desc: "See accommodation cost clearly before you commit.",
    gradient: "from-amber-500/20 to-orange-500/20",
    iconColor: "text-amber-600",
  },
  {
    icon: Car,
    title: "Car rental optional",
    desc: "Toggle car rental on/off and instantly see the impact.",
    gradient: "from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-600",
  },
  {
    icon: Calculator,
    title: "Full cost breakdown",
    desc: "Total cost + per-person cost in a clean summary.",
    gradient: "from-violet-500/20 to-purple-500/20",
    iconColor: "text-violet-600",
  },
  {
    icon: Sparkles,
    title: "Simple, fast planning",
    desc: "No messy spreadsheets. Get clarity in minutes.",
    gradient: "from-rose-500/20 to-pink-500/20",
    iconColor: "text-rose-600",
  },
  {
    icon: CheckCircle2,
    title: "No booking required",
    desc: "Plan first. Book later — wherever you want.",
    gradient: "from-cyan-500/20 to-sky-500/20",
    iconColor: "text-cyan-600",
  },
];

export function FeaturesSection() {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="mx-auto max-w-3xl text-center mb-14">
        <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-xs uppercase tracking-wider font-medium">
          What you get
        </Badge>
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
          A clear trip budget —{" "}
          <span className="hero-gradient-text">without the headache</span>
        </h2>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
          Designed for people who want to know the real holiday cost before booking anything.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <Card
              key={f.title}
              className="feature-card group border-border/40 bg-background/60 backdrop-blur-md hover:bg-background/80 transition-all duration-500 hover:shadow-elevated hover:-translate-y-1 animate-fade-in-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <CardContent className="p-7">
                <div className="flex items-start gap-5">
                  <div className={`h-13 w-13 shrink-0 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center shadow-soft ring-1 ring-black/5 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-6 w-6 ${f.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-[1.05rem]">{f.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
