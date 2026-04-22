import { useEffect, useState } from "react";
import { useStrapiLayout } from "@/contexts/StrapiLayoutContext";
import { api, IS_STRAPI_CONFIGURED, type PublicComment } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PostType = "article" | "news-post";

type Props = {
  postType: PostType;
  slug: string;
  /** From post document; when false, hide comments regardless of site toggle. */
  commentsOpen: boolean;
};

export function PostCommentsSection({ postType, slug, commentsOpen }: Props) {
  const { siteConfig } = useStrapiLayout();
  const [list, setList] = useState<PublicComment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const enabled = commentsOpen && siteConfig.commentsEnabled === true;

  useEffect(() => {
    if (!IS_STRAPI_CONFIGURED || !enabled) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    (async () => {
      const rows = await api.comments.getApproved(postType, slug);
      if (!cancelled) {
        setList(rows);
        setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postType, slug, enabled]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!IS_STRAPI_CONFIGURED) {
      setMessage("Comments require Strapi.");
      return;
    }
    if (!enabled) return;
    setSubmitting(true);
    const res = await api.comments.submit({
      postType,
      targetSlug: slug,
      authorName: authorName.trim(),
      authorEmail: authorEmail.trim() || undefined,
      body: body.trim(),
    });
    setSubmitting(false);
    if (res.ok) {
      setBody("");
      setAuthorName("");
      setAuthorEmail("");
      setMessage("Thanks — your comment was received and will appear after review.");
    } else {
      setMessage(res.error || "Could not submit.");
    }
  }

  if (!enabled) {
    return null;
  }

  return (
    <section className="mt-[48px] border-t border-border pt-[32px]" aria-label="Comments">
      <h2 className="font-heading text-xl font-bold text-foreground">Comments</h2>
      <p className="mt-[8px] font-body text-sm text-muted-foreground">
        Approved comments appear below. New submissions are reviewed before publishing.
      </p>

      {loaded && list.length > 0 ? (
        <ul className="mt-[24px] space-y-[16px]">
          {list.map((c) => (
            <li key={c.documentId || c.authorName + c.body.slice(0, 20)} className="rounded-lg border border-border bg-card p-[16px]">
              <p className="font-heading text-sm font-semibold text-foreground">{c.authorName}</p>
              {c.createdAt ? (
                <p className="mt-[4px] font-body text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</p>
              ) : null}
              <p className="mt-[8px] font-body text-sm text-foreground whitespace-pre-wrap">{c.body}</p>
            </li>
          ))}
        </ul>
      ) : null}

      <form onSubmit={onSubmit} className="mt-[24px] max-w-xl space-y-[16px]">
        <div>
          <Label htmlFor="c-name">Name</Label>
          <Input id="c-name" value={authorName} onChange={(e) => setAuthorName(e.target.value)} required className="mt-[4px]" />
        </div>
        <div>
          <Label htmlFor="c-email">Email (optional)</Label>
          <Input
            id="c-email"
            type="email"
            value={authorEmail}
            onChange={(e) => setAuthorEmail(e.target.value)}
            className="mt-[4px]"
          />
        </div>
        <div>
          <Label htmlFor="c-body">Comment</Label>
          <textarea
            id="c-body"
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="mt-[4px] flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 font-body text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        {message ? <p className="font-body text-sm text-muted-foreground">{message}</p> : null}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit comment"}
        </Button>
      </form>
    </section>
  );
}
