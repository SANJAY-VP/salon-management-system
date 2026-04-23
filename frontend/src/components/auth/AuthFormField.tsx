import React, { useState } from "react";
import { LuEye, LuEyeOff, LuTriangleAlert } from "react-icons/lu";
import { useAuthStore } from "../../hooks/useAuthStore";
import { useNavigate } from "react-router-dom";
import { GOOGLE_LOGO_URL } from "../../data/authData";

export function AuthErrorBanner({ message }: { message?: string }) {
    if (!message) return null;
    return (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-xs font-bold uppercase tracking-wider flex items-center gap-3 mb-6 animate-fade-in shadow-lg">
            <LuTriangleAlert size={16} />
            {message}
        </div>
    );
}

interface AuthFormFieldProps {
    label: string;
    error?: string;
    labelRight?: React.ReactNode;
    children: React.ReactNode;
}

export function AuthFormField({ label, error, labelRight, children }: AuthFormFieldProps) {
    return (
        <div className="mb-6 animate-fade-in">
            {(label || labelRight) && (
                <div className="flex justify-between items-center mb-3 px-1">
                    <label className="text-[11px] font-black text-white/65 uppercase tracking-[0.2em]">{label}</label>
                    {labelRight}
                </div>
            )}
            <div className={`relative group w-full bg-surface border rounded-xl px-5 py-3.5 transition-all focus-within:border-gold/80 focus-within:bg-white/[0.03] focus-within:ring-4 focus-within:ring-gold/[0.05] shadow-inner flex items-center ${error ? "border-red-500/50" : "border-white/[0.08]"}`}>
                <div className="w-full relative z-10 [&>input]:w-full [&>input]:bg-transparent [&>input]:border-none [&>input]:outline-none [&>input]:text-white [&>input]:text-sm [&>input]:font-medium [&>input]:placeholder:text-white/30">
                    {children}
                </div>
                <div className="absolute inset-0 rounded-xl bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
            {error && (
                <p className="text-red-500 font-bold text-xs mt-2 px-1 flex items-center gap-2">
                    <LuTriangleAlert size={12} />
                    {error}
                </p>
            )}
        </div>
    );
}

interface PasswordFieldProps {
    label?: string;
    placeholder?: string;
    error?: string;
    labelRight?: React.ReactNode;
    showStrength?: boolean;
    registerProps?: any;
}

export function PasswordField({ label = "Password", placeholder = "Enter password", error, labelRight, showStrength = false, registerProps }: PasswordFieldProps) {
    const [show, setShow] = useState(false);
    return (
        <AuthFormField label={label} labelRight={labelRight} error={error}>
            <div className="relative group/field w-full flex items-center">
                <input
                    type={show ? "text" : "password"}
                    placeholder={placeholder}
                    {...registerProps}
                    className="w-full bg-transparent border-none outline-none focus:ring-0 pr-12 text-white text-sm font-medium placeholder:text-white/30"
                />
                <button
                    type="button"
                    onClick={() => setShow(s => !s)}
                    aria-label={show ? "Hide password" : "Show password"}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors cursor-pointer z-20"
                >
                    {show ? <LuEyeOff size={18} /> : <LuEye size={18} />}
                </button>
            </div>
        </AuthFormField>
    );
}

export function AuthDivider({ label = "or continue with" }: { label?: string }) {
    return (
        <div className="flex items-center gap-6 my-8" aria-hidden="true">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 whitespace-nowrap">{label}</span>
            <div className="flex-1 h-px bg-white/10" />
        </div>
    );
}

export function GoogleButton() {
    const { loginWithGoogle } = useAuthStore();
    const navigate = useNavigate();

    const handleGoogleLogin = async () => {
        try {
            await loginWithGoogle();
            const user = useAuthStore.getState().user;
            if (user?.role === "barber") {
                navigate("/barber/dashboard");
            } else {
                navigate("/home");
            }
        } catch (error) {
            console.error("Google login failed", error);
        }
    };

    return (
        <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-sm font-bold hover:border-white/30 transition-all duration-300 group shadow-lg active:scale-[0.98] cursor-pointer"
        >
            <img src={GOOGLE_LOGO_URL} alt="" aria-hidden className="w-5 h-5 grayscale-0 transition-all" />
            Continue with Google
        </button>
    );
}
