import { useState } from "react";
import { Mail, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function ContactSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const contactEmail = "contacts@best-travel-plan.cloud";

  const handleSend = () => {
    const subject = encodeURIComponent(`Contact from ${name || "Website Visitor"}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    );
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
  };

  return (
    <section id="contact" className="relative py-24 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-secondary/20 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      <div className="relative container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/10 mb-5 shadow-soft">
            <MessageSquare className="h-6 w-6 text-accent" />
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Get in Touch
          </h2>
          <p className="text-muted-foreground leading-relaxed text-lg max-w-md mx-auto">
            Have questions or feedback? We'd love to hear from you.
          </p>
          <a
            href={`mailto:${contactEmail}`}
            className="inline-flex items-center gap-2 text-accent hover:text-accent/80 transition-colors mt-4 text-sm font-medium"
          >
            <Mail className="h-4 w-4" />
            {contactEmail}
          </a>
        </div>

        <div className="bg-card/90 backdrop-blur-md rounded-2xl p-8 md:p-10 shadow-elevated border border-border/30">
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-xl border-border/50 focus:border-accent/50 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl border-border/50 focus:border-accent/50 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-medium">Message</Label>
              <Textarea
                id="message"
                placeholder="How can we help you?"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="rounded-xl border-border/50 focus:border-accent/50 transition-colors resize-none"
              />
            </div>

            <Button onClick={handleSend} className="w-full h-13 rounded-xl text-base font-medium shadow-soft hover:shadow-medium transition-all duration-300" size="lg">
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
