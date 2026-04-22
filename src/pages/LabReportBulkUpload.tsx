"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Plus, Trash2, Loader2, ShieldAlert, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Layout from "@/components/layout/Layout";
import { cn } from "@/lib/utils";
import { api, IS_STRAPI_CONFIGURED } from "@/lib/api";
import { useStaffAuth } from "@/contexts/StaffAuthContext";

type Row = { key: string; file: File | null; passport: string; phone: string };

function newRow(): Row {
  return { key: `${Date.now()}-${Math.random().toString(36).slice(2)}`, file: null, passport: "", phone: "" };
}

const LabReportBulkUpload = () => {
  const navigate = useNavigate();
  const { ready, token, isLabStaff, user, logout } = useStaffAuth();
  const [rows, setRows] = useState<Row[]>(() => [newRow(), newRow(), newRow()]);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [doneOk, setDoneOk] = useState(0);
  const [doneFail, setDoneFail] = useState(0);

  useEffect(() => {
    if (!ready) return;
    if (!token || !isLabStaff) {
      navigate(`/staff/login?redirect=${encodeURIComponent("/staff/lab-reports")}`, { replace: true });
    }
  }, [ready, token, isLabStaff, navigate]);

  const canSubmit = useMemo(() => {
    if (!token || !isLabStaff) return false;
    return rows.some((r) => r.file && r.passport.trim().length >= 4 && r.phone.replace(/\D/g, "").length >= 10);
  }, [rows, token, isLabStaff]);

  const pushLog = (line: string) => setLog((p) => [...p.slice(-80), line]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!IS_STRAPI_CONFIGURED) {
      pushLog("Strapi URL is not configured (VITE_STRAPI_URL).");
      return;
    }
    if (!token) {
      pushLog("Not signed in.");
      return;
    }

    const work = rows.filter(
      (r) => r.file && r.passport.trim().length >= 4 && r.phone.replace(/\D/g, "").length >= 10,
    );
    if (work.length === 0) {
      pushLog("Add at least one row with a PDF, passport (4+ chars), and phone (10+ digits).");
      return;
    }

    setBusy(true);
    setDoneOk(0);
    setDoneFail(0);
    pushLog(`Uploading ${work.length} file(s)…`);

    let ok = 0;
    let fail = 0;
    for (let i = 0; i < work.length; i++) {
      const r = work[i];
      const name = r.file!.name;
      const res = await api.labReportFiles.uploadOne(token, {
        file: r.file!,
        passportNumber: r.passport.trim(),
        phoneNumber: r.phone.trim(),
      });
      if (res.ok) {
        ok++;
        pushLog(`✓ ${i + 1}/${work.length} ${name}`);
      } else {
        fail++;
        pushLog(`✗ ${i + 1}/${work.length} ${name}: ${res.error ?? "failed"}`);
      }
    }
    setDoneOk(ok);
    setDoneFail(fail);
    setBusy(false);
    pushLog(`Finished: ${ok} ok, ${fail} failed.`);
  };

  if (!ready || !token || !isLabStaff) {
    return (
      <Layout>
        <section className="py-24 text-center font-body text-sm text-muted-foreground">Checking access…</section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-12 md:py-16">
        <div className="container max-w-3xl">
          <div className="mb-8 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="font-body text-sm text-foreground">
              <p className="font-heading font-semibold text-foreground">Lab report PDF upload</p>
              <p className="mt-1 text-muted-foreground">
                Signed in as <strong className="text-foreground">{user?.email || user?.username}</strong>. PDFs are
                stored under <code className="rounded bg-muted px-1">private/lab-reports</code> on the server and matched
                to passport + phone on the public <strong>Report Check</strong> page.
              </p>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">Bulk upload lab reports</h1>
              <p className="font-body text-sm text-muted-foreground mt-1">
                One PDF per patient row. Same passport + phone replaces the previous file.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => logout()}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-heading text-sm font-semibold">Rows</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => setRows((r) => [...r, newRow()])}
                >
                  <Plus className="h-4 w-4" />
                  Add row
                </Button>
              </div>

              {rows.map((row, idx) => (
                <div
                  key={row.key}
                  className="grid gap-3 rounded-md border border-border/80 bg-muted/20 p-4 sm:grid-cols-[1fr_1fr_1fr_auto]"
                >
                  <div className="sm:col-span-1">
                    <Label className="text-xs text-muted-foreground">PDF file</Label>
                    <Input
                      type="file"
                      accept="application/pdf,.pdf"
                      className="mt-1 h-10 cursor-pointer text-sm"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setRows((prev) => prev.map((x) => (x.key === row.key ? { ...x, file: f } : x)));
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Passport / patient ID</Label>
                    <Input
                      value={row.passport}
                      onChange={(e) =>
                        setRows((prev) => prev.map((x) => (x.key === row.key ? { ...x, passport: e.target.value } : x)))
                      }
                      placeholder="e.g. BGD-AO-02001"
                      className="mt-1 h-10 text-sm"
                      maxLength={64}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Phone (registered)</Label>
                    <Input
                      value={row.phone}
                      onChange={(e) =>
                        setRows((prev) => prev.map((x) => (x.key === row.key ? { ...x, phone: e.target.value } : x)))
                      }
                      placeholder="01XXXXXXXXX"
                      className="mt-1 h-10 text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      disabled={rows.length <= 1}
                      onClick={() => setRows((prev) => prev.filter((x) => x.key !== row.key))}
                      aria-label={`Remove row ${idx + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button type="submit" disabled={busy || !canSubmit} className="w-full gap-2 sm:w-auto">
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload all filled rows
                </>
              )}
            </Button>

            {(doneOk > 0 || doneFail > 0) && (
              <p className={cn("font-body text-sm", doneFail ? "text-destructive" : "text-accent")}>
                Last run: {doneOk} succeeded, {doneFail} failed.
              </p>
            )}

            {log.length > 0 && (
              <div className="rounded-md border border-border bg-background p-3">
                <p className="mb-2 font-heading text-xs font-semibold text-muted-foreground">Log</p>
                <pre className="max-h-48 overflow-auto font-mono text-[11px] leading-relaxed text-muted-foreground">
                  {log.join("\n")}
                </pre>
              </div>
            )}
          </form>
        </div>
      </section>
    </Layout>
  );
};

export default LabReportBulkUpload;
