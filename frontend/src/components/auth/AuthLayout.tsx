import React from "react";
import { LuScissors } from "react-icons/lu";

export function AuthBrand() {
    return (
        <div className="flex items-center gap-4 mb-16 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center text-background shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                <LuScissors size={20} />
            </div>
            <span className="text-xl font-black tracking-[-0.04em] text-white">
              Salon<span className="text-gold">Book</span>
            </span>
        </div>
    );
}

interface AuthLayoutProps {
    children: React.ReactNode;
    formMaxWidth?: number;
}

export default function AuthLayout({ children, formMaxWidth = 440 }: AuthLayoutProps) {
    return (
        <div className="flex min-h-screen bg-background text-silver selection:bg-gold selection:text-background font-sans overflow-hidden">
            {/* Center Panel: Form */}
            <div className={`flex-1 flex flex-col items-center justify-center p-8 md:p-12 lg:p-24 overflow-y-auto bg-background`}>
                <div className="w-full flex flex-col items-center" style={{ maxWidth: formMaxWidth }}>
                    <AuthBrand />
                    <div className="w-full animate-fade-up delay-100">
                      {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
