import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "../../hooks/useAuthStore";
import AuthLayout from "../../components/auth/AuthLayout";
import { useNavigate } from "react-router-dom";
import { AnimatedLink } from "../../components/common/AnimatedLink";
import Button from "../../components/common/Button";
import toast from "react-hot-toast";
import {
  AuthFormField,
  PasswordField,
  AuthErrorBanner,
} from "../../components/auth/AuthFormField";
import { Icon } from "../../components/common/Icon";
import { registerSchema, RegisterFormData } from "../../utils/authSchemas";

export default function Register() {
  const { register: registerUser } = useAuthStore();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<"customer" | "barber">("customer");

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "customer" },
  });

  const handleRoleSelect = (role: "customer" | "barber") => {
    setSelectedRole(role);
    setValue("role", role, { shouldValidate: true });
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const user = await registerUser({
        name: data.name,
        phone: data.phone,
        email: data.email,
        password: data.password,
        role: data.role,
      });
      toast.success(`Welcome, ${user.name}! Account created.`);
      if (user.role === "barber") {
        navigate("/barber/dashboard");
      } else {
        navigate("/home");
      }
    } catch (err: any) {
      const msg = err.message || "Registration failed. Please try again.";
      setError("root", { message: msg });
      toast.error(msg);
    }
  };

  return (
    <AuthLayout>
      <div className="animate-fade-up">
        <h1 className="text-3xl font-black text-white mb-2 leading-tight">Create account</h1>
        <p className="text-white/60 text-sm font-medium mb-8 flex items-center gap-3">
          Already have an account?{" "}
          <AnimatedLink to="/login">Log in</AnimatedLink>
        </p>

        {/* Role Selection */}
        <div className="mb-8">
          <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-3">
            I want to...
          </p>
          <div className="grid grid-cols-2 gap-4">
            {(
              [
                {
                  value: "customer",
                  label: "Customer",
                  icon: "profile",
                  sub: "Browse & book",
                },
                {
                  value: "barber",
                  label: "Barber",
                  icon: "scissors",
                  sub: "Manage salon",
                },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleRoleSelect(opt.value)}
                className={`p-10 rounded-[40px] border-2 text-center transition-all duration-700 cursor-pointer relative group overflow-hidden ${
                  selectedRole === opt.value
                    ? "border-gold bg-gold/10 shadow-2xl shadow-gold/20 scale-[1.02]"
                    : "border-white/5 bg-white/[0.02] hover:border-white/10"
                }`}
              >
                {/* Decorative Pattern */}
                <div className={`absolute top-0 right-0 w-20 h-20 bg-gold/5 blur-2xl rounded-full -mr-10 -mt-10 transition-opacity duration-700 ${selectedRole === opt.value ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`} />
                
                <div className={`w-14 h-14 rounded-2xl mx-auto mb-6 flex items-center justify-center transition-all duration-700 ${
                  selectedRole === opt.value ? "bg-gold text-[#0B0B0F]" : "bg-white/5 text-white/30 group-hover:text-white/60"
                }`}>
                   <Icon icon={opt.icon as any} size={24} />
                </div>

                <p
                  className={`text-sm font-black uppercase tracking-widest mb-1 transition-colors ${
                    selectedRole === opt.value ? "text-white" : "text-white/60 group-hover:text-white/60"
                  }`}
                >
                  {opt.label}
                </p>
                <p className={`text-[8px] uppercase tracking-[0.3em] font-black transition-colors ${selectedRole === opt.value ? "text-gold/60" : "text-white/10"}`}>{opt.sub}</p>
                
                {selectedRole === opt.value && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <div className="w-1 h-1 rounded-full bg-gold" />
                  </div>
                )}
              </button>
            ))}
          </div>
          {errors.role && (
            <p className="text-red-400 text-xs mt-2">{errors.role.message}</p>
          )}
        </div>

        <AuthErrorBanner message={errors.root?.message} />

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <AuthFormField label="Full Name" error={errors.name?.message}>
              <input
                type="text"
                placeholder="Your name"
                {...register("name")}
                className="cursor-text"
              />
            </AuthFormField>
            <AuthFormField label="Phone Number" error={errors.phone?.message}>
              <input
                type="tel"
                maxLength={10}
                placeholder="10-digit mobile number"
                {...register("phone")}
                className="cursor-text"
              />
            </AuthFormField>
          </div>

          <AuthFormField label="Email" error={errors.email?.message}>
            <input
              type="email"
              placeholder="Email address"
              {...register("email")}
              className="cursor-text"
            />
          </AuthFormField>

          <PasswordField
            label="Password"
            placeholder="At least 8 characters"
            error={errors.password?.message}
            showStrength
            registerProps={register("password")}
          />

          <PasswordField
            label="Confirm Password"
            placeholder="Repeat password"
            error={errors.confirmPassword?.message}
            registerProps={register("confirmPassword")}
          />

          <Button type="submit" fullWidth loading={isSubmitting} loadingText="Creating account...">
            Sign Up as {selectedRole === "barber" ? "Salon Owner" : "Customer"} &rarr;
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}
