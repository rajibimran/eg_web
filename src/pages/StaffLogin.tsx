"use client";

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Layout from "@/components/layout/Layout";
import { cn } from "@/lib/utils";
import { IS_STRAPI_CONFIGURED } from "@/lib/api";
import { useStaffAuth } from "@/contexts/StaffAuthContext";

const StaffLogin = () => {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect")?.trim() || "/staff/lab-reports";
  const navigate = useNavigate();
  const { login, ready, isLabStaff } = useStaffAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const safeRedirect = redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/staff/lab-reports";

  useEffect(() => {
    if (ready && isLabStaff) {
      navigate(safeRedirect, { replace: true });
    }
  }, [ready, isLabStaff, safeRedirect, navigate]);

  if (!ready) {
    return (
      <Layout>
        <section className="py-24 text-center font-body text-sm text-muted-foreground">Loading…</section>
      </Layout>
    );
  }

  if (ready && isLabStaff) {
    return (
      <Layout>
        <section className="py-24 text-center font-body text-sm text-muted-foreground">Redirecting…</section>
      </Layout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!IS_STRAPI_CONFIGURED) {
      setError("Strapi URL is not configured (VITE_STRAPI_URL).");
      return;
    }
    if (!identifier.trim() || !password) {
      setError("Enter your email or username and password.");
      return;
    }
    setSubmitting(true);
    try {
      const r = await login(identifier, password);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      navigate(safeRedirect, { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <section className="py-16 md:py-24">
        <div className="container max-w-md">
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Staff sign in</h1>
          <p className="font-body text-sm text-muted-foreground mb-8">
            Sign in with a <strong className="text-foreground">Users &amp; Permissions</strong> account (the same kind
            of user you create under the Users plugin in Strapi), <em>not</em> an{" "}
            <strong className="text-foreground">Administration panel</strong> administrator. Assign the{" "}
            <strong className="text-foreground">Lab staff</strong> role. Use the <strong className="text-foreground">email</strong>{" "}
            or <strong className="text-foreground">username</strong> saved for that user, plus its password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
            <div>
              <Label htmlFor="staff-id">Email or username</Label>
              <Input
                id="staff-id"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className={cn("mt-1 h-11", error && "border-destructive")}
                disabled={submitting}
              />
            </div>
            <div>
              <Label htmlFor="staff-pw">Password</Label>
              <Input
                id="staff-pw"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn("mt-1 h-11", error && "border-destructive")}
                disabled={submitting}
              />
            </div>
            {error && <p className="font-body text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full gap-2 h-11" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign in
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center font-body text-xs text-muted-foreground">
            <Link to="/" className="text-primary hover:underline">
              Back to site
            </Link>
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default StaffLogin;
