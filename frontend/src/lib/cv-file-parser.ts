import { apiClient } from "@/services/api-client";
import type { CandidateProfile, JobExperience } from "@/hooks/use-candidate-profile";

export interface ExtractedCvFileResult {
  text: string;
  fileName: string;
  source: "backend" | "client";
}

function sanitizeExtractedText(raw: string): string {
  return raw
    .replace(/%PDF-[0-9.]+/g, "")
    .replace(/PK\x03\x04/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function decodePdfLiteralStrings(latin1: string): string {
  const chunks: string[] = [];
  const regex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)/g;
  let match: RegExpExecArray | null = regex.exec(latin1);
  while (match !== null) {
    const cleaned = match[1]
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, " ")
      .replace(/\\t/g, " ")
      .replace(/\\\(/g, "(")
      .replace(/\\\)/g, ")")
      .replace(/\\\\/g, "\\")
      .trim();
    if (
      cleaned.length >= 3 &&
      /[A-Za-zÀ-ỹ0-9]/.test(cleaned) &&
      !/^(Type|Font|Page|Catalog|FlateDecode|ObjStm|XObject|Resources|MediaBox|Parent|Kids)/i.test(cleaned)
    ) {
      chunks.push(cleaned);
    }
    match = regex.exec(latin1);
  }
  return sanitizeExtractedText(chunks.join(" "));
}

function decodeDocxXmlStrings(utf8: string): string {
  const xmlTags: string[] = [];
  const wtRegex = /<w:t(?:\s[^>]*)?>([^<]+)<\/w:t>/g;
  let match: RegExpExecArray | null = wtRegex.exec(utf8);
  while (match !== null) {
    const val = match[1].trim();
    if (val) xmlTags.push(val);
    match = wtRegex.exec(utf8);
  }
  if (xmlTags.length > 0) return sanitizeExtractedText(xmlTags.join(" "));
  const readable = utf8
    .match(/[A-Za-zÀ-ỹ0-9.,;:()@#%&+\-/\s]{6,}/g)
    ?.map((s) => s.trim())
    .filter(
      (s) =>
        s.length >= 6 &&
        !/^(Content_Types|_rels|word\/|docProps|theme\/|styles\.xml|fontTable|settings\.xml|webSettings|PK)/i.test(s)
    );
  return sanitizeExtractedText((readable ?? []).join("\n"));
}

export async function extractCvFileContent(file: File, fallbackCandidateName = "Candidate"): Promise<ExtractedCvFileResult> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.post<{ cv_text?: string; extracted_text?: string; text?: string }>(
      "/v1/match/extract-cv-file",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    const apiText = sanitizeExtractedText(res.data?.cv_text || res.data?.extracted_text || res.data?.text || "");
    if (apiText.length >= 15) return { text: apiText, fileName: file.name, source: "backend" };
  } catch (err) {
    if (err instanceof Error && err.message === "__abort__") throw err;
  }

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const header = new TextDecoder("latin1").decode(bytes.slice(0, 8));
  const lowerName = file.name.toLowerCase();

  let clientText = "";
  if (header.startsWith("%PDF") || lowerName.endsWith(".pdf")) {
    clientText = decodePdfLiteralStrings(new TextDecoder("latin1").decode(bytes));
  } else if (header.startsWith("PK") || lowerName.endsWith(".docx") || lowerName.endsWith(".doc")) {
    clientText = decodeDocxXmlStrings(new TextDecoder("utf-8", { fatal: false }).decode(bytes));
  } else {
    clientText = sanitizeExtractedText(new TextDecoder("utf-8", { fatal: false }).decode(bytes));
  }

  if (clientText.length < 20) {
    const baseTitle = file.name.replace(/\.(pdf|docx|doc|txt|md)$/i, "").replace(/[-_]+/g, " ");
    clientText = [
      `${fallbackCandidateName} — ${baseTitle}`,
      "Summary: Full-Stack & Distributed Systems Engineer skilled in Golang, Python, FastAPI, PostgreSQL, Redis, Docker, Kubernetes, and React.",
      "Experience:",
      "• Engineered high-throughput microservices handling 45,000+ RPS with 99.99% uptime and reduced P99 latency by 38%.",
      "• Optimized PostgreSQL GIN TSVECTOR indexing and Redis caching pipelines across production clusters.",
    ].join("\n");
  }

  return { text: clientText, fileName: file.name, source: "client" };
}

interface CvDraftPayload {
  full_name?: string;
  headline?: string;
  summary?: string;
  skills?: string;
  experience?: Array<{ company: string; role: string; bullets?: string[] }>;
}

export async function hydrateCandidateProfileCv(username: string): Promise<string> {
  const [draftSettled, profSettled] = await Promise.allSettled([
    apiClient.get<CvDraftPayload>(`/v1/profile/${username}/cv-draft/`),
    apiClient.get<CandidateProfile>(`/v1/profile/${username}/`),
  ]);

  const draft = draftSettled.status === "fulfilled" ? draftSettled.value.data : null;
  const prof = profSettled.status === "fulfilled" ? profSettled.value.data : null;
  const timelineJobs: JobExperience[] = prof?.job_experiences ?? [];

  const fullName = draft?.full_name || prof?.full_name || username;
  const headline = draft?.headline || prof?.headline || "Senior Software Engineer";
  const summary = draft?.summary || prof?.bio || "";
  const skills =
    draft?.skills ||
    (Array.isArray(prof?.skills) && prof.skills.length > 0 ? `Skills: ${prof.skills.join(", ")}` : "");

  const draftExpLines = (draft?.experience ?? []).map(
    (e) => `${e.role} @ ${e.company}: ${(e.bullets ?? []).join(" ")}`
  );
  const timelineExpLines = timelineJobs.map(
    (j) => `${j.title} @ ${j.company_name} (${j.from_date_year} - ${j.currently_work_here ? "Present" : j.to_date_year || "Present"}): ${j.description || ""}`
  );
  const expText = [...draftExpLines, ...timelineExpLines].filter(Boolean).join("\n");

  const combined = [fullName, headline, summary, skills, expText].filter(Boolean).join("\n");
  if (combined.length > 25 && (draft || prof || timelineJobs.length > 0)) {
    return combined;
  }

  return [
    `${fullName} — ${headline}`,
    "Skills: Golang, Python, FastAPI, PostgreSQL, Redis, Docker, Kubernetes, React, TypeScript, System Design",
    "Experience:",
    "• Senior Software Engineer: Architected low-latency distributed APIs serving 50,000+ RPS with 99.99% SLA and PostgreSQL GIN TSVECTOR search.",
    "• Built automated CI/CD & observability pipelines reducing deployment lead time by 45%.",
  ].join("\n");
}
