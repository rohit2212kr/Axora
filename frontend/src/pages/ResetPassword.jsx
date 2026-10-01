import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Lock, Loader2, ArrowLeft, KeyRound, CheckCircle } from "lucide-react";
import { resetPassword, clearError, clearAuthFlow } from "../features/authSlice";

const ResetPassword = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const {
    isAuthenticated,
    loading,
    error,
    resetSuccess,
    successMessage,
    pendingEmail,
  } = useSelector((s) => s.auth);

  const email = location.state?.email || pendingEmail;

  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const inputRefs = useRef([]);

  useEffect(() => {
    dispatch(clearError());
    return () => dispatch(clearAuthFlow());
  }, [dispatch]);

  useEffect(() => {
    if (inputRefs.current[0]) inputRefs.current[0].focus();
  }, []);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
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
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    const otp = otpDigits.join("");
    if (otp.length !== 6) errs.otp = "Enter all 6 digits";
    if (!newPassword) errs.newPassword = "New password is required";
    else if (newPassword.length < 6) errs.newPassword = "Minimum 6 characters";
    if (newPassword !== confirmPassword) errs.confirmPassword = "Passwords do not match";
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;
    dispatch(resetPassword({ email, otp, newPassword }));
  };

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  if (!email) return <Navigate to="/forgot-password" replace />;

  // Success screen
  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Password Reset</h1>
          <p className="text-muted-foreground text-sm mb-6">
            {successMessage || "Your password has been reset successfully."}
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg px-6 py-2.5 text-sm transition-colors"
          >
            Sign in with new password
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back</span>
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <KeyRound className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Enter the code sent to{" "}
            <span className="text-foreground font-medium">{email}</span>{" "}
            and your new password
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="mb-5 bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Reset Code</label>
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
              {formErrors.otp && (
                <p className="mt-2 text-xs text-destructive text-center">{formErrors.otp}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="password"
                  placeholder={"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full bg-muted text-foreground placeholder-muted-foreground rounded-lg pl-10 pr-4 py-2.5 text-sm border outline-none transition focus:ring-2 focus:ring-ring ${
                    formErrors.newPassword ? "border-destructive/60" : "border-border focus:border-ring"
                  }`}
                />
              </div>
              {formErrors.newPassword && (
                <p className="mt-1.5 text-xs text-destructive">{formErrors.newPassword}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="password"
                  placeholder={"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full bg-muted text-foreground placeholder-muted-foreground rounded-lg pl-10 pr-4 py-2.5 text-sm border outline-none transition focus:ring-2 focus:ring-ring ${
                    formErrors.confirmPassword ? "border-destructive/60" : "border-border focus:border-ring"
                  }`}
                />
              </div>
              {formErrors.confirmPassword && (
                <p className="mt-1.5 text-xs text-destructive">{formErrors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-semibold rounded-lg py-2.5 text-sm transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
