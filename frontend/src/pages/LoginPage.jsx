import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Loader2, MessageSquare, Phone, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import AuthImagePattern from "../components/AuthImagePattern";
import toast from "react-hot-toast";

const LoginPage = () => {
  const [step, setStep] = useState("phone");
  const [formData, setFormData] = useState({
    phoneNumber: "",
    otp: "",
  });
  const { requestOtp, verifyOtp, isRequestingOtp, isVerifyingOtp } = useAuthStore();

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (!formData.phoneNumber.trim()) {
      toast.error("Phone number is required");
      return;
    }
    const success = await requestOtp(formData.phoneNumber);
    if (success) setStep("otp");
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!formData.otp.trim()) {
      toast.error("OTP is required");
      return;
    }
    await verifyOtp({
      phoneNumber: formData.phoneNumber,
      otp: formData.otp,
    });
  };

  const handleBack = () => {
    setStep("phone");
    setFormData({ ...formData, otp: "" });
  };

  return (
    <div className="h-screen grid lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div
                className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20
              transition-colors"
              >
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mt-2">
                {step === "phone" ? "Welcome Back" : "Verify OTP"}
              </h1>
              <p className="text-base-content/60">
                {step === "phone"
                  ? "Sign in with your phone number"
                  : "Enter the code sent to your phone"}
              </p>
            </div>
          </div>

          {step === "phone" ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Phone Number</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-base-content/40" />
                  </div>
                  <input
                    type="tel"
                    className="input input-bordered w-full pl-10"
                    placeholder="+1234567890"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={isRequestingOtp}>
                {isRequestingOtp ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send OTP"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <button type="button" onClick={handleBack} className="btn btn-ghost btn-sm gap-2 mb-4">
                <ArrowLeft className="size-4" />
                Back
              </button>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">OTP Code</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="123456"
                  value={formData.otp}
                  onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                  maxLength={6}
                />
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={isVerifyingOtp}>
                {isVerifyingOtp ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          )}

          <div className="text-center">
            <p className="text-base-content/60">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="link link-primary">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Image/Pattern */}
      <AuthImagePattern
        title={step === "phone" ? "Welcome back!" : "Almost there!"}
        subtitle={
          step === "phone"
            ? "Sign in to continue your conversations and catch up with your messages."
            : "Just one more step to start chatting."
        }
      />
    </div>
  );
};
export default LoginPage;
