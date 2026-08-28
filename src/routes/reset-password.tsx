import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Your Password | WAGI - STATIONARIES" },
      {
        name: "description",
        content: "Choose a new password for your WAGI account.",
      },
      {
        property: "og:title",
        content: "Reset Password | WAGI - STATIONARIES",
      },
      {
        property: "og:description",
        content: "Set a new password and get back to shopping.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (password !== passwordConfirmation) {
      toast.error("Passwords do not match");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const email = params.get("email");

    if (!token || !email) {
      toast.error("This password reset link is invalid or incomplete");
      return;
    }

    setBusy(true);

    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token,
          email,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      toast.success("Password updated");
      void navigate({ to: "/", replace: true });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to reset your password",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-3xl border bg-card p-7 shadow-elevated"
      >
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>

        <h1 className="mt-6 text-center text-xl font-bold">
          Set a new password
        </h1>

        <div className="mt-5 space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            minLength={8}
            required
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="mt-4 space-y-1.5">
          <Label htmlFor="password-confirmation">
            Confirm new password
          </Label>
          <Input
            id="password-confirmation"
            type="password"
            value={passwordConfirmation}
            minLength={8}
            required
            onChange={(e) => setPasswordConfirmation(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          className="mt-5 w-full rounded-full"
          disabled={busy}
        >
          {busy ? "Updating…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}
