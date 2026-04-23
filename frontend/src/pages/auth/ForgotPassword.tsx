import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LuMailCheck, LuKeyRound } from "react-icons/lu";
import { authService } from "../../services/auth.service";
import AuthLayout from "../../components/auth/AuthLayout";
import { AnimatedLink } from "../../components/common/AnimatedLink";
import Button from "../../components/common/Button";
import toast from "react-hot-toast";
import {
    AuthFormField,
} from "../../components/auth/AuthFormField";
import { forgotPasswordSchema, ForgotPasswordFormData } from "../../utils/authSchemas";

type Stage = "email" | "sent";

export default function ForgotPassword() {
    const [stage, setStage] = useState<Stage>("email");
    const [sentEmail, setSentEmail] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ForgotPasswordFormData>({ resolver: zodResolver(forgotPasswordSchema) });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        setSentEmail(data.email);
        try {
            await authService.forgotPassword(data.email);
            setStage("sent");
        } catch (err: any) {
            toast.error(err?.response?.data?.detail || "Failed to send reset link");
        }
    };

    return (
        <AuthLayout>
            <div className="animate-fade-up">
                {stage === "email" ? (
                    <>
                        <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mb-6">
                            <LuKeyRound size={24} className="text-gold" />
                        </div>
                        <h1 className="text-3xl font-black text-white mb-2 leading-tight">
                            Forgot password?
                        </h1>
                        <p className="text-white/60 text-sm font-medium mb-12">
                            No worries. Enter your registered email and we'll send you a reset link.
                        </p>

                        <form onSubmit={handleSubmit(onSubmit)} noValidate>
                            <AuthFormField label="Email Address" error={errors.email?.message}>
                                <input
                                    id="forgot-email"
                                    type="email"
                                    placeholder="Enter your registered email"
                                    {...register("email")}
                                />
                            </AuthFormField>

                            <Button type="submit" fullWidth loading={isSubmitting} loadingText="Sending...">
                                Send Reset Link &rarr;
                            </Button>

                            <p className="text-center text-white/50 text-sm mt-8">
                                Remember your password?{" "}
                                <AnimatedLink to="/login">Log in</AnimatedLink>
                            </p>
                        </form>
                    </>
                ) : (
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 mx-auto">
                            <LuMailCheck size={28} className="text-emerald-400" />
                        </div>

                        <h1 className="text-3xl font-black text-white mb-3 leading-tight">
                            Check your inbox
                        </h1>
                        <p className="text-white/70 text-base leading-relaxed mb-12">
                            We've sent a reset link to<br />
                            <strong className="text-gold">{sentEmail}</strong>
                            <br /><br />
                            Didn't see it? Check your spam folder.
                        </p>

                        <div className="space-y-6">
                            <button
                                type="button"
                                onClick={() => setStage("email")}
                                className="w-full py-4 rounded-xl border border-gold/30 text-gold font-bold text-sm hover:bg-gold/5 transition-all cursor-pointer"
                            >
                                Try a different email
                            </button>

                            <AnimatedLink to="/login" className="block text-white/50 hover:text-white transition-colors text-sm font-medium">
                                &larr; Back to sign in
                            </AnimatedLink>
                        </div>
                    </div>
                )}
            </div>
        </AuthLayout>
    );
}
