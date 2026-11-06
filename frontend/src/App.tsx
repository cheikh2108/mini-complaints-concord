import { useCallback, useEffect, useState, type FormEvent } from "react";
import type {
  Complaint,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStats,
  ComplaintStatus,
} from "../../shared/types";
import { createComplaint, getStats, listComplaints, updateStatus } from "./api";

const STATUS_LABEL: Record<ComplaintStatus, string> = {
  open: "Ouverte",
  in_progress: "En cours",
  resolved: "Résolue",
};
const PRIORITY_LABEL: Record<ComplaintPriority, string> = {
  low: "Basse",
  medium: "Moyenne",
  high: "Haute",
};
const CATEGORY_LABEL: Record<ComplaintCategory, string> = {
  billing: "Facturation",
  delivery: "Livraison",
  product: "Produit",
};
const STATUSES = Object.keys(STATUS_LABEL) as ComplaintStatus[];
const PRIORITIES = Object.keys(PRIORITY_LABEL) as ComplaintPriority[];
const CATEGORIES = Object.keys(CATEGORY_LABEL) as ComplaintCategory[];

const EMPTY_STATS: ComplaintStats = { open: 0, in_progress: 0, resolved: 0, total: 0 };

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });

export default function App() {
  const [items, setItems] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<ComplaintStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fStatus, setFStatus] = useState<ComplaintStatus | "">("");
  const [fPriority, setFPriority] = useState<ComplaintPriority | "">("");
  const [fCategory, setFCategory] = useState<ComplaintCategory | "">("");
  const [search, setSearch] = useState("");

  const [customer, setCustomer] = useState("");
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState<ComplaintPriority>("medium");
  const [category, setCategory] = useState<ComplaintCategory>("product");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [list, s] = await Promise.all([
        listComplaints({
          status: fStatus || undefined,
          priority: fPriority || undefined,
          category: fCategory || undefined,
          q: search.trim() || undefined,
        }),
        getStats(),
      ]);
      setItems(list);
      setStats(s);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [fStatus, fPriority, fCategory, search]);

  useEffect(() => {
    const t = setTimeout(refresh, 200);
    return () => clearTimeout(t);
  }, [refresh]);

  const customerErr = touched && !customer.trim() ? "Le client est obligatoire." : "";
  const subjectErr = touched && !subject.trim() ? "Le sujet est obligatoire." : "";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!customer.trim() || !subject.trim()) return;
    setSubmitting(true);
    try {
      await createComplaint({ customer, subject, priority, category });
      setCustomer("");
      setSubject("");
      setPriority("medium");
      setCategory("product");
      setTouched(false);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onStatus(id: string, status: ComplaintStatus) {
    try {
      await updateStatus(id, status);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="page">
      <header className="header">
        <div className="logo" aria-hidden>
          ✉
        </div>
        <div>
          <h1>Réclamations clients</h1>
          <p>Suivez et traitez les demandes en un coup d&apos;œil.</p>
        </div>
      </header>

      {error && (
        <div className="alert" role="alert">
          <span>{error}</span>
          <button className="link" onClick={() => setError(null)}>
            Fermer
          </button>
        </div>
      )}

      <section className="stats" aria-label="Compteurs">
        <div className="stat stat-total">
          <span className="stat-num">{stats.total}</span>
          <span className="stat-label">Total</span>
        </div>
        {STATUSES.map((s) => (
          <div key={s} className={`stat stat-${s}`}>
            <span className="stat-num">{stats[s]}</span>
            <span className="stat-label">{STATUS_LABEL[s]}</span>
          </div>
        ))}
      </section>

      <main className="layout">
        <form className="card form" onSubmit={onSubmit} noValidate>
          <h2>Nouvelle réclamation</h2>
          <label>
            Client
            <input
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="Ex. Awa Diop"
              aria-invalid={!!customerErr}
            />
            {customerErr && <small className="err">{customerErr}</small>}
          </label>
          <label>
            Sujet
            <textarea
              rows={3}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Décrivez le problème…"
              aria-invalid={!!subjectErr}
            />
            {subjectErr && <small className="err">{subjectErr}</small>}
          </label>
          <label>
            Priorité
            <select value={priority} onChange={(e) => setPriority(e.target.value as ComplaintPriority)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Catégorie
            <select value={category} onChange={(e) => setCategory(e.target.value as ComplaintCategory)}>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABEL[cat]}
                </option>
              ))}
            </select>
          </label>
          <button className="btn" disabled={submitting}>
            {submitting ? "Envoi…" : "Créer la réclamation"}
          </button>
        </form>

        <section className="card list">
          <div className="filters">
            <input
              className="search"
              type="search"
              placeholder="Rechercher un client ou un sujet…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select value={fStatus} onChange={(e) => setFStatus(e.target.value as ComplaintStatus | "")}>
              <option value="">Tous les statuts</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <select
              value={fPriority}
              onChange={(e) => setFPriority(e.target.value as ComplaintPriority | "")}
            >
              <option value="">Toutes priorités</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </option>
              ))}
            </select>
            <select
              value={fCategory}
              onChange={(e) => setFCategory(e.target.value as ComplaintCategory | "")}
              aria-label="Filtrer par catégorie"
            >
              <option value="">Toutes catégories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABEL[cat]}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="empty">Chargement…</p>
          ) : items.length === 0 ? (
            <div className="empty">
              <div className="empty-icon" aria-hidden>
                📭
              </div>
              <strong>Aucune réclamation</strong>
              <span>Créez-en une ou modifiez vos filtres.</span>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Sujet</th>
                    <th>Catégorie</th>
                    <th>Priorité</th>
                    <th>Statut</th>
                    <th>Créée</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((c) => (
                    <tr key={c.id}>
                      <td className="strong">{c.customer}</td>
                      <td className="subject">{c.subject}</td>
                      <td>
                        <span className={`badge c-${c.category}`}>{CATEGORY_LABEL[c.category]}</span>
                      </td>
                      <td>
                        <span className={`badge p-${c.priority}`}>{PRIORITY_LABEL[c.priority]}</span>
                      </td>
                      <td>
                        <select
                          className={`badge-select s-${c.status}`}
                          value={c.status}
                          aria-label={`Statut de ${c.customer}`}
                          onChange={(e) => onStatus(c.id, e.target.value as ComplaintStatus)}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABEL[s]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="muted">{fmtDate(c.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
