export interface BadgeTheme {
  fill: string;
  text: string;
}

export interface ReportColumn {
  header: string;
  key: string;
  width?: number;
  isBadge?: boolean;
  badgeColors?: Record<string, BadgeTheme>;
}

export type ExcelCellValue =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined;

export interface ReportConfig {
  title: string;
  sheetName?: string;
  columns: ReportColumn[];
  data: Record<string, ExcelCellValue>[];
}

export interface MatrixRow {
  departamento: string;
  total: number;
  [issueType: string]: string | number;
}

export interface MatrixReportConfig {
  title: string;
  sheetName?: string;
  issueTypes: string[];
  data: MatrixRow[];
  totalsRow: MatrixRow;
}

export interface SurveyReportColumn {
  header: string;
  key: string;
  width?: number;
  isRating?: boolean;
  isLongText?: boolean;
}

export interface SurveyReportConfig {
  title: string;
  sheetName?: string;
  columns: SurveyReportColumn[];
  data: Record<string, unknown>[];
  overallAverage?: number;
}
