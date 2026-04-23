import { Icon, type IconKey } from "./Icon";

interface NavigationProps {
  variant: "customer" | "barber";
}

interface NavItem {
  label: string;
  icon: IconKey;
  href: string;
}

export default function Navigation({ variant }: NavigationProps) {
  const navItems: NavItem[] =
    variant === "customer"
      ? [
          { label: "Home", icon: "home", href: "/home" },
          { label: "Bookings", icon: "calendar", href: "/customer/bookings" },
          { label: "Rewards", icon: "gift", href: "/customer/rewards" },
          { label: "Profile", icon: "profile", href: "/customer/profile" },
        ]
      : [
          { label: "Dashboard", icon: "dashboard", href: "/barber/dashboard" },
          { label: "Bookings", icon: "calendar", href: "/barber/bookings" },
          { label: "Earnings", icon: "earnings", href: "/barber/earnings" },
          { label: "Profile", icon: "profile", href: "/barber/profile" },
        ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
      <div className="flex justify-around items-center h-20 max-w-2xl mx-auto px-4">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center flex-1 py-2 text-xs text-gray-600 hover:text-blue-600 transition"
          >
            <Icon icon={item.icon} size={24} className="mb-1" />
            <span>{item.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
};


