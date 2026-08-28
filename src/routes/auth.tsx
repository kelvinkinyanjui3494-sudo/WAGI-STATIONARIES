import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";

import {
  useEffect,
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
};

type RegisterResponse = {
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: string;
  };
  email_verified: boolean;
};

type LoginResponse = {
  user: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    email_verified_at?: string | null;
  };
  token: string;
};

export const Route =
  createFileRoute("/auth")({
    validateSearch:
      (
        search: Record<string, unknown>,
      ): Search => {
  const result: Search = {};

  if (search["mode"] === "register") {
    result.mode = "register";
  }

  if (typeof search["verified"] === "string") {
    result.verified = search["verified"];
  }

  return result;
},
    head: () => ({
      meta: [
        {
          title:
            "Sign In or Create Account | WAGI - STATIONARIES",
        },
        {
          name: "description",
          content:
            "Access your WAGI account to track orders and check out faster.",
        },
        {
          property: "og:title",
          content:
            "Sign In | WAGI - STATIONARIES",
        },
        {
          property: "og:description",
          content:
            "Sign in to shop with WAGI - STATIONARIES.",
        },
        {
          property: "og:type",
          content: "website",
        },
        {
          name: "twitter:card",
          content:
            "summary_large_image",
        },
      ],
    }),

    component: AuthPage,
  });

function AuthPage() {
  const {
    mode,
    verified,
  } = Route.useSearch();

  const navigate =
    useNavigate();

  const { user } =
    useAuth();

  const [
    isRegister,
    setIsRegister,
  ] = useState(
    mode === "register",
  );

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    passwordConfirmation,
    setPasswordConfirmation,
  ] = useState("");

  const [fullName, setFullName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  const [sent, setSent] =
    useState(false);

  useEffect(() => {
    if (verified === "1") {
      toast.success(
        "Email verified successfully. You can now sign in.",
      );
    }
  }, [verified]);

  useEffect(() => {
    if (user) {
      void navigate({
        to: "/",
        replace: true,
      });
    }
  }, [user, navigate]);

  const submit = async (
    e: React.FormEvent,
  ): Promise<void> => {
    e.preventDefault();

    if (
      isRegister &&
      password !==
        passwordConfirmation
    ) {
      toast.error(
        "Passwords do not match.",
      );
      return;
    }

    setBusy(true);

    try {
      if (isRegister) {
        const response =
          await apiFetch<RegisterResponse>(
            "/register",
            {
              method: "POST",

              body: JSON.stringify({
                name:
                  fullName.trim(),

                phone:
                  phone.trim(),

                email:
                  email.trim(),

                password,

                password_confirmation:
                  passwordConfirmation,
              }),
            },
          );

        setSent(true);

        toast.success(
          response.message ||
            "Account created successfully.",
        );
      } else {
        const response =
          await apiFetch<LoginResponse>(
            "/login",
            {
              method: "POST",

              body: JSON.stringify({
                email:
                  email.trim(),

                password,

                device_name:
                  "WAGI Customer Web",
              }),
            },
          );

        setAuthToken(
          response.token,
        );

        toast.success(
          "Signed in successfully.",
        );

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

  const resendVerification =
    async () => {
      if (!email.trim()) {
        toast.error(
          "Enter your email address.",
        );
        return;
      }

      setBusy(true);

      try {
        const response =
          await apiFetch<{
            message: string;
          }>("/email/resend", {
            method: "POST",

            body: JSON.stringify({
              email:
                email.trim(),
            }),
          });

        toast.success(
          response.message,
        );
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

  const switchMode = () => {
    setIsRegister(
      (value) => !value,
    );

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

        {sent ? (
          <div className="mt-6 text-center">

            <h1 className="text-lg font-bold">
              Check your email
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              We sent a verification link to{" "}
              <strong>
                {email}
              </strong>.
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Click the link in the email to activate your WAGI customer account.
            </p>

            <Button
              type="button"
              variant="outline"
              className="mt-5 w-full rounded-full"
              disabled={busy}
              onClick={
                resendVerification
              }
            >
              Resend verification email
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
                        setFullName(
                          e.target.value,
                        )
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
                        setPhone(
                          e.target.value,
                        )
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
                    setEmail(
                      e.target.value,
                    )
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
                    setPassword(
                      e.target.value,
                    )
                  }
                />
              </div>

              {isRegister && (
                <div className="space-y-1.5">
                  <Label htmlFor="passwordConfirmation">
                    Confirm Password
                  </Label>

                  <Input
                    id="passwordConfirmation"
                    type="password"
                    value={
                      passwordConfirmation
                    }
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
                onClick={
                  switchMode
                }
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
