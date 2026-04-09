import { Link, useNavigate } from "react-router-dom";
import { Compass, LogOut, User, Sun, Moon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreditDisplay } from "@/components/CreditDisplay";
import { toast } from "sonner";

interface HeaderProps {
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export function Header({ theme, onToggleTheme }: HeaderProps) {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

    const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Sign out error:', error);
        toast.success("Signed out successfully");
        navigate("/");
      } else {
        toast.success("Signed out successfully");
        navigate("/");
      }
    } catch (err) {
      console.error('Sign out exception:', err);
      toast.success("Signed out");
      navigate("/");
    }
  };

  const getInitials = () => {
    const name = user?.user_metadata?.full_name || user?.email || "";
    if (name.includes("@")) {
      return name.charAt(0).toUpperCase();
    }
    return name
      .split(" ")
      .map((n: string) => n.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/30 bg-background/70 backdrop-blur-xl shadow-soft">
      <div className="container mx-auto px-4 py-3.5">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-hero flex items-center justify-center shadow-medium group-hover:shadow-glow transition-all duration-500 group-hover:scale-105">
              <Compass className="h-5 w-5 text-primary-foreground transition-transform duration-500 group-hover:rotate-45" />
            </div>
            <span className="font-display text-xl font-bold text-foreground tracking-tight">
              Best Holiday Plan
            </span>
          </Link>

          <nav className="flex items-center gap-3">
            {/* Theme Toggle */}
            {onToggleTheme && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleTheme}
                className="h-9 w-9 rounded-xl hover:bg-accent/10 transition-colors duration-300"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4 transition-transform duration-300 hover:rotate-45" />
                ) : (
                  <Moon className="h-4 w-4 transition-transform duration-300 hover:-rotate-12" />
                )}
              </Button>
            )}

            {!loading && !user && (
              <>
                <Link
                  to="/#how-it-works"
                  className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 font-medium"
                >
                  How It Works
                </Link>
                <Button variant="outline" size="sm" onClick={() => navigate("/auth")} className="rounded-xl border-border/50 hover:border-accent/50 transition-all duration-300">
                  Sign In
                </Button>
                <Button variant="premium" size="sm" onClick={() => navigate("/auth")} className="rounded-xl shadow-soft hover:shadow-medium transition-all duration-300">
                  Get Started
                </Button>
              </>
            )}

            {!loading && user && (
              <>
                <CreditDisplay />
                <Link
                  to="/trips"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 font-medium"
                >
                  My Trips
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-xl p-0">
                      <Avatar className="h-9 w-9 ring-2 ring-accent/20 hover:ring-accent/40 transition-all duration-300">
                        <AvatarImage src={user.user_metadata?.avatar_url} alt="Profile" />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold text-sm">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-elevated border-border/50 backdrop-blur-xl">
                    <div className="px-3 py-2.5">
                      <p className="text-sm font-semibold">
                        {user.user_metadata?.full_name || "Traveler"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/trips")} className="rounded-lg mx-1 cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      My Trips
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="rounded-lg mx-1 cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
