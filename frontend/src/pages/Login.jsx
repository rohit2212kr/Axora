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

  // Clear any stale errors when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const onSubmit = ({ email, password }) => {
    dispatch(loginUser({ email, password }));
  };

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo / heading */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white tracking-tight">Axora</h1>
          <p className="text-slate-400 mt-2 text-sm">Sign in to your workspace</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">

          {/* Error alert */}
          {error && (
            <div className="mb-5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
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
                  className={`w-full bg-slate-800 text-white placeholder-slate-500 rounded-lg pl-10 pr-4 py-2.5 text-sm border outline-none transition focus:ring-2 focus:ring-indigo-500 ${
                    errors.email
                      ? "border-red-500/60"
                      : "border-slate-700 focus:border-indigo-500"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 6, message: "Minimum 6 characters" },
                  })}
                  className={`w-full bg-slate-800 text-white placeholder-slate-500 rounded-lg pl-10 pr-4 py-2.5 text-sm border outline-none transition focus:ring-2 focus:ring-indigo-500 ${
                    errors.password
                      ? "border-red-500/60"
                      : "border-slate-700 focus:border-indigo-500"
                  }`}
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-2.5 text-sm transition-colors mt-2"
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
          <p className="text-center text-slate-500 text-sm mt-6">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
