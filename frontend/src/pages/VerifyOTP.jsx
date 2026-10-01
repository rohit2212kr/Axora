import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useLocation, Link } from "react-router-dom";
import { ShieldCheck, Loader2, RefreshCw, ArrowLeft } from "lucide-react";
import { verifyOTP, resendOTP, clearError, clearAuthFlow } from "../features/authSlice";

const VerifyOTP = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const {
    isAuthenticated,
    loading,
    error,
    successMessage,
    pendingEmail,
  } = useSelector((s) => s.auth);

  const email = location.state?.email || pendingEmail;

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
    if (inputRefs.current[0]) inputRefs.current[0].focus();
  }, []);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (newDigits.every((d) => d !== "")) {
      dispatch(verifyOTP({ email, otp: newDigits.join("") }));
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
      dispatch(verifyOTP({ email, otp: newDigits.join("") }));
    }
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    dispatch(resendOTP({ email }));
    setCooldown(60);
    setOtpDigits(["", "", "", "", "", ""]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const otp = otpDigits.join("");
    if (otp.length !== 6) return;
    dispatch(verifyOTP({ email, otp }));
  };

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  if (!email) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Login</span>
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Verify your email</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Enter the 6-digit code sent to{" "}
            <span className="text-foreground font-medium">{email}</span>
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

          <form onSubmit={handleSubmit} className="space-y-6">
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
};

export default VerifyOTP;
