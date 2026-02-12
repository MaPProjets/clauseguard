export interface ClauseAnalysis {
  name: string;
  status: "critique" | "attention" | "ok" | "absent";
  shortDescription: string;
  originalText?: string;
  explanation: string;
  recommendation: string;
  suggestedRewrite?: string;
}

export interface AnalysisResult {
  globalScore: number;
  summary: string;
  clauses: ClauseAnalysis[];
  redFlags: string[];
  positivePoints: string[];
}

export interface UploadResponse {
  success: boolean;
  filename: string;
  fileType: "pdf" | "docx";
  textLength: number;
  text: string;
}

export interface AnalyzeResponse {
  success: boolean;
  analysis: AnalysisResult;
}

export interface AnalysisHistoryItem {
  id: string;
  filename: string;
  date: string;
  score: number;
  redFlagCount: number;
}
