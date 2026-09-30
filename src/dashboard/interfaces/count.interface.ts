export interface RawDepartmentRow {
  departmentName: string;
  count: string;
}

export interface RawIssueTypeRow {
  issueTypeName: string;
  count: string;
}

export interface MaintenanceCountResult {
  count: string;
}

export interface CountResult {
  count: string;
}

export interface SumResult {
  total: string;
}

export interface RawTicketCount {
  status_name: string;
  ticket_count: string;
}
