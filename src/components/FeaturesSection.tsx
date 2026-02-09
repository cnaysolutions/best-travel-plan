import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, Plane, Hotel, Car, CheckCircle2, Sparkles } from "lucide-react";

const features = [
  {
    icon: Plane,
    title: "Flights included",
    desc: "Outbound + return flights with realistic pricing logic.",
  },
  {
    icon: Hotel,
    title: "Hotel cost visibility",
    desc: "See accommodation cost clearly before you commit.",
  },
  {
    icon: Car,
    title: "Car rental optional",
    desc: "Toggle car rental on/off and instantly see the impact.",
  },
  {
    icon: Calculator,
    title: "Full cost breakdown",
    desc: "Total cost + per-person cost in a clean summary.",
  },
  {
    icon: Sparkles,
    title: "Simple, fast planning",
    desc: "No messy spreadsheets. Get clarity in minutes.",
  },
  {
    icon: CheckCircle2,
    title: "No booking required",
    desc: "Plan first. Book later — wherever you want.",
  },
];

export function FeaturesSection() {
  return (
    <section className="container mx-auto px-4 py-14">
      <div className="mx-auto max-w-3xl text-center">
        <Badge variant="secondary" className="mb-3">
          What you get
        </Badge>
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground">
          A clear trip budget — without the headache
        </h2>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Designed for people who want to know the real holiday cost before booking anything.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <Card key={f.title} className="card-premium border-border/60 bg-background/70 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-11 w-11 shrink-0 rounded-2xl bg-gradient-accent flex items-center justify-center shadow-soft">
                    <Icon className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{f.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
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
