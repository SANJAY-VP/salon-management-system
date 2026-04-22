import React, { ReactNode } from "react";
import { PageLayoutDesktop, PageContainerDesktop } from "./Header";
import { ProfileSidebar } from "./ProfileSidebar";

interface ProfileLayoutProps {
  variant: "customer" | "barber";
  profile: any;
  isEditing: boolean;
  onToggleEdit: () => void;
  onLogout: () => void;
  menuItems: Array<{ label: string; icon: any }>;
  children: ReactNode;
}

export const ProfileLayout = ({
  variant,
  profile,
  isEditing,
  onToggleEdit,
  onLogout,
  menuItems,
  children
}: ProfileLayoutProps) => {
  return (
    <PageLayoutDesktop variant={variant}>
      <PageContainerDesktop maxWidth="xl" className="px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mt-12 mb-32">
          {/* LEFT SIDEBAR */}
          <ProfileSidebar
            profile={profile}
            isEditing={isEditing}
            onToggleEdit={onToggleEdit}
            onLogout={onLogout}
            menuItems={menuItems}
          />

          {/* RIGHT CONTENT */}
          <div className="lg:col-span-8 space-y-10 animate-fade-in">
            {children}
          </div>
        </div>
      </PageContainerDesktop>
    </PageLayoutDesktop>
  );
};
