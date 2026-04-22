import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

type RichTextProps = {
  value?: string;
  className?: string;
};

export function RichText({ value, className = "" }: RichTextProps) {
  const content = (value ?? "").trim();
  if (!content) return null;

  return (
    <div className={`max-w-none text-foreground ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: ({ children }) => <h1 className="mt-6 text-3xl font-extrabold leading-tight text-foreground first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="mt-6 text-2xl font-bold leading-snug text-foreground first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="mt-5 text-xl font-bold leading-snug text-foreground first:mt-0">{children}</h3>,
          h4: ({ children }) => <h4 className="mt-4 text-lg font-semibold leading-snug text-foreground first:mt-0">{children}</h4>,
          p: ({ children }) => <p className="mt-4 text-base leading-relaxed text-muted-foreground first:mt-0">{children}</p>,
          ul: ({ children }) => <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">{children}</ul>,
          ol: ({ children }) => <ol className="mt-4 list-decimal space-y-2 pl-6 text-muted-foreground">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="mt-4 border-l-4 border-border pl-4 italic text-muted-foreground">{children}</blockquote>
          ),
          a: ({ href, children }) => (
            <a href={href} className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80">
              {children}
            </a>
          ),
          strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ children }) => <code className="rounded bg-muted px-1 py-0.5 font-mono text-sm text-foreground">{children}</code>,
          pre: ({ children }) => <pre className="mt-4 overflow-x-auto rounded-lg bg-muted p-4 text-sm">{children}</pre>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
