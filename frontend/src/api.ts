import type {
  ApiError,
  Complaint,
  ComplaintStats,
  ComplaintStatus,
  CreateComplaintBody,
  ListComplaintsQuery,
} from "../../shared/types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new Error("API injoignable. Lancez le backend (npm run dev dans backend/).");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data as ApiError | null)?.error ?? `Erreur ${res.status}`);
  return data as T;
}

export const listComplaints = (q: ListComplaintsQuery) => {
  const params = new URLSearchParams();
  if (q.status) params.set("status", q.status);
  if (q.priority) params.set("priority", q.priority);
  if (q.q) params.set("q", q.q);
  return request<Complaint[]>(`/api/complaints?${params}`);
};

export const getStats = () => request<ComplaintStats>("/api/complaints/stats");

export const createComplaint = (body: CreateComplaintBody) =>
  request<Complaint>("/api/complaints", { method: "POST", body: JSON.stringify(body) });

export const updateStatus = (id: string, status: ComplaintStatus) =>
  request<Complaint>(`/api/complaints/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
