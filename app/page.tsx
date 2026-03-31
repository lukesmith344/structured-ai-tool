"use client";

import { useState } from "react";

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
    if (score >= 8) return "bg-green-100 text-green-800";
    if (score >= 5) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const approved = attendees.filter((a) => a.status === "approved");

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Conference ICP Prioritizer
          </h1>
          <p className="text-gray-500 mt-1">
            Paste attendees from the conference app. We'll research and rank
            them by fit.
          </p>
        </div>

        {/* Input Section */}
        {!attendees.length && !isResearching && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attendee List{" "}
              <span className="text-gray-400 font-normal">
                (Name, Title, Company — one per line)
              </span>
            </label>
            <textarea
              className="w-full h-40 border border-gray-200 rounded-lg p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ color: "#111827", backgroundColor: "#ffffff" }}
              placeholder={SAMPLE_DATA}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={research}
                disabled={!input.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Research & Score
              </button>
              <button
                onClick={() => setInput(SAMPLE_DATA)}
                className="text-sm text-blue-600 hover:underline"
              >
                Load sample data
              </button>
            </div>
          </div>
        )}

        {/* Progress */}
        {isResearching && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Researching {progress.done}/{progress.total} attendees...
            </p>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(progress.done / progress.total) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Results */}
        {attendees.length > 0 && (
          <div className="flex gap-6">
            {/* Main Queue */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                  Ranked Queue
                </h2>
                <button
                  onClick={() => {
                    setAttendees([]);
                    setInput("");
                  }}
                  className="text-sm text-gray-400 hover:text-gray-600"
                >
                  Start over
                </button>
              </div>

              {attendees.map((a, i) => (
                <div
                  key={i}
                  className={`bg-white rounded-xl shadow-sm border p-5 transition-opacity ${
                    a.status === "skipped"
                      ? "opacity-40 border-gray-100"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{a.name}</p>
                      <p className="text-sm text-gray-500">
                        {a.title} · {a.company}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-bold px-3 py-1 rounded-full ${scoreColor(a.icp_score)}`}
                    >
                      {a.icp_score}/10
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">
                    {a.company_summary}
                  </p>
                  <p className="text-sm text-gray-500 italic mb-1">
                    {a.score_reason}
                  </p>
                  {a.timing_signals && (
                    <p className="text-sm text-blue-600 mb-3">
                      ⚡ {a.timing_signals}
                    </p>
                  )}

                  {/* Message Draft */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    {editingIndex === i ? (
                      <textarea
                        className="w-full text-sm bg-transparent focus:outline-none resize-none"
                        style={{ color: "#111827" }}
                        rows={4}
                        value={a.edited_message ?? a.message_draft}
                        onChange={(e) => updateMessage(i, e.target.value)}
                      />
                    ) : (
                      <p className="text-sm text-gray-700">
                        {a.edited_message ?? a.message_draft}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {a.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(i, "approved")}
                        className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          setEditingIndex(editingIndex === i ? null : i)
                        }
                        className="border border-gray-300 text-gray-700 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50"
                      >
                        {editingIndex === i ? "Done" : "Edit"}
                      </button>
                      <button
                        onClick={() => updateStatus(i, "skipped")}
                        className="text-gray-400 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50"
                      >
                        Skip
                      </button>
                    </div>
                  )}
                  {a.status === "approved" && (
                    <p className="text-sm text-green-600 font-medium">
                      ✓ Added to outreach queue
                    </p>
                  )}
                  {a.status === "skipped" && (
                    <p className="text-sm text-gray-400">Skipped</p>
                  )}
                </div>
              ))}
            </div>

            {/* Outreach Queue Sidebar */}
            <div className="w-80 shrink-0">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Outreach Queue{" "}
                  <span className="text-gray-400 font-normal text-sm">
                    ({approved.length})
                  </span>
                </h2>
                {approved.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    Approve messages to add them here.
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
                        <p className="text-xs text-gray-600 mb-2 line-clamp-3">
                          {a.edited_message ?? a.message_draft}
                        </p>
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(
                              a.edited_message ?? a.message_draft
                            )
                          }
                          className="text-xs text-blue-600 hover:underline"
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
      </div>
    </main>
  );
}