import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { toast } from "sonner";

import {
  apiFetch,
  setAuthToken,
} from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";

type Search = {
  mode?: "login" | "register";
  verified?: string;
  verification_code?: string;
};

type AuthUserResponse = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  email_verified_at?: string | null;
};

type RegisterResponse = {
  message: string;
  user: AuthUserResponse;
  email_verified: boolean;
};

type LoginResponse = {
  user: AuthUserResponse;
  token: string;
};

type VerificationResponse = {
  message?: string;
  user: AuthUserResponse;
  token: string;
};

export const Route = createFileRoute("/auth")({
  validateSearch: (
    search: Record<string, unknown>,
  ): Search => {
    const result: Search = {};

    if (search["mode"] === "register") {
      result.mode = "register";
    }

    if (typeof search["verified"] === "string") {
      result.verified = search["verified"];
    }

    if (
      typeof search["verification_code"] === "string"
    ) {
      result.verification_code =
        search["verification_code"];
    }

    return result;
  },

  head: () => ({
    meta: [
      {
        title: "Sign In or Create Account | WAGI - STATIONARIES",
      },
      {
        name: "description",
        content:
          "Access your WAGI account to track orders and check out faster.",
      },
      {
        property: "og:title",
        content: "Sign In | WAGI - STATIONARIES",
      },
      {
        property: "og:description",
        content: "Sign in to shop with WAGI - STATIONARIES.",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
    ],
  }),

  component: AuthPage,
});

function AuthPage() {
  const {
    mode,
    verified,
    verification_code: verificationCode,
  } = Route.useSearch();

  const navigate = useNavigate();

  const {
    user,
    refreshProfile,
  } = useAuth();

  const verificationStarted = useRef(false);

  const [isRegister, setIsRegister] = useState(
    mode === "register",
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] =
    useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const [forgotPassword, setForgotPassword] =
    useState(false);

  const [resetStep, setResetStep] =
    useState<1 | 2 | 3>(1);

  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [
    newPasswordConfirmation,
    setNewPasswordConfirmation,
  ] = useState("");

  // Exchange the one-time email verification code for a
  // Sanctum token, then load the authenticated profile.
  useEffect(() => {
    if (!verificationCode || verificationStarted.current) {
      return;
    }

    verificationStarted.current = true;

    const completeVerification = async () => {
      setBusy(true);

      try {
        const response =
          await apiFetch<VerificationResponse>(
            "/auth/complete-email-verification",
            {
              method: "POST",
              body: JSON.stringify({
                code: verificationCode,
              }),
            },
          );

        if (!response.token || !response.user) {
          throw new Error(
            "Verification succeeded, but the sign-in response was incomplete. Please sign in manually.",
          );
        }

        // Store the token before requesting the profile.
        setAuthToken(response.token);

        await refreshProfile();

        toast.success(
          "Your email is verified. You are now signed in!",
        );

        await navigate({
          to: "/",
          replace: true,
        });
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to complete email verification. Please sign in or request a new verification email.",
        );
      } finally {
        setBusy(false);
      }
    };

    void completeVerification();
  }, [verificationCode, refreshProfile, navigate]);

  // Retain compatibility with older verification links.
  useEffect(() => {
    if (verified === "1" && !verificationCode) {
      toast.success(
        "Email verified successfully. You can now sign in.",
      );
    }
  }, [verified, verificationCode]);

  // Don't interrupt an email verification handoff.
  useEffect(() => {
    if (user && !verificationCode) {
      void navigate({
        to: "/",
        replace: true,
      });
    }
  }, [user, verificationCode, navigate]);

  const submit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();

    if (busy) {
      return;
    }

    if (
      isRegister &&
      password !== passwordConfirmation
    ) {
      toast.error("Passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      if (isRegister) {
        await apiFetch<RegisterResponse>(
          "/auth/register",
          {
            method: "POST",
            body: JSON.stringify({
              name: fullName.trim(),
              phone: phone.trim(),
              email: email.trim(),
              password,
              password_confirmation:
                passwordConfirmation,
            }),
          },
        );

        setSent(true);

        toast.success(
          "Account created. Check your email for the verification link.",
        );
      } else {
        const response =
          await apiFetch<LoginResponse>(
            "/auth/login",
            {
              method: "POST",
              body: JSON.stringify({
                email: email.trim(),
                password,
                device_name: "WAGI Customer Web",
              }),
            },
          );

        setAuthToken(response.token);

        await refreshProfile();

        toast.success("Signed in successfully.");

        await navigate({
          to: "/",
          replace: true,
        });
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong.",
      );
    } finally {
      setBusy(false);
    }
  };

  const resendVerification = async () => {
    if (busy) {
      return;
    }

    if (!email.trim()) {
      toast.error("Enter your email address.");
      return;
    }

    setBusy(true);

    try {
      const response = await apiFetch<{
        message: string;
      }>("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      toast.success(response.message);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to resend verification email.",
      );
    } finally {
      setBusy(false);
    }
  };

  const sendResetCode = async () => {
    if (busy) {
      return;
    }

    if (!resetEmail.trim()) {
      toast.error("Enter your email address.");
      return;
    }

    setBusy(true);

    try {
      const response = await apiFetch<{
        message: string;
      }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({
          email: resetEmail.trim(),
        }),
      });

      setResetStep(2);
      toast.success(response.message);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to send verification code.",
      );
    } finally {
      setBusy(false);
    }
  };

  const verifyResetCode = async () => {
    if (busy) {
      return;
    }

    if (!resetCode.trim()) {
      toast.error(
        "Enter the 6-digit verification code.",
      );
      return;
    }

    setBusy(true);

    try {
      const response = await apiFetch<{
        message: string;
      }>("/auth/verify-reset-code", {
        method: "POST",
        body: JSON.stringify({
          email: resetEmail.trim(),
          code: resetCode.trim(),
        }),
      });

      setResetStep(3);
      toast.success(response.message);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Invalid or expired verification code.",
      );
    } finally {
      setBusy(false);
    }
  };

  const resetCustomerPassword = async () => {
    if (busy) {
      return;
    }

    if (newPassword.length < 8) {
      toast.error(
        "Password must be at least 8 characters.",
      );
      return;
    }

    if (newPassword !== newPasswordConfirmation) {
      toast.error("Passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      const response = await apiFetch<{
        message: string;
      }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          email: resetEmail.trim(),
          code: resetCode.trim(),
          password: newPassword,
          password_confirmation:
            newPasswordConfirmation,
        }),
      });

      toast.success(response.message);

      setForgotPassword(false);
      setResetStep(1);
      setResetEmail("");
      setResetCode("");
      setNewPassword("");
      setNewPasswordConfirmation("");
      setPassword("");
      setPasswordConfirmation("");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to reset your password.",
      );
    } finally {
      setBusy(false);
    }
  };

  const openForgotPassword = () => {
    setForgotPassword(true);
    setResetStep(1);
    setResetEmail(email);
    setResetCode("");
    setNewPassword("");
    setNewPasswordConfirmation("");
    setPassword("");
    setPasswordConfirmation("");
  };

  const backToSignIn = () => {
    setForgotPassword(false);
    setResetStep(1);
    setResetEmail("");
    setResetCode("");
    setNewPassword("");
    setNewPasswordConfirmation("");
    setPassword("");
    setPasswordConfirmation("");
    setIsRegister(false);
  };

  const switchMode = () => {
    setIsRegister((value) => !value);
    setSent(false);
    setPassword("");
    setPasswordConfirmation("");
  };

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-3xl border bg-card p-7 shadow-elevated">
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>

        {verificationCode ? (
          <div className="mt-6 text-center">
            <h1 className="text-xl font-bold">
              Activating your account
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {busy
                ? "Please wait while we verify your email and sign you in."
                : "If verification could not be completed, sign in below or request a new verification email."}
            </p>

            {!busy && (
              <Button
                type="button"
                className="mt-5 w-full rounded-full"
                onClick={() =>
                  void navigate({
                    to: "/auth",
                    search: { mode: "login" },
                    replace: true,
                  })
                }
              >
                Go to sign in
              </Button>
            )}
          </div>
        ) : forgotPassword ? (
          <>
            {resetStep === 1 && (
              <div className="mt-6">
                <h1 className="text-center text-xl font-bold">
                  Forgot your password?
                </h1>

                <p className="mt-2 text-center text-sm text-muted-foreground">
                  Enter your email address and we will send you a verification code.
                </p>

                <div className="mt-5 space-y-1.5">
                  <Label htmlFor="resetEmail">
                    Email
                  </Label>

                  <Input
                    id="resetEmail"
                    type="email"
                    value={resetEmail}
                    maxLength={255}
                    required
                    onChange={(e) =>
                      setResetEmail(e.target.value)
                    }
                  />
                </div>

                <Button
                  type="button"
                  className="mt-5 w-full rounded-full"
                  disabled={busy}
                  onClick={sendResetCode}
                >
                  {busy
                    ? "Please wait..."
                    : "Send verification code"}
                </Button>

                <button
                  type="button"
                  className="mt-4 block w-full text-center text-sm text-primary hover:underline"
                  onClick={backToSignIn}
                >
                  Back to sign in
                </button>
              </div>
            )}

            {resetStep === 2 && (
              <div className="mt-6">
                <h1 className="text-center text-xl font-bold">
                  Check your email
                </h1>

                <p className="mt-2 text-center text-sm text-muted-foreground">
                  We sent a 6-digit verification code to{" "}
                  <strong>{resetEmail}</strong>.
                </p>

                <div className="mt-5 space-y-1.5">
                  <Label htmlFor="resetCode">
                    Verification code
                  </Label>

                  <Input
                    id="resetCode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={resetCode}
                    placeholder="000000"
                    required
                    onChange={(e) =>
                      setResetCode(
                        e.target.value.replace(/\D/g, ""),
                      )
                    }
                  />
                </div>

                <Button
                  type="button"
                  className="mt-5 w-full rounded-full"
                  disabled={busy}
                  onClick={verifyResetCode}
                >
                  {busy
                    ? "Please wait..."
                    : "Verify code"}
                </Button>

                <button
                  type="button"
                  className="mt-4 block w-full text-center text-sm text-primary hover:underline"
                  onClick={() => setResetStep(1)}
                >
                  Use a different email
                </button>
              </div>
            )}

            {resetStep === 3 && (
              <div className="mt-6">
                <h1 className="text-center text-xl font-bold">
                  Create a new password
                </h1>

                <p className="mt-2 text-center text-sm text-muted-foreground">
                  Enter your new password below.
                </p>

                <div className="mt-5 space-y-1.5">
                  <Label htmlFor="newPassword">
                    New Password
                  </Label>

                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    minLength={8}
                    required
                    onChange={(e) =>
                      setNewPassword(e.target.value)
                    }
                  />
                </div>

                <div className="mt-3 space-y-1.5">
                  <Label htmlFor="newPasswordConfirmation">
                    Confirm New Password
                  </Label>

                  <Input
                    id="newPasswordConfirmation"
                    type="password"
                    value={newPasswordConfirmation}
                    minLength={8}
                    required
                    onChange={(e) =>
                      setNewPasswordConfirmation(
                        e.target.value,
                      )
                    }
                  />
                </div>

                <Button
                  type="button"
                  className="mt-5 w-full rounded-full"
                  disabled={busy}
                  onClick={resetCustomerPassword}
                >
                  {busy
                    ? "Please wait..."
                    : "Reset password"}
                </Button>
              </div>
            )}
          </>
        ) : sent ? (
          <div className="mt-6 text-center">
            <h1 className="text-lg font-bold">
              Check your email
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              We sent a verification link to{" "}
              <strong>{email}</strong>.
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Click the link in the email to activate your WAGI customer account.
            </p>

            <Button
              type="button"
              variant="outline"
              className="mt-5 w-full rounded-full"
              disabled={busy}
              onClick={resendVerification}
            >
              {busy
                ? "Please wait..."
                : "Resend verification email"}
            </Button>

            <button
              type="button"
              className="mt-4 text-sm text-primary hover:underline"
              onClick={() => {
                setSent(false);
                setIsRegister(false);
              }}
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <>
            <h1 className="mt-6 text-center text-xl font-bold">
              {isRegister
                ? "Create your account"
                : "Welcome back"}
            </h1>

            <form
              onSubmit={submit}
              className="mt-5 space-y-3"
            >
              {isRegister && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName">
                      Full name
                    </Label>

                    <Input
                      id="fullName"
                      value={fullName}
                      maxLength={255}
                      required
                      onChange={(e) =>
                        setFullName(e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone">
                      Phone
                    </Label>

                    <Input
                      id="phone"
                      value={phone}
                      maxLength={30}
                      placeholder="07XX XXX XXX"
                      required
                      onChange={(e) =>
                        setPhone(e.target.value)
                      }
                    />
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">
                  Email
                </Label>

                <Input
                  id="email"
                  type="email"
                  value={email}
                  maxLength={255}
                  required
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">
                  Password
                </Label>

                <Input
                  id="password"
                  type="password"
                  value={password}
                  minLength={8}
                  required
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                />
              </div>

              {!isRegister && (
                <div className="text-right">
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                    onClick={openForgotPassword}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {isRegister && (
                <div className="space-y-1.5">
                  <Label htmlFor="passwordConfirmation">
                    Confirm Password
                  </Label>

                  <Input
                    id="passwordConfirmation"
                    type="password"
                    value={passwordConfirmation}
                    minLength={8}
                    required
                    onChange={(e) =>
                      setPasswordConfirmation(
                        e.target.value,
                      )
                    }
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full rounded-full"
                disabled={busy}
              >
                {busy
                  ? "Please wait..."
                  : isRegister
                    ? "Create account"
                    : "Sign in"}
              </Button>
            </form>

            <div className="mt-4 flex justify-between text-sm">
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={switchMode}
              >
                {isRegister
                  ? "I already have an account"
                  : "Create an account"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
