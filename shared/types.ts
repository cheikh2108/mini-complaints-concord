export type ComplaintStatus = "open" | "in_progress" | "resolved";
export type ComplaintPriority = "low" | "medium" | "high";

export interface Complaint {
  id: string;
  customer: string;
  subject: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  createdAt: string; // ISO 8601
}

// ---- API contract (base URL http://localhost:3001, CORS enabled) ----

/** POST /api/complaints -> 201 Complaint (status starts "open"); 400 ApiError */
export interface CreateComplaintBody {
  customer: string;
  subject: string;
  priority: ComplaintPriority;
}

/** PATCH /api/complaints/:id/status -> 200 Complaint; 400/404 ApiError */
export interface UpdateStatusBody {
  status: ComplaintStatus;
}

/** GET /api/complaints?status=&priority=&q= -> Complaint[] (newest first); q matches customer/subject */
export interface ListComplaintsQuery {
  status?: ComplaintStatus;
  priority?: ComplaintPriority;
  q?: string;
}

/** GET /api/complaints/stats -> ComplaintStats */
export type ComplaintStats = Record<ComplaintStatus, number> & { total: number };

export interface ApiError {
  error: string;
}
