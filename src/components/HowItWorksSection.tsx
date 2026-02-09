import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, CalendarDays, ReceiptText } from "lucide-react";

const steps = [
  {
    icon: MapPin,
    title: "Pick your route",
    desc: "Choose departure + destination airports.",
  },
  {
    icon: CalendarDays,
    title: "Set dates & travelers",
    desc: "Adults / kids / infants + flight class + car rental toggle.",
  },
  {
    icon: ReceiptText,
    title: "Get your total cost",
    desc: "See a breakdown, adjust items, and re-calc instantly.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="container mx-auto px-4 py-14 scroll-mt-28">
      <div className="mx-auto max-w-3xl text-center">
        <Badge variant="secondary" className="mb-3">
          How it works
        </Badge>
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground">
          Plan in 3 simple steps
        </h2>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          You stay in control — include or exclude items and instantly see the impact.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={s.title} className="border-border/60 bg-background/70 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">Step {i + 1}</span>
                </div>

                <h3 className="mt-4 font-medium text-foreground">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
