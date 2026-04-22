import { ReactNode } from "react";
import Navigation from "./Navigation";

interface PageLayoutProps {
  children: ReactNode;
  navVariant?: "customer" | "barber";
  className?: string;
}

export function PageLayout({ children, navVariant = "customer", className = "" }: PageLayoutProps) {
  return (
    <div className={`min-h-screen bg-gray-50 pb-24 ${className}`}>
      <div className="flex-grow">
        {children}
      </div>
      {navVariant && <Navigation variant={navVariant} />}
    </div>
  );
}

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className = "" }: PageContainerProps) {
  return <div className={`max-w-2xl mx-auto px-4 py-4 ${className}`}>{children}</div>;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  onBack?: () => void;
}

export function PageHeader({ title, subtitle, action, onBack }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {onBack && (
            <button
              onClick={onBack}
              className="text-blue-600 font-medium mb-2 hover:text-blue-700 transition"
            >
              ← Back
            </button>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}

interface TabsProps {
  tabs: Array<{ id: string; label: string }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="flex border-b border-gray-200 mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 py-3 font-medium transition ${
            activeTab === tab.id
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

interface GridProps {
  children: ReactNode;
  columns?: number;
  gap?: number;
}

export function Grid({ children, columns = 2, gap = 4 }: GridProps) {
  return (
    <div className={`grid grid-cols-${columns} gap-${gap}`}>
      {children}
    </div>
  );
}
