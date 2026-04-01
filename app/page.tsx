"use client";

import { useState } from "react";
import Image from "next/image";

interface Attendee {
  name: string;
  title: string;
  company: string;
}

interface ScoredAttendee extends Attendee {
  company_summary: string;
  icp_score: number;
  score_reason: string;
  timing_signals: string | null;
  message_draft: string;
  status: "approved" | "skipped" | "pending";
  edited_message?: string;
}

const MOCK_RESULTS: ScoredAttendee[] = [
  {
    name: "Sarah Chen",
    title: "Director of Engineering",
    company: "Syska Hennessy Group",
    company_summary:
      "Syska Hennessy Group is a global MEP engineering firm with 650+ professionals across 21 offices specializing in mechanical, electrical, and plumbing design. They serve complex projects from office buildings to hyperscale data centers across commercial, healthcare, and mission-critical sectors.",
    icp_score: 9,
    score_reason:
      "Large multi-disciplinary MEP firm producing high volumes of complex drawings across numerous projects that demands robust drawing coordination.",
    timing_signals:
      "Named ENR West's 2025 Design Firm of the Year and recently opened a Singapore office, signaling accelerated project velocity and drawing complexity.",
    message_draft:
      "Hi Sarah — saw Syska was just named ENR West's 2025 Design Firm of the Year, congrats on that recognition. I'm with Structured AI, we do AI drawing QA/QC for MEP firms — we've caught over 10,000 design errors across our clients. Would love to grab 15 mins at the conference to show you what we've built.",
    status: "pending",
  },
  {
    name: "James Okafor",
    title: "VP of Design",
    company: "WSP Global",
    company_summary:
      "WSP Global is a world-leading engineering and professional services firm with 83,000 employees in over 50 countries, offering MEP, structural, civil, and infrastructure services at massive scale.",
    icp_score: 9,
    score_reason:
      "Massive multi-disciplinary firm with high-volume drawing coordination across MEP, structural, and civil projects globally.",
    timing_signals:
      "Recently acquired TRC Companies for $3.3B and announced a Microsoft AI partnership to drive digital transformation across AEC workflows.",
    message_draft:
      "Hi James — impressive move acquiring TRC Companies, that's a massive expansion of WSP's capabilities. I'm with Structured AI, we build AI drawing QA/QC tools for large engineering firms — we've caught over 10,000 design errors across our clients. Would love to connect at the conference.",
    status: "pending",
  },
  {
    name: "Rachel Patel",
    title: "Director of Innovation",
    company: "AECOM",
    company_summary:
      "AECOM is a Fortune 500 global infrastructure firm with $16.1 billion in revenue and 51,000 employees providing engineering, consulting, and project management across water, energy, transportation, and buildings sectors.",
    icp_score: 10,
    score_reason:
      "Massive multi-disciplinary AEC firm producing enormous volumes of engineering drawings with a Director of Innovation who is the perfect decision maker for AI tooling.",
    timing_signals:
      "AECOM recently acquired AI startup Consigli for $390M and is actively investing in AI initiatives including proprietary large language models.",
    message_draft:
      "Hi Rachel — noticed AECOM's acquisition of Consigli and your focus on AI innovation, exciting times for digital transformation in AEC. I'm with Structured AI, we do AI drawing QA/QC and have caught over 10,000 design errors across clients like Syska Hennessy. Would love to grab 15 mins at the conference.",
    status: "pending",
  },
];

const SAMPLE_DATA = `Sarah Chen, Director of Engineering, Syska Hennessy Group
James Okafor, VP of Design, WSP Global
Maria Torres, Chief Engineer, Jacobs Engineering
David Kim, CTO, Thornton Tomasetti
Rachel Patel, Director of Innovation, AECOM`;

export default function Home() {
  const [input, setInput] = useState("");
  const [attendees, setAttendees] = useState<ScoredAttendee[]>([]);
  const [isResearching, setIsResearching] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const parseInput = (raw: string): Attendee[] => {
    return raw
      .trim()
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        const parts = line.split(",").map((p) => p.trim());
        return {
          name: parts[0] || "",
          title: parts[1] || "",
          company: parts[2] || "",
        };
      })
      .filter((a) => a.name && a.company);
  };

  const research = async () => {
    const parsed = parseInput(input);
    if (!parsed.length) return;

    setIsResearching(true);
    setAttendees([]);
    setProgress({ done: 0, total: parsed.length });

    const results: ScoredAttendee[] = [];

    for (const attendee of parsed) {
      try {
        const res = await fetch("/api/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(attendee),
        });
        const json = await res.json();
        if (json.success) {
          results.push({ ...attendee, ...json.data, status: "pending" });
        }
      } catch (err) {
        console.error(err);
      }
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    results.sort((a, b) => b.icp_score - a.icp_score);
    setAttendees(results);
    setIsResearching(false);
  };

  const updateStatus = (index: number, status: "approved" | "skipped") => {
    setAttendees((prev) =>
      prev.map((a, i) => (i === index ? { ...a, status } : a))
    );
  };

  const updateMessage = (index: number, message: string) => {
    setAttendees((prev) =>
      prev.map((a, i) => (i === index ? { ...a, edited_message: message } : a))
    );
  };

  const scoreColor = (score: number) => {
    if (score >= 8) return "bg-emerald-50 text-emerald-800 border border-emerald-200";
    if (score >= 5) return "bg-amber-50 text-amber-800 border border-amber-200";
    return "bg-red-50 text-red-700 border border-red-200";
  };

  const approved = attendees.filter((a) => a.status === "approved");

  return (
    <div className="min-h-screen bg-[#f9f9f7]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Image
            src="/structuredAIlogo.png"
            alt="Structured AI"
            width={180}
            height={36}
            className="h-8 w-auto"
          />
          <span className="text-xs font-medium text-gray-400 tracking-widest uppercase">
            Conference ICP Prioritizer
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-10">
        {/* Hero text */}
        {!attendees.length && !isResearching && (
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">
              Find your highest-value attendees
            </h1>
            <p className="text-gray-500 text-sm">
              Paste attendees from the conference app. We'll research each company and rank them by ICP fit.
            </p>
          </div>
        )}

        {/* Input Section */}
        {!attendees.length && !isResearching && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
              Attendee List
              <span className="normal-case font-normal ml-2 text-gray-400">
                — Name, Title, Company (one per line)
              </span>
            </label>
            <textarea
              className="w-full h-44 border border-gray-200 rounded-xl p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1a4a3a] resize-none"
              style={{ color: "#111827", backgroundColor: "#fafafa" }}
              placeholder={SAMPLE_DATA}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <div className="flex items-center gap-4 mt-4">
              <button
                onClick={research}
                disabled={!input.trim()}
                className="bg-[#1a4a3a] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#153d30] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Research & Score
              </button>
              <button
                onClick={() => setInput(SAMPLE_DATA)}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Load sample data
              </button>
              {process.env.NODE_ENV === "development" && (
                <button
                  onClick={() => setAttendees(MOCK_RESULTS)}
                  className="text-sm text-gray-300 hover:text-gray-500 transition-colors"
                >
                  Load mock results (dev)
                </button>
              )}
            </div>
          </div>
        )}

        {/* Progress */}
        {isResearching && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-700">
                Researching attendees...
              </p>
              <p className="text-sm text-gray-400">
                {progress.done} / {progress.total}
              </p>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-[#1a4a3a] h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${(progress.done / progress.total) * 100}%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Searching company websites, news, and recent activity...
            </p>
          </div>
        )}

        {/* Results */}
        {attendees.length > 0 && (
          <div className="flex gap-6">
            {/* Main Queue */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
                  Ranked Queue
                </h2>
                <button
                  onClick={() => {
                    setAttendees([]);
                    setInput("");
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ← Start over
                </button>
              </div>

              {attendees.map((a, i) => (
                <div
                  key={i}
                  className={`bg-white rounded-2xl border p-6 transition-all ${
                    a.status === "skipped"
                      ? "opacity-40 border-gray-100"
                      : "border-gray-200 shadow-sm"
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-semibold text-gray-900 text-base">
                        {a.name}
                      </p>
                      <p className="text-sm text-gray-400 mt-0.5">
                        {a.title} · {a.company}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-bold px-3 py-1 rounded-full ${scoreColor(a.icp_score)}`}
                    >
                      {a.icp_score}/10
                    </span>
                  </div>

                  {/* Company Summary */}
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">
                    {a.company_summary}
                  </p>

                  {/* Score Reason */}
                  <p className="text-xs text-gray-400 italic mb-3">
                    {a.score_reason}
                  </p>

                  {/* Timing Signal */}
                  {a.timing_signals && (
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
                      <span className="text-sm">⚡</span>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        {a.timing_signals}
                      </p>
                    </div>
                  )}

                  {/* Message Draft */}
                  <div className="bg-[#f4f8f6] border border-[#d0e8df] rounded-xl p-4 mb-4">
                    <p className="text-xs font-semibold text-[#1a4a3a] uppercase tracking-widest mb-2">
                      Draft Message
                    </p>
                    {editingIndex === i ? (
                      <textarea
                        className="w-full text-sm bg-transparent focus:outline-none resize-none"
                        style={{ color: "#111827" }}
                        rows={5}
                        value={a.edited_message ?? a.message_draft}
                        onChange={(e) => updateMessage(i, e.target.value)}
                      />
                    ) : (
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {a.edited_message ?? a.message_draft}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {a.status === "pending" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateStatus(i, "approved")}
                        className="bg-[#1a4a3a] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#153d30] transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          setEditingIndex(editingIndex === i ? null : i)
                        }
                        className="border border-gray-200 text-gray-600 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        {editingIndex === i ? "Done" : "Edit"}
                      </button>
                      <button
                        onClick={() => updateStatus(i, "skipped")}
                        className="text-gray-300 px-4 py-2 rounded-lg text-sm hover:text-gray-500 transition-colors"
                      >
                        Skip
                      </button>
                    </div>
                  )}
                  {a.status === "approved" && (
                    <p className="text-sm text-[#1a4a3a] font-medium">
                      ✓ Added to outreach queue
                    </p>
                  )}
                  {a.status === "skipped" && (
                    <p className="text-sm text-gray-300">Skipped</p>
                  )}
                </div>
              ))}
            </div>

            {/* Outreach Queue Sidebar */}
            <div className="w-72 shrink-0">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 sticky top-8 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                    Outreach Queue
                  </h2>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {approved.length}
                  </span>
                </div>
                {approved.length === 0 ? (
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Approve messages to build your outreach queue.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {approved.map((a, i) => (
                      <div
                        key={i}
                        className="border-b border-gray-100 pb-4 last:border-0"
                      >
                        <p className="text-sm font-medium text-gray-800">
                          {a.name}
                        </p>
                        <p className="text-xs text-gray-400 mb-2">
                          {a.company}
                        </p>
                        <p className="text-xs text-gray-500 mb-2 line-clamp-3 leading-relaxed">
                          {a.edited_message ?? a.message_draft}
                        </p>
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(
                              a.edited_message ?? a.message_draft
                            )
                          }
                          className="text-xs text-[#1a4a3a] font-medium hover:underline"
                        >
                          Copy to conference app →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}