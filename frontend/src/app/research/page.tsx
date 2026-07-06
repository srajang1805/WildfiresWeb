"use client";

import { useEffect, useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUp } from "lucide-react";

function preprocess(md: string): string {
  return md
    .replace(/^(\d+)\.(\d+)\.(\d+)\s+(.+)$/gm, "### $1.$2.$3 $4")
    .replace(/^(\d+)\.(\d+)\s+(.+)$/gm, "## $1.$2 $3")
    .replace(/^(I{1,3}|IV|V?I{0,3})\.\s+(.+)$/gm, "# $1. $2");
}

function headingClass(level: number): string {
  if (level === 1) return "text-[34px] font-extrabold tracking-[0.04em] text-slate-900 mt-[72px] mb-7 pb-4 border-b-2 border-slate-200 scroll-mt-28";
  if (level === 2) return "text-[24px] font-bold text-slate-800 mt-12 mb-5 scroll-mt-28";
  return "text-[20px] font-bold text-slate-800 mt-8 mb-4 scroll-mt-28";
}

export default function ResearchPage() {
  const [content, setContent] = useState("");
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);
  const [activeId, setActiveId] = useState("");
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    fetch("/research.md").then((r) => r.text()).then((t) => {
      const processed = preprocess(t);
      setContent(processed);
      const hs = processed.match(/^#{1,4}\s+.+$/gm) || [];
      setHeadings(hs.map((line) => {
        const lvl = (line.match(/^#+/) || [""])[0].length;
        const txt = line.replace(/^#+\s*/, "");
        const id = txt.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        return { id, text: txt, level: lvl };
      }));
    });
    const onScroll = () => {
      setShowScroll(window.scrollY > 600);
      const hs = document.querySelectorAll("h1, h2, h3");
      let cur = "";
      hs.forEach((el) => { if (el.getBoundingClientRect().top < 160) cur = el.id; });
      setActiveId(cur);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const tocHeadings = useMemo(() => headings.filter((h) => h.level <= 3), [headings]);

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto flex max-w-7xl gap-12 px-8">
        {/* Table of Contents Sidebar */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-24 pt-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-4">Contents</p>
            <nav className="space-y-0 border-l-2 border-slate-100 pl-3">
              {tocHeadings.map((h) => (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  onClick={(e) => { e.preventDefault(); document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                  className={`block py-1 text-[12px] leading-tight transition-colors ${
                    h.level === 2 ? "pl-4" : h.level === 3 ? "pl-8" : ""
                  } ${activeId === h.id ? "text-blue-700 font-semibold border-l-2 -ml-[5px] border-blue-600 pl-[10px]" : "text-slate-500 hover:text-slate-800"}`}
                >
                  {h.text}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Paper */}
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-[840px] font-serif py-16">
            <div className="mb-16 pb-12 border-b-2 border-slate-300">
              <h1 className="text-[44px] font-extrabold leading-[1.15] tracking-tight text-slate-900">
                Wildfire Occurrence Prediction
              </h1>
              <h1 className="text-[44px] font-extrabold leading-[1.15] tracking-tight text-slate-900">
                Using Machine Learning Across India
              </h1>
              <p className="mt-6 text-[17px] italic text-slate-500">
                Technical paper &middot; 2025 &middot; XGBoost ensemble &middot; 9.4M data points &middot; 2018–2025
              </p>
            </div>

            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children, ...props }) => {
                  const text = String(children);
                  const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                  return <h1 id={id} className={headingClass(1)} {...props}>{children}</h1>;
                },
                h2: ({ children, ...props }) => {
                  const text = String(children);
                  const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                  return <h2 id={id} className={headingClass(2)} {...props}>{children}</h2>;
                },
                h3: ({ children, ...props }) => {
                  const text = String(children);
                  const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                  return <h3 id={id} className={headingClass(3)} {...props}>{children}</h3>;
                },
                p: ({ children }) => <p className="text-[18px] leading-[1.95] text-slate-700 mb-6 mt-3">{children}</p>,
                li: ({ children }) => <li className="text-[18px] leading-[1.9] text-slate-700 mb-2.5">{children}</li>,
                strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>,
                ul: ({ children }) => <ul className="list-disc pl-10 space-y-1.5 my-5">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-10 space-y-1.5 my-5">{children}</ol>,
                table: ({ children }) => (
                  <div className="overflow-x-auto my-8">
                    <table className="w-full border-collapse text-[15px]">{children}</table>
                  </div>
                ),
                thead: ({ children }) => <thead className="border-b-2 border-slate-300">{children}</thead>,
                th: ({ children }) => <th className="bg-slate-50 px-5 py-3.5 text-left text-[14px] font-bold text-slate-600">{children}</th>,
                td: ({ children }) => <td className="px-5 py-3.5 border-t border-slate-100 text-[15px] text-slate-700">{children}</td>,
                tr: ({ children }) => <tr className="border-b border-slate-50">{children}</tr>,
                hr: () => <hr className="my-20 border-slate-300" />,
                blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-400 bg-blue-50/50 px-6 py-4 rounded-r-lg not-italic my-10">{children}</blockquote>,
                code: ({ children }) => <code className="bg-slate-100 px-2 py-0.5 rounded text-[15px] font-normal text-slate-700">{children}</code>,
                a: ({ children, href }) => <a href={href} className="text-blue-600 font-medium hover:underline">{children}</a>,
              }}
            >
              {content}
            </ReactMarkdown>

            <div className="mt-24 pt-12 border-t-2 border-slate-200 text-center text-[14px] text-slate-400">
              <p>Wildfire Intelligence Platform &middot; Research Division &middot; 2025</p>
            </div>
          </div>
        </main>
      </div>

      {showScroll && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors">
          <ArrowUp className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
