import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, LogOut, Menu, Moon, Package, Search, ShoppingCart, Sun, User } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useTheme } from "@/hooks/useTheme";
import { useRecentSearches } from "@/hooks/useLocalHistory";
import { apiFetch } from "@/lib/api";
import { STORE } from "@/lib/store-config";
import type { Category } from "@/lib/db-types";

const POPULAR_SEARCHES = ["Casio FX-991ES Plus", "Whiteboard marker", "Mathematical tables", "Geometry set"];

export function SiteHeader() {
  const navigate = useNavigate();
  const { count } = useCart();
  const { user, profile, isAdmin, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const recent = useRecentSearches();
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [unread, setUnread] = useState(0);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

 useEffect(() => {
  void apiFetch<{ data: Category[] }>("/categories?per_page=100")
    .then((response) => setCategories(response.data ?? []))
    .catch((error) => {
      console.error("Failed to load categories:", error);
      setCategories([]);
    });
}, []);

 useEffect(() => {
  if (!user) {
    setUnread(0);
    return;
  }

  void apiFetch<{ unread: number }>("/notifications/unread-count")
    .then((data) => setUnread(data.unread ?? 0))
    .catch((error) => {
      console.error("Failed to load notification count:", error);
      setUnread(0);
    });
}, [user, pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setSuggestOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const submitSearch = (term: string) => {
    const q = term.trim();
    if (!q) return;
    recent.add(q);
    setSuggestOpen(false);
    void navigate({ to: "/products", search: { q } });
  };

  const greeting = profile?.name ? profile.name.split(" ")[0] : "there";

  return (
    <header className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center gap-3">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <div className="border-b p-4">
              <Logo />
            </div>
            <nav className="flex flex-col p-2">
              <Link
                to="/products"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent"
              >
                All products
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  to="/categories/$slug"
                  params={{ slug: c.slug }}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm hover:bg-accent"
                >
                  {c.name}
                </Link>
              ))}
              <Link
                to="/contact"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm hover:bg-accent"
              >
                Contact us
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-primary hover:bg-accent"
                >
                  Admin dashboard
                </Link>
              )}
            </nav>
          </SheetContent>
        </Sheet>

        <Link to="/" aria-label={STORE.name}>
          <Logo />
        </Link>

        <div ref={boxRef} className="relative ml-auto hidden flex-1 max-w-xl md:block">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitSearch(query);
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSuggestOpen(true)}
              placeholder="Search markers, calculators, pens…"
              aria-label="Search products"
              className="h-10 rounded-full pl-9"
            />
          </form>
          {suggestOpen && (
            <div className="absolute left-0 right-0 top-12 z-50 animate-scale-in rounded-2xl border bg-popover p-3 shadow-elevated">
              {recent.terms.length > 0 && (
                <>
                  <p className="px-1 pb-1 text-xs font-semibold text-muted-foreground">
                    Recent searches
                  </p>
                  {recent.terms.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => submitSearch(t)}
                      className="block w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-accent"
                    >
                      {t}
                    </button>
                  ))}
                  <div className="my-2 border-t" />
                </>
              )}
              <p className="px-1 pb-1 text-xs font-semibold text-muted-foreground">
                Popular right now
              </p>
              {POPULAR_SEARCHES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => submitSearch(t)}
                  className="block w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-accent"
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle dark mode">
            {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>

          <Button variant="ghost" size="icon" asChild aria-label="Notifications">
            <Link to="/notifications" className="relative">
              <Bell className="size-5" />
              {unread > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-0.5 -top-0.5 size-4 justify-center rounded-full p-0 text-[0.6rem]"
                >
                  {unread > 9 ? "9+" : unread}
                </Badge>
              )}
            </Link>
          </Button>

          <Button variant="ghost" size="icon" asChild aria-label="Shopping cart">
            <Link to="/cart" className="relative">
              <ShoppingCart className="size-5" />
              {count > 0 && (
                <Badge className="absolute -right-0.5 -top-0.5 size-4 justify-center rounded-full p-0 text-[0.6rem]">
                  {count > 9 ? "9+" : count}
                </Badge>
              )}
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Account menu">
                <User className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                {user ? `Hi, ${greeting}` : "Welcome to WAGI"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link to="/account">
                      <User className="mr-2 size-4" /> My profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/orders">
                      <Package className="mr-2 size-4" /> My orders
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin">Admin dashboard</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={async () => {
                      await signOut();
                      void navigate({ to: "/", replace: true });
                    }}
                  >
                    <LogOut className="mr-2 size-4" /> Sign out
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link to="/auth">Sign in</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/auth" search={{ mode: "register" }}>
                      Create an account
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile search row */}
      <div className="container-page pb-3 md:hidden">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitSearch(query);
          }}
          className="relative"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            className="h-10 rounded-full pl-9"
          />
        </form>
      </div>

      <nav className="hidden border-t lg:block">
        <div className="container-page flex h-11 items-center gap-1 overflow-x-auto no-scrollbar">
          <Link
            to="/products"
            className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium hover:bg-accent"
            activeProps={{ className: "bg-primary-soft text-primary" }}
          >
            All products
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/categories/$slug"
              params={{ slug: c.slug }}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              activeProps={{ className: "bg-primary-soft text-primary" }}
            >
              {c.name}
            </Link>
          ))}
          <Link
            to="/contact"
            className="ml-auto whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            Contact
          </Link>
        </div>
      </nav>
    </header>
  );
}
