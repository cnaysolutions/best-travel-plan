import { Compass, Heart } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="relative border-t border-border/30 mt-24 overflow-hidden">
      {/* Gradient accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

      <div className="relative bg-secondary/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-14">
          <div className="grid gap-10 md:grid-cols-4">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-11 w-11 rounded-xl bg-gradient-hero flex items-center justify-center shadow-soft">
                  <Compass className="h-5 w-5 text-primary-foreground" />
                </div>
                <p className="font-display text-xl font-bold tracking-tight">
                  Best Holiday Plan
                </p>
              </div>
              <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
                Get a clear estimate of your full holiday cost using real-time prices. Plan smarter, travel better.
              </p>
            </div>

            {/* Explore */}
            <div>
              <h4 className="font-semibold mb-5 text-sm uppercase tracking-wider text-foreground/80">Explore</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <a
                    href="/#how-it-works"
                    className="hover:text-foreground transition-colors duration-300 inline-flex items-center gap-1 hover:translate-x-0.5 transform transition-transform"
                  >
                    How It Works
                  </a>
                </li>
                <li>
                  <a
                    href="/#plan"
                    className="hover:text-foreground transition-colors duration-300 inline-flex items-center gap-1 hover:translate-x-0.5 transform transition-transform"
                  >
                    Plan Your Trip
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-5 text-sm uppercase tracking-wider text-foreground/80">Legal</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <Link
                    to="/privacy"
                    className="hover:text-foreground transition-colors duration-300 hover:translate-x-0.5 transform transition-transform inline-block"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms"
                    className="hover:text-foreground transition-colors duration-300 hover:translate-x-0.5 transform transition-transform inline-block"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    to="/data-deletion"
                    className="hover:text-foreground transition-colors duration-300 hover:translate-x-0.5 transform transition-transform inline-block"
                  >
                    Data Deletion
                  </Link>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="hover:text-foreground transition-colors duration-300 hover:translate-x-0.5 transform transition-transform inline-block"
                  >
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-14 pt-8 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()} Best Holiday Plan. All rights reserved.
            </p>
            <p className="flex items-center gap-1.5 text-xs">
              Made with <Heart className="h-3 w-3 text-rose-400 fill-rose-400" /> for travelers everywhere
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
