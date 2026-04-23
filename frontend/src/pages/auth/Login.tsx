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
import { loginSchema, LoginFormData } from "../../utils/authSchemas";

export default function Login() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const user = await login(data.email, data.password);
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === "barber") {
        navigate("/barber/dashboard");
      } else {
        navigate("/home");
      }
    } catch (err: any) {
      const msg = err.message || "Login failed. Please check your credentials.";
      setError("root", { message: msg });
      toast.error(msg);
    }
  };

  return (
    <AuthLayout>
      <div className="animate-fade-up">
        <h1 className="text-3xl font-black text-white mb-2 leading-tight">
          Welcome back
        </h1>
        <p className="text-white/60 text-sm font-medium mb-12 flex items-center gap-3">
          New to the collective? 
          <AnimatedLink to="/register">Sign up</AnimatedLink>
        </p>
        
        <AuthErrorBanner message={errors.root?.message} />

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <AuthFormField label="Email" error={errors.email?.message}>
            <input type="email" placeholder="Email address" {...register("email")} className="cursor-text" />
          </AuthFormField>

          <PasswordField
            label="Password"
            placeholder="Account password"
            error={errors.password?.message}
            labelRight={
              <AnimatedLink to="/forgot-password" className="text-xs">Forgot password?</AnimatedLink>
            }
            registerProps={register("password")}
          />

          <Button type="submit" fullWidth loading={isSubmitting} loadingText="Signing In...">Sign In &rarr;</Button>
        </form>
      </div>
    </AuthLayout>
  );
}
