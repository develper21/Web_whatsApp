import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Loader2, MessageSquare, Phone, User, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import AuthImagePattern from "../components/AuthImagePattern";
import toast from "react-hot-toast";

const SignUpPage = () => {
  const [step, setStep] = useState("phone"); // "phone" | "otp"
  const [formData, setFormData] = useState({
    phoneNumber: "",
    otp: "",
    fullName: "",
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
      fullName: formData.fullName.trim(),
    });
  };

  const handleBack = () => {
    setStep("phone");
    setFormData({ ...formData, otp: "" });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* left side */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* LOGO */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div
                className="size-12 rounded-xl bg-primary/10 flex items-center justify-center 
              group-hover:bg-primary/20 transition-colors"
              >
                <MessageSquare className="size-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mt-2">
                {step === "phone" ? "Create Account" : "Verify OTP"}
              </h1>
              <p className="text-base-content/60">
                {step === "phone"
                  ? "Get started with your free account"
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
                    <Phone className="size-5 text-base-content/40" />
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
                    <Loader2 className="size-5 animate-spin" />
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

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Full Name (optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="size-5 text-base-content/40" />
                  </div>
                  <input
                    type="text"
                    className="input input-bordered w-full pl-10"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={isVerifyingOtp}>
                {isVerifyingOtp ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>
          )}

          <div className="text-center">
            <p className="text-base-content/60">
              Already have an account?{" "}
              <Link to="/login" className="link link-primary">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* right side */}

      <AuthImagePattern
        title={step === "phone" ? "Join our community" : "Almost there!"}
        subtitle={
          step === "phone"
            ? "Connect with friends, share moments, and stay in touch with your loved ones."
            : "Just one more step to start chatting with your friends."
        }
      />
    </div>
  );
};
export default SignUpPage;
