import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, User, Loader2, ArrowLeft, ShieldCheck, RefreshCw } from "lucide-react";
import { registerUser, verifyOTP, resendOTP, clearError, clearAuthFlow } from "../features/authSlice";

const Signup = () => {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const dispatch = useDispatch();
  const {
    isAuthenticated,
    loading,
    error,
    otpSent,
    pendingEmail,
    successMessage,
  } = useSelector((s) => s.auth);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formErrors, setFormErrors] = useState({});

  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);

  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    dispatch(clearError());
    return () => dispatch(clearAuthFlow());
  }, [dispatch]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  useEffect(() => {
    if (otpSent && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [otpSent]);

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = "Full name is required";
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email";
    if (!password) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "Minimum 6 characters";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!validate()) return;
    dispatch(registerUser({ name, email, password }));
    setCooldown(60);
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (newDigits.every((d) => d !== "")) {
      dispatch(verifyOTP({ email: pendingEmail, otp: newDigits.join("") }));
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) newDigits[i] = pasted[i] || "";
    setOtpDigits(newDigits);
    if (newDigits.every((d) => d !== "")) {
      dispatch(verifyOTP({ email: pendingEmail, otp: newDigits.join("") }));
    }
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    dispatch(resendOTP({ email: pendingEmail }));
    setCooldown(60);
    setOtpDigits(["", "", "", "", "", ""]);
  };

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    const otp = otpDigits.join("");
    if (otp.length !== 6) return;
    dispatch(verifyOTP({ email: pendingEmail, otp }));
  };

  if (isAuthenticated) return <Navigate to={redirectTo} replace />;

  // ── OTP Verification Screen ──
  if (otpSent && pendingEmail) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Verify your email</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              We sent a 6-digit code to{" "}
              <span className="text-foreground font-medium">{pendingEmail}</span>
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
            {error && (
              <div className="mb-5 bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="mb-5 bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-3">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleVerifySubmit} className="space-y-6">
              <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-12 h-14 text-center text-xl font-bold bg-muted text-foreground border border-border rounded-lg outline-none transition-all focus:ring-2 focus:ring-ring focus:border-ring"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || otpDigits.some((d) => !d)}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-semibold rounded-lg py-2.5 text-sm transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Email"
                )}
              </button>
            </form>

            <div className="text-center mt-6">
              <p className="text-muted-foreground text-sm">
                Didn&apos;t receive the code?{" "}
                {cooldown > 0 ? (
                  <span className="text-muted-foreground/60">Resend in {cooldown}s</span>
                ) : (
                  <button
                    onClick={handleResend}
                    className="text-primary hover:text-primary/80 font-medium transition-colors inline-flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Resend
                  </button>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Registration Form ──
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Home</span>
          </Link>
        </div>

        <div className="text-center mb-8">
          <Link to="/" className="inline-block hover:opacity-90 transition-opacity">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-sky-400 bg-clip-text text-transparent">
              Axora
            </h1>
          </Link>
          <p className="text-muted-foreground mt-2 text-sm">Create your account</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="mb-5 bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} noValidate className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full bg-muted text-foreground placeholder-muted-foreground rounded-lg pl-10 pr-4 py-2.5 text-sm border outline-none transition focus:ring-2 focus:ring-ring ${
                    formErrors.name ? "border-destructive/60" : "border-border focus:border-ring"
                  }`}
                />
              </div>
              {formErrors.name && (
                <p className="mt-1.5 text-xs text-destructive">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full bg-muted text-foreground placeholder-muted-foreground rounded-lg pl-10 pr-4 py-2.5 text-sm border outline-none transition focus:ring-2 focus:ring-ring ${
                    formErrors.email ? "border-destructive/60" : "border-border focus:border-ring"
                  }`}
                />
              </div>
              {formErrors.email && (
                <p className="mt-1.5 text-xs text-destructive">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="password"
                  placeholder={"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full bg-muted text-foreground placeholder-muted-foreground rounded-lg pl-10 pr-4 py-2.5 text-sm border outline-none transition focus:ring-2 focus:ring-ring ${
                    formErrors.password ? "border-destructive/60" : "border-border focus:border-ring"
                  }`}
                />
              </div>
              {formErrors.password && (
                <p className="mt-1.5 text-xs text-destructive">{formErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-semibold rounded-lg py-2.5 text-sm transition-colors mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="text-center text-muted-foreground text-sm mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
