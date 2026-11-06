# Mini réclamations clients (test Concord MCP)

Petit projet de test pour essayer Concord MCP avec deux agents de code IA
(Claude Code et Gemini CLI) qui travaillent en même temps sur le même dépôt.

## Le projet

- **API Express** (`backend/`) : créer une réclamation (client, sujet, priorité),
  changer son statut (ouverte, en cours, résolue), lister avec filtres.
- **Page React** (`frontend/`) : formulaire, tableau filtrable, compteurs par statut.
- **Types partagés** (`shared/types.ts`) : utilisés par les deux côtés.

## Répartition

| Agent       | Possède                       |
|-------------|-------------------------------|
| Claude Code | `backend/`, `shared/types.ts` |
| Gemini CLI  | `frontend/`                   |

Toute modification de `shared/types.ts` par Gemini doit être demandée à Claude via Concord.
