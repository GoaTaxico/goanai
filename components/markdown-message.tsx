import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";

const components: Components = {
  a({ href, children }) {
    if (!href || !/^https?:\/\//i.test(href)) {
      return <span>{children}</span>;
    }

    return (
      <a href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  },
};

export function MarkdownMessage({ text }: { text: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown components={components}>{text}</ReactMarkdown>
    </div>
  );
}
