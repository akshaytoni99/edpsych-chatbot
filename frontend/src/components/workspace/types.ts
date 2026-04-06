export type ReportType =
  | "background_summary"
  | "cognitive_report"
  | "unified_insights";

export interface Report {
  id: string;
  report_type: ReportType;
  content_markdown: string;
  status: string;
  updated_at: string;
}

export interface CognitiveProfile {
  id: string;
  test_name: string | null;
  parsed_scores: ParsedScores | null;
  confidence_score: number;
  iq_test_upload_id?: string | null;
  raw_ocr_text?: string | null;
  requires_review?: boolean;
}

export interface SubtestScore {
  name: string;
  score: number | string | null;
  percentile?: number | string | null;
  confidence_interval?: string | null;
}

export interface ParsedScores {
  test_name?: string | null;
  test_date?: string | null;
  full_scale_iq?: number | string | null;
  subtests?: SubtestScore[] | null;
  [key: string]: unknown;
}

export interface LatestSession {
  id: string;
  status: string;
  context_data?: Record<string, unknown> | null;
  completed_at?: string | null;
  has_assessment_data?: boolean;
  [key: string]: unknown;
}

export interface GroupedReports {
  background_summary: Report[];
  cognitive_report: Report[];
  unified_insights: Report[];
  [key: string]: Report[];
}

export interface WorkspaceResponse {
  student: {
    id: string;
    first_name: string;
    last_name: string;
    [key: string]: unknown;
  };
  latest_completed_session: LatestSession | null;
  reports: GroupedReports;
  cognitive_profiles: CognitiveProfile[];
}
