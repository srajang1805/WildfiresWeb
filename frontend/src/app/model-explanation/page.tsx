"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, BarChart4, Activity, Layers, Settings, Database, Brain, FlaskConical, FileText, Search, Zap, ArrowUpRight, ChevronRight, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/constants";

const BENCHMARKS = [
  { model: "XGBoost", accuracy: 0.9014, precision: 0.8595, recall: 0.9607, f1: 0.9073, roc: 0.9611, selected: true },
  { model: "LightGBM", accuracy: 0.9001, precision: 0.8801, recall: 0.9274, f1: 0.9031, roc: 0.9585, selected: false },
  { model: "Random Forest", accuracy: 0.8908, precision: 0.9028, recall: 0.8769, f1: 0.8897, roc: 0.9584, selected: false },
  { model: "CatBoost", accuracy: 0.8976, precision: 0.8744, recall: 0.9296, f1: 0.9012, roc: 0.9560, selected: false },
  { model: "Logistic Regression", accuracy: 0.8258, precision: 0.8036, recall: 0.8645, f1: 0.8329, roc: 0.8968, selected: false },
] as const;

type B = typeof BENCHMARKS[number];
type MK = "accuracy" | "precision" | "recall" | "f1" | "roc";
function gm(b: B, k: MK) { return b[k]; }
function best(k: MK) { return Math.max(...BENCHMARKS.map((b) => b[k])); }
const METRIC_LABELS: { key: MK; label: string; fmt: (v: number) => string }[] = [
  { key: "accuracy", label: "Accuracy", fmt: (v) => (v * 100).toFixed(2) + "%" },
  { key: "precision", label: "Precision", fmt: (v) => (v * 100).toFixed(2) + "%" },
  { key: "recall", label: "Recall", fmt: (v) => (v * 100).toFixed(2) + "%" },
  { key: "f1", label: "F1 Score", fmt: (v) => (v * 100).toFixed(2) + "%" },
  { key: "roc", label: "ROC-AUC", fmt: (v) => (v * 100).toFixed(2) + "%" },
];

const TABS = ["Champion Model", "RAG Metrics", "Research Archive", "Feature Intelligence", "Pipeline", "Experiments", "Explainability"] as const;
const xgb = BENCHMARKS[0];

type ModelData = Record<string, unknown>;

export default function ModelMetrics() {
  const [data, setData] = useState<ModelData | null>(null);
  const [tab, setTab] = useState<string>("Champion Model");

  useEffect(() => { fetch(api("/api/v1/model-info")).then((r) => r.json()).then(setData); }, []);
  if (!data) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>;

  const metrics = data.metrics as Record<string, number> | null;
  const features = data.features as Array<Record<string, string>> | null;
  const pipeline = data.pipeline as Array<{ stage: string; desc: string }> | null;
  const riskTiers = data.risk_tiers as Array<{ name: string; range: string; color: string }> | null;
  const ragStats = data.rag_stats as Record<string, unknown> | null;
  const experiments = data.experiments as Array<Record<string, unknown>> | null;
  const featureImp = data.feature_importance as Array<Record<string, unknown>> | null;
  const research = data.research as Array<Record<string, unknown>> | null;
  const config = data.config as Record<string, number> | null;

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Model Metrics</h1>
          <p className="mt-1 text-[14px] text-slate-500">Model performance, experiment tracking, RAG evaluation, research archive and explainability.</p>
        </motion.div>

        {/* Tabs */}
        <div className="mb-8 flex flex-wrap gap-1 border-b border-slate-200 pb-0">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`relative px-4 py-2.5 text-[13px] font-medium transition-colors rounded-t-lg ${tab === t ? "text-blue-600 bg-blue-50/50" : "text-slate-500 hover:text-slate-700"}`}>
              {t}
              {tab === t && <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-blue-600" />}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

            {/* CHAMPION MODEL */}
            {tab === "Champion Model" && (
              <div className="space-y-8">
                {/* KPI cards */}
                <div className="grid gap-4 sm:grid-cols-5">
                  {METRIC_LABELS.map((m) => {
                    const v = gm(xgb, m.key);
                    return (
                      <div key={m.key} className="rounded-xl border border-slate-200 bg-white p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{m.label}</p>
                        <p className="mt-2 text-[28px] font-bold text-blue-700 tabular-nums">{m.fmt(v)}</p>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${v * 100}%` }} transition={{ delay: 0.3, duration: 0.6 }} className="h-full rounded-full bg-blue-600" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Leaderboard */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-100 px-5 py-3 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-blue-600" />
                    <h3 className="text-[14px] font-bold text-slate-800">Model Leaderboard</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          <th className="px-5 py-3 font-semibold text-slate-600">Model</th>
                          {METRIC_LABELS.map((m) => <th key={m.key} className="px-5 py-3 text-right font-semibold text-slate-600">{m.label}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {BENCHMARKS.map((b) => (
                          <tr key={b.model} className={`border-b border-slate-50 transition-colors hover:bg-slate-50 ${b.selected ? "bg-blue-50/40 border-l-[3px] border-l-blue-600" : ""}`}>
                            <td className="px-5 py-3.5"><div className="flex items-center gap-2"><span className={`font-semibold ${b.selected ? "text-blue-700" : "text-slate-700"}`}>{b.model}</span>{b.selected && <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />}</div></td>
                            {METRIC_LABELS.map((m) => {
                              const v = gm(b, m.key);
                              const isBest = v === best(m.key);
                              return <td key={m.key} className={`px-5 py-3.5 text-right font-mono tabular-nums ${b.selected ? "font-semibold text-blue-700" : "text-slate-600"} ${isBest ? "font-bold" : ""}`}>{m.fmt(v)}</td>;
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* RAG METRICS */}
            {tab === "RAG Metrics" && ragStats && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-4">
                  <KPI label="Total Documents" value={String(ragStats.total_documents || 0)} sub="knowledge base entries" />
                  <KPI label="FAISS Dimension" value={String(ragStats.faiss_dimension || "-")} sub="embedding vector size" />
                  <KPI label="Index Vectors" value={String(ragStats.faiss_total_vectors || "-")} sub="total indexed" />
                  <KPI label="Categories" value={String(Object.keys(ragStats.categories as Record<string, number> || {}).length)} sub="knowledge domains" />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h3 className="mb-4 text-[14px] font-bold text-slate-800">Knowledge Categories</h3>
                  <div className="space-y-3">
                    {Object.entries(ragStats.categories as Record<string, number> || {}).map(([cat, count], i) => (
                      <div key={cat} className="flex items-center gap-3">
                        <span className="w-24 text-[12px] font-medium text-slate-600">{cat}</span>
                        <div className="flex-1 h-6 rounded-md bg-slate-100 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(count / (ragStats.total_documents as number)) * 100}%` }} transition={{ delay: 0.1 * i, duration: 0.4 }} className="h-full rounded-md bg-blue-600 flex items-center justify-end pr-2">
                            <span className="text-[10px] font-bold text-white">{count}</span>
                          </motion.div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* FEATURE INTELLIGENCE */}
            {tab === "Feature Intelligence" && featureImp && (
              <div className="space-y-4">
                {featureImp.slice(0, 12).map((f, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
                    <span className="w-20 text-[12px] font-medium text-slate-600 truncate">{f.label as string}</span>
                    <div className="flex-1 h-7 rounded-md bg-slate-100 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(f.importance as number) * 100}%` }} transition={{ delay: 0.05 * i, duration: 0.5 }} className="h-full rounded-md bg-blue-600 flex items-center justify-end pr-2.5">
                        <span className="text-[10px] font-bold text-white tabular-nums">{((f.importance as number) * 100).toFixed(1)}%</span>
                      </motion.div>
                    </div>
                    <span className="w-16 text-[11px] text-right text-slate-400">{f.category as string}</span>
                  </div>
                ))}
              </div>
            )}

            {/* PIPELINE */}
            {tab === "Pipeline" && pipeline && (
              <div className="space-y-3">
                {pipeline.map((step, i) => (
                  <div key={i} className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">{i + 1}</div>
                    <div className="flex-1">
                      <p className="text-[14px] font-semibold text-slate-800">{step.stage}</p>
                      <p className="mt-0.5 text-[12px] text-slate-500">{step.desc}</p>
                    </div>
                    {i < pipeline.length - 1 && <ChevronRight className="mt-2 h-4 w-4 text-slate-300" />}
                  </div>
                ))}
              </div>
            )}

            {/* EXPERIMENTS */}
            {tab === "Experiments" && experiments && (
              <div className="grid gap-4 sm:grid-cols-2">
                {experiments.map((exp, i) => (
                  <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[14px] font-bold text-slate-800">{exp.name as string}</h3>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">{exp.status as string}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(exp.metrics as Record<string, number> | null) && Object.entries(exp.metrics as Record<string, number>).map(([k, v]: [string, number]) => (
                        <div key={k} className="rounded-lg bg-slate-50 p-2.5 text-center">
                          <div className="text-[10px] uppercase text-slate-400">{k}</div>
                          <div className="mt-0.5 text-[14px] font-bold text-blue-700 tabular-nums">{v}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-[11px] text-slate-400">Date: {exp.date as string}</div>
                  </div>
                ))}
              </div>
            )}

            {/* RESEARCH ARCHIVE */}
            {tab === "Research Archive" && research && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {research.map((r, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <h3 className="text-[14px] font-semibold text-slate-800">{r.title as string}</h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(r.categories as string[]).map((c) => (
                        <span key={c} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{c}</span>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">{r.entries as number} entries</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* EXPLAINABILITY */}
            {tab === "Explainability" && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <Brain className="h-5 w-5 text-blue-600 mb-2" />
                    <p className="text-[14px] font-semibold text-slate-800">SHAP Analysis</p>
                    <p className="mt-1 text-[12px] text-slate-500">{data.shap_available ? "SHAP outputs available for feature attribution" : "SHAP analysis not yet generated. Run evaluation pipeline."}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <Zap className="h-5 w-5 text-blue-600 mb-2" />
                    <p className="text-[14px] font-semibold text-slate-800">Feature Attribution</p>
                    <p className="mt-1 text-[12px] text-slate-500">VPD, temperature, and humidity are the strongest predictors of wildfire risk.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <Search className="h-5 w-5 text-blue-600 mb-2" />
                    <p className="text-[14px] font-semibold text-slate-800">Model Interpretability</p>
                    <p className="mt-1 text-[12px] text-slate-500">XGBoost provides built-in feature importance via gain, cover, and frequency metrics.</p>
                  </div>
                </div>

                {riskTiers && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <h3 className="mb-4 text-[14px] font-bold text-slate-800">Risk Tier Thresholds</h3>
                    <div className="space-y-2">
                      {riskTiers.map((t) => (
                        <div key={t.name} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                          <span className="h-3 w-3 rounded-full" style={{ background: t.color }} />
                          <span className="flex-1 text-[13px] font-medium text-slate-700 capitalize">{t.name}</span>
                          <span className="text-[12px] tabular-nums text-slate-400">{t.range}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {(!experiments?.length && tab === "Experiments") && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                <FlaskConical className="mx-auto h-8 w-8 text-slate-300 mb-3" />
                <p className="text-[14px] text-slate-400">No experiments recorded yet.</p>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function KPI({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-2 text-[28px] font-bold text-blue-700 tabular-nums">{value}</p>
      <p className="mt-1 text-[11px] text-slate-400">{sub}</p>
    </div>
  );
}
