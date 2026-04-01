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

interface TrackedContact {
  name: string;
  title: string;
  company: string;
  icp_score: number;
  message: string;
  status: "Messaged" | "Met" | "Follow-up Sent" | "Closed";
  notes: string;
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

const STATUS_COLORS: Record<TrackedContact["status"], string> = {
  Messaged: "bg-blue-50 text-blue-700 border border-blue-200",
  Met: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "Follow-up Sent": "bg-amber-50 text-amber-700 border border-amber-200",
  Closed: "bg-gray-100 text-gray-500 border border-gray-200",
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<"prioritizer" | "tracker">("prioritizer");
  const [input, setInput] = useState("");
  const [attendees, setAttendees] = useState<ScoredAttendee[]>([]);
  const [isResearching, setIsResearching] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tracker, setTracker] = useState<TrackedContact[]>([]);
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);

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

  const updateStatus = (index: number, status: "approved" | "skipped" | "pending") => {
    const attendee = attendees[index];
    if (status === "approved") {
      const alreadyTracked = tracker.some(
        (t) => t.name === attendee.name && t.company === attendee.company
      );
      if (!alreadyTracked) {
        setTracker((prev) => [
          ...prev,
          {
            name: attendee.name,
            title: attendee.title,
            company: attendee.company,
            icp_score: attendee.icp_score,
            message: attendee.edited_message ?? attendee.message_draft,
            status: "Messaged",
            notes: "",
          },
        ]);
      }
    }
    setAttendees((prev) =>
      prev.map((a, i) => (i === index ? { ...a, status } : a))
    );
  };

  const updateMessage = (index: number, message: string) => {
    setAttendees((prev) =>
      prev.map((a, i) => (i === index ? { ...a, edited_message: message } : a))
    );
  };

  const updateTrackerStatus = (index: number, status: TrackedContact["status"]) => {
    setTracker((prev) =>
      prev.map((t, i) => (i === index ? { ...t, status } : t))
    );
  };

  const updateTrackerNotes = (index: number, notes: string) => {
    setTracker((prev) =>
      prev.map((t, i) => (i === index ? { ...t, notes } : t))
    );
  };

  const removeFromTracker = (index: number) => {
    const contact = tracker[index];
    const attendeeIndex = attendees.findIndex(
      (a) => a.name === contact.name && a.company === contact.company
    );
    if (attendeeIndex !== -1) updateStatus(attendeeIndex, "pending");
    setTracker((prev) => prev.filter((_, i) => i !== index));
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
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("prioritizer")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === "prioritizer"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Prioritizer
            </button>
            <button
              onClick={() => setActiveTab("tracker")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === "tracker"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Tracker
              {tracker.length > 0 && (
                <span className="bg-[#1a4a3a] text-white text-xs px-1.5 py-0.5 rounded-full">
                  {tracker.length}
                </span>
              )}
            </button>
          </div>
          <span className="text-xs font-medium text-gray-400 tracking-widest uppercase">
            Conference ICP Prioritizer
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-10">
        {/* PRIORITIZER TAB */}
        {activeTab === "prioritizer" && (
          <>
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
                    style={{ width: `${(progress.done / progress.total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  Searching company websites, news, and recent activity...
                </p>
              </div>
            )}

            {attendees.length > 0 && (
              <div className="flex gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
                      Ranked Queue
                    </h2>
                    <button
                      onClick={() => { setAttendees([]); setInput(""); }}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      ← Start over
                    </button>
                  </div>

                  {attendees.map((a, i) => {
                    if (a.status === "approved") return null;
                    return (
                      <div
                        key={i}
                        className={`bg-white rounded-2xl border p-6 transition-all ${
                          a.status === "skipped"
                            ? "opacity-40 border-gray-100"
                            : "border-gray-200 shadow-sm"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="font-semibold text-gray-900 text-base">{a.name}</p>
                            <p className="text-sm text-gray-400 mt-0.5">{a.title} · {a.company}</p>
                          </div>
                          <span className={`text-sm font-bold px-3 py-1 rounded-full ${scoreColor(a.icp_score)}`}>
                            {a.icp_score}/10
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 leading-relaxed mb-3">{a.company_summary}</p>
                        <p className="text-xs text-gray-400 italic mb-3">{a.score_reason}</p>

                        {a.timing_signals && (
                          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
                            <span className="text-sm">⚡</span>
                            <p className="text-xs text-amber-800 leading-relaxed">{a.timing_signals}</p>
                          </div>
                        )}

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

                        {a.status === "pending" && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateStatus(i, "approved")}
                              className="bg-[#1a4a3a] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#153d30] transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setEditingIndex(editingIndex === i ? null : i)}
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
                        {a.status === "skipped" && (
                          <div className="flex items-center gap-3">
                            <p className="text-sm text-gray-300">Skipped</p>
                            <button
                              onClick={() => updateStatus(i, "pending")}
                              className="text-xs text-gray-400 hover:text-gray-600 underline"
                            >
                              Undo
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                        {approved.map((a, i) => {
                          const index = attendees.findIndex(
                            (att) => att.name === a.name && att.company === a.company
                          );
                          return (
                            <div key={i} className="border-b border-gray-100 pb-4 last:border-0">
                              <p className="text-sm font-medium text-gray-800">{a.name}</p>
                              <p className="text-xs text-gray-400 mb-2">{a.company}</p>
                              <p className="text-xs text-gray-500 mb-2 line-clamp-3 leading-relaxed">
                                {a.edited_message ?? a.message_draft}
                              </p>
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => navigator.clipboard.writeText(a.edited_message ?? a.message_draft)}
                                  className="text-xs text-[#1a4a3a] font-medium hover:underline"
                                >
                                  Copy to conference app →
                                </button>
                                <button
                                  onClick={() => removeFromTracker(tracker.findIndex(t => t.name === a.name && t.company === a.company))}
                                  className="text-xs text-gray-300 hover:text-red-400 transition-colors"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* TRACKER TAB */}
        {activeTab === "tracker" && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                Contact Tracker
              </h1>
              <p className="text-gray-500 text-sm">
                Track every contact you've reached out to at the conference.
              </p>
            </div>

            {tracker.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
                <p className="text-gray-400 text-sm">No contacts yet.</p>
                <p className="text-gray-300 text-xs mt-1">
                  Approve messages in the Prioritizer to add contacts here.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-widest px-6 py-4">Contact</th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-widest px-6 py-4">Score</th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-widest px-6 py-4">Status</th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-widest px-6 py-4">Notes</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tracker.map((t, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900">{t.name}</p>
                          <p className="text-xs text-gray-400">{t.title} · {t.company}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${scoreColor(t.icp_score)}`}>
                            {t.icp_score}/10
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={t.status}
                            onChange={(e) => updateTrackerStatus(i, e.target.value as TrackedContact["status"])}
                            className={`text-xs font-medium px-3 py-1.5 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-[#1a4a3a] cursor-pointer ${STATUS_COLORS[t.status]}`}
                          >
                            <option>Messaged</option>
                            <option>Met</option>
                            <option>Follow-up Sent</option>
                            <option>Closed</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 w-64">
                          {editingNoteIndex === i ? (
                            <input
                              autoFocus
                              className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1a4a3a]"
                              value={t.notes}
                              onChange={(e) => updateTrackerNotes(i, e.target.value)}
                              onBlur={() => setEditingNoteIndex(null)}
                              placeholder="Add a note..."
                            />
                          ) : (
                            <p
                              onClick={() => setEditingNoteIndex(i)}
                              className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 truncate"
                            >
                              {t.notes || <span className="text-gray-300">Add a note...</span>}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => removeFromTracker(i)}
                            className="text-xs text-gray-300 hover:text-red-400 transition-colors"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}