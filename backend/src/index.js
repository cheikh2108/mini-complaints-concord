import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";

const STATUSES = ["open", "in_progress", "resolved"];
const PRIORITIES = ["low", "medium", "high"];

const app = express();
app.use(cors());
app.use(express.json());

/** In-memory store. Shape: Complaint from ../../shared/types.ts */
const complaints = [];

const bad = (res, message) => res.status(400).json({ error: message });

// GET /api/complaints?status=&priority=&q=
app.get("/api/complaints", (req, res) => {
  const { status, priority, q } = req.query;
  if (status && !STATUSES.includes(status)) return bad(res, "invalid status");
  if (priority && !PRIORITIES.includes(priority)) return bad(res, "invalid priority");
  let items = complaints;
  if (status) items = items.filter((c) => c.status === status);
  if (priority) items = items.filter((c) => c.priority === priority);
  if (q) {
    const needle = String(q).toLowerCase();
    items = items.filter(
      (c) => c.customer.toLowerCase().includes(needle) || c.subject.toLowerCase().includes(needle),
    );
  }
  res.json(items);
});

// GET /api/complaints/stats -> { open, in_progress, resolved, total }
app.get("/api/complaints/stats", (_req, res) => {
  const stats = { open: 0, in_progress: 0, resolved: 0, total: complaints.length };
  for (const c of complaints) stats[c.status]++;
  res.json(stats);
});

// POST /api/complaints { customer, subject, priority }
app.post("/api/complaints", (req, res) => {
  const { customer, subject, priority } = req.body ?? {};
  if (typeof customer !== "string" || !customer.trim()) return bad(res, "customer is required");
  if (typeof subject !== "string" || !subject.trim()) return bad(res, "subject is required");
  if (!PRIORITIES.includes(priority)) return bad(res, "invalid priority");
  const complaint = {
    id: randomUUID(),
    customer: customer.trim(),
    subject: subject.trim(),
    priority,
    status: "open",
    createdAt: new Date().toISOString(),
  };
  complaints.unshift(complaint);
  res.status(201).json(complaint);
});

// PATCH /api/complaints/:id/status { status }
app.patch("/api/complaints/:id/status", (req, res) => {
  const complaint = complaints.find((c) => c.id === req.params.id);
  if (!complaint) return res.status(404).json({ error: "not found" });
  const { status } = req.body ?? {};
  if (!STATUSES.includes(status)) return bad(res, "invalid status");
  complaint.status = status;
  res.json(complaint);
});

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
