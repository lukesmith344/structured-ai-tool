import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
export const maxDuration = 60;

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { name, title, company } = await req.json();

  const prompt = `You are a GTM analyst for Structured AI, a YC-backed startup that builds AI agents for QA/QC in the AEC (Architecture, Engineering, Construction) industry. Structured AI's product automatically reviews engineering drawings — MEP, civil, and structural — to catch clashes, code violations, and inconsistencies before they reach the field. This saves firms weeks of rework and reduces costly RFIs and change orders. It integrates with Revit, Gmail, Outlook, SharePoint, and Google Drive.

The ideal customer profile (ICP) is:
- Multi-disciplinary AEC firms that produce high volumes of engineering drawings
- Specifically: MEP engineering firms, civil engineering firms, structural engineering firms, large general contractors with in-house engineering teams
- Firms doing complex, multi-discipline projects where drawing coordination is a major pain point
- Decision makers: CTOs, Directors of Engineering, VPs of Design, Innovation leads, Chief Engineers
- Company size: mid-to-large firms, ideally $10M+ revenue or 50+ engineers

High-value timing signals:
- Recently won a large infrastructure or construction contract (more drawings = more need)
- Hiring surge in engineering or design roles
- Publicly mentioned issues with RFIs, rework, or project delays
- Actively adopting BIM or Revit workflows
- Expanding into new project types or geographies

Research this conference attendee:
Name: ${name}
Title: ${title}
Company: ${company}

Search for publicly available information about this company. Identify what they do, their size, their engineering focus, and any recent news or signals.

Return ONLY a valid JSON object with no markdown, no backticks, no preamble. Just raw JSON:
{
  "company_summary": "2-3 sentence summary of what the company does and their engineering focus",
  "icp_score": <number 1-10>,
  "score_reason": "one sentence explaining why they scored this way relative to Structured AI's ICP",
  "timing_signals": "one sentence on any recent news or triggers that make this a good time to reach out, or null if none found",
  "message_draft": "a short, warm, non-salesy outreach message for the conference app. 3-4 sentences max. Reference something specific and real about their company or work. Do not mention Structured AI by name. Just say you wanted to connect at the conference."
}`;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content
        .filter((block) => block.type === "text")
        .map((block) => (block as { type: "text"; text: string }).text)
        .join("");

    const clean = text
        .replace(/```json|```/g, "")
        .replace(/<cite[^>]*>|<\/cite>/g, "")
        .trim();
    const parsed = JSON.parse(clean);
    return NextResponse.json({ success: true, data: parsed });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: "Failed to research attendee" },
      { status: 500 }
    );
  }
}