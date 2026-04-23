import { ReactNode, useState, useEffect } from "react";
import { Icon } from "./Icon";
import { LuScissors, LuShoppingBag, LuGlobe } from "react-icons/lu";
import { useAuthStore } from "../../hooks/useAuthStore";
import { useCartStore } from "../../hooks/useCartStore";
import { useNavigate, Link, useLocation } from "react-router-dom";

interface HeaderProps {
  variant?: "customer" | "barber";
  onProfileClick?: () => void;
}

export function Header({ variant = "customer", onProfileClick }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const { items } = useCartStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Close language menu when clicking outside
  useEffect(() => {
    if (!showLangMenu) return;
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-lang-menu]")) setShowLangMenu(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showLangMenu]);

  // Indian languages + English supported by Google Translate
  const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
  ];

  const changeLanguage = (lang: string) => {
    setCurrentLang(lang);
    setShowLangMenu(false);
    // doGTranslate is defined in index.html — handles retry + cookie reset for English
    if (typeof (window as any).doGTranslate === 'function') {
      (window as any).doGTranslate(lang);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Determine nav items based on user role and auth status
  const getNavItems = () => {
    if (!user) {
      return [{ label: "Home", href: "/home" }, { label: "Explore", href: "/customer/search" }];
    }

    if (user.role === "barber") {
      return [
        { label: "Home", href: "/home" },
        { label: "Dashboard", href: "/barber/dashboard" },
        // { label: "Earnings", href: "/barber/earnings" },
        { label: "Profile", href: "/barber/profile" },
      ];
    }

    return [
      { label: "Home", href: "/home" },
      { label: "Explore", href: "/customer/search" },
      // { label: "Bookings", href: "/customer/bookings" },
      { label: "Profile", href: "/customer/profile" },
    ];
  };

  const navItems = getNavItems();

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
      isScrolled ? "py-3 md:py-4 bg-background/90 backdrop-blur-3xl border-b border-white/[0.05]" : "py-4 md:py-8 bg-transparent"
    }`}>
      <div className="max-w-[1600px] mx-auto px-4 md:px-12">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="text-gold group-hover:drop-shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all">
              <LuScissors size={26} className="md:w-8 md:h-8" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg md:text-xl font-black tracking-[-0.04em] text-white leading-none">
                Salon<span className="text-gold">Book</span>
              </span>
              <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em] mt-0.5 hidden sm:block">Booking App</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 lg:gap-12">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`text-sm lg:text-base font-bold transition-all duration-300 cursor-pointer relative py-2 ${
                    isActive ? "text-gold" : "text-white/60 hover:text-white"
                  }`}
                >
                  {item.label}
                  <span className={`absolute -bottom-1 left-0 h-[1.5px] bg-gold transition-all duration-500 origin-left ${
                    isActive ? "w-full scale-x-100" : "w-0 scale-x-0"
                  }`} />
                </Link>
              );
            })}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-3 md:gap-6 lg:gap-10">
            {/* Cart — customer only */}
            {user && user.role === "customer" && (
              <Link to="/customer/cart" className="relative group p-2.5 rounded-full bg-white/[0.03] border border-white/[0.05] hover:border-gold/30 transition-all cursor-pointer">
                <LuShoppingBag size={18} className={`transition-all duration-500 ${items.length > 0 ? "text-gold animate-bounce-slow" : "text-white/60 group-hover:text-gold"}`} />
                {items.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold text-background text-[9px] font-black flex items-center justify-center shadow-lg">
                    {items.length}
                  </span>
                )}
              </Link>
            )}

            {/* Language selector */}
            <div className="relative hidden sm:block" data-lang-menu>
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-gold/30 transition-all cursor-pointer text-white/60 hover:text-gold"
                title="Change Language"
                aria-label="Select language"
              >
                <LuGlobe size={16} />
                <span className="text-[10px] font-black uppercase tracking-wider hidden lg:block">
                  {LANGUAGES.find(l => l.code === currentLang)?.code.toUpperCase() || "EN"}
                </span>
              </button>
              {showLangMenu && (
                <div className="absolute top-full right-0 mt-2 w-40 py-1 bg-[#1a1a1f] border border-white/[0.08] rounded-xl shadow-2xl z-[9999] max-h-72 overflow-y-auto">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gold/10 cursor-pointer flex items-center justify-between ${
                        currentLang === lang.code ? "text-gold font-bold" : "text-white/70"
                      }`}
                    >
                      <span>{lang.label}</span>
                      {currentLang === lang.code && <span className="text-gold text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auth buttons — desktop */}
            {user ? (
              <button
                onClick={handleLogout}
                className="hidden md:block px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold hover:bg-red-500 hover:text-white transition-all cursor-pointer"
              >
                Log Out
              </button>
            ) : (
              <div className="hidden md:flex items-center gap-4">
                <Link to="/login" className="text-sm font-bold text-white/60 hover:text-gold transition-colors cursor-pointer">
                  Log In
                </Link>
                <Link to="/register" className="px-5 py-2 rounded-xl bg-gold text-background text-sm font-bold hover:brightness-110 transition-all cursor-pointer shadow-lg shadow-gold/10">
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-gold transition-all"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              <div className="w-5 flex flex-col gap-1.5">
                <span className={`block h-0.5 bg-current transition-all origin-center ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
                <span className={`block h-0.5 bg-current transition-all ${mobileOpen ? "opacity-0" : ""}`} />
                <span className={`block h-0.5 bg-current transition-all origin-center ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/5 animate-fade-in">
            <nav className="flex flex-col gap-1 mt-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    location.pathname === item.href
                      ? "bg-gold/10 text-gold"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between px-2">
              {/* Language selector mobile */}
              <div className="relative" data-lang-menu>
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-bold"
                >
                  <LuGlobe size={14} />
                  {LANGUAGES.find(l => l.code === currentLang)?.label || "English"}
                </button>
                {showLangMenu && (
                  <div className="absolute bottom-full mb-2 left-0 w-44 py-1 bg-[#1a1a1f] border border-white/10 rounded-xl shadow-2xl z-[9999] max-h-56 overflow-y-auto">
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gold/10 cursor-pointer flex justify-between ${
                          currentLang === lang.code ? "text-gold font-bold" : "text-white/70"
                        }`}
                      >
                        <span>{lang.label}</span>
                        {currentLang === lang.code && <span className="text-gold text-xs">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {user ? (
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold"
                >
                  Log Out
                </button>
              ) : (
                <div className="flex gap-3">
                  <Link to="/login" className="px-4 py-2 rounded-xl border border-white/10 text-white/60 text-xs font-bold">Log In</Link>
                  <Link to="/register" className="px-4 py-2 rounded-xl bg-gold text-background text-xs font-bold">Sign Up</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
        .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </header>
  );
}

interface PageLayoutProps {
  children: ReactNode;
  variant?: "customer" | "barber";
  showHeader?: boolean;
  className?: string;
  fullScreen?: boolean;
}

export function PageLayoutDesktop({
  children,
  variant = "customer",
  showHeader = true,
  className = "",
  fullScreen = false,
}: PageLayoutProps) {
  const navigate = useNavigate();
  return (
    <div className={`min-h-screen bg-background text-silver ${className}`}>
      {showHeader && (
        <Header
          variant={variant}
          onProfileClick={() => navigate(`/${variant}/profile`)}
        />
      )}
      <main className={`relative w-full ${fullScreen ? "" : "pt-24 md:pt-40 pb-16 md:pb-20"}`}>
        {children}
      </main>
    </div>
  );
}

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

export function PageContainerDesktop({
  children,
  className = "",
  maxWidth = "md",
}: PageContainerProps) {
  const maxWidthClasses = {
    sm: "max-w-2xl",
    md: "max-w-4xl",
    lg: "max-w-6xl",
    xl: "max-w-[1200px]",
    "2xl": "max-w-[1400px]",
    full: "w-full",
  };

  return <div className={`${maxWidthClasses[maxWidth]} mx-auto px-4 md:px-6 ${className}`}>{children}</div>;
}

interface GridProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
  className?: string;
}

export function Grid({ children, cols = 3, gap = "md", className = "" }: GridProps) {
  const colsClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  const gapClass = {
    sm: "gap-4",
    md: "gap-8",
    lg: "gap-12",
  };

  return (
    <div className={`grid ${colsClass[cols]} ${gapClass[gap]} ${className}`}>{children}</div>
  );
}

export function PageHeader({ title, subtitle, action, onBack }: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  onBack?: () => void;
}) {
  return (
    <div className="mb-16 animate-fade-in relative z-10 px-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
        <div className="flex-1">
          {onBack && (
            <button
              onClick={onBack}
              className="group flex items-center gap-4 text-gold mb-10 transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl border border-gold/10 flex items-center justify-center group-hover:border-gold group-hover:bg-gold/5 transition-all">
                <Icon icon="back" size={14} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest italic">Back</span>
            </button>
          )}
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6 leading-[1.1]">
            {title}
          </h1>
          {subtitle && (
            <p className="text-base text-white/60 font-medium max-w-2xl leading-relaxed tracking-wide">{subtitle}</p>
          )}
        </div>
        {action && <div className="animate-fade-up delay-100 shrink-0">{action}</div>}
      </div>
    </div>
  );
}

export function Tabs({ tabs, activeTab, onTabChange }: {
  tabs: Array<{ id: string; label: string }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}) {
  return (
    <div
      role="tablist"
      className="flex gap-1 md:gap-2 p-1 bg-white/[0.03] border border-white/[0.05] rounded-2xl mb-8 md:mb-12 w-full md:w-fit overflow-x-auto scrollbar-hide relative z-10"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={`flex-shrink-0 px-5 md:px-10 py-3 md:py-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-500 cursor-pointer whitespace-nowrap relative ${
              isActive
                ? "bg-white/[0.06] text-gold shadow-xl"
                : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
            }`}
          >
            {tab.label}
            {isActive && (
              <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-gold rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
