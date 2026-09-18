import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Link, Navigate } from "react-router-dom";
import { Mail, Lock, Loader2 } from "lucide-react";
import { loginUser, clearError } from "../features/authSlice";

const Login = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, loading, error } = useSelector((s) => s.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const onSubmit = ({ email, password }) => {
    dispatch(loginUser({ email, password }));
  };

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo / heading */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Axora</h1>
          <p className="text-muted-foreground mt-2 text-sm">Sign in to your workspace</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">

          {/* Error alert */}
          {error && (
            <div className="mb-5 bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Enter a valid email address",
                    },
                  })}
                  className={`w-full bg-muted text-foreground placeholder-muted-foreground rounded-lg pl-10 pr-4 py-2.5 text-sm border outline-none transition focus:ring-2 focus:ring-ring ${
                    errors.email
                      ? "border-destructive/60"
                      : "border-border focus:border-ring"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="password"
                  placeholder="········"
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 6, message: "Minimum 6 characters" },
                  })}
                  className={`w-full bg-muted text-foreground placeholder-muted-foreground rounded-lg pl-10 pr-4 py-2.5 text-sm border outline-none transition focus:ring-2 focus:ring-ring ${
                    errors.password
                      ? "border-destructive/60"
                      : "border-border focus:border-ring"
                  }`}
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-semibold rounded-lg py-2.5 text-sm transition-colors mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Footer link */}
          <p className="text-center text-muted-foreground text-sm mt-6">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
