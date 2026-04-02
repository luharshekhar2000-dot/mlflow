# User Management UI – Design Notes & CUJs

This document captures the design choices, tradeoffs, and critical user journeys (CUJs)
for the User Management mock in `mlflow/server/js/src/admin/`.

---

## 1. Feature Overview

| Feature | Scope |
|---------|-------|
| Add / remove users | Admin can invite or delete workspace members |
| Workspace roles | Admin, Editor, Viewer, No Permissions |
| Gateway endpoint permissions | Per-endpoint: no_permissions / can_read / can_write / can_manage |
| Feature permissions | Fine-grained feature flags with allow / deny / inherit |
| Team management | Create / edit / delete teams; add & remove members |
| Team-based permissions | Gateway & feature permissions set at the team level; members inherit |

---

## 2. Permission Model

### 2a. Workspace Roles

Workspace roles provide a coarse-grained baseline applied to every resource:

| Role | Description |
|------|-------------|
| **Admin** | Full control over all resources and settings |
| **Editor** | Can create, edit, and delete experiments, models, and runs |
| **Viewer** | Read-only access to all resources |
| **No Permissions** | Access denied to everything (useful for service accounts not yet onboarded) |

### 2b. Gateway Endpoint Permissions

Each AI Gateway endpoint supports independent permission levels per principal (user or team):

| Level | Description |
|-------|-------------|
| `can_manage` | Create, update, delete the endpoint; manage its permissions |
| `can_write` | Call the endpoint and update its configuration |
| `can_read` | Use (call) the endpoint; no configuration changes |
| `no_permissions` | No access |

**Design choice – deny-by-default:**
If a user has no explicit permission entry for an endpoint, they are denied by default.
The workspace Admin role overrides all gateway permissions.

### 2c. Feature Permissions

Feature flags can be set to `allow`, `deny`, or `inherit` (inherit from team or workspace role):

| Feature | Description |
|---------|-------------|
| `eval_judge_execute` | Trigger LLM-judge evaluation runs |
| `eval_judge_view` | View evaluation results (read-only) |
| `model_registry_write` | Register, delete, and update models |
| `experiment_write` | Log runs and modify experiment data |
| `gateway_admin` | Administrate gateway endpoints and secrets |

**Design choice – inherit:**
`inherit` means the user falls back to whatever the team(s) or workspace role would grant.
Explicit `allow`/`deny` override inheritance. This avoids needing to duplicate every setting
per user when a team already covers the majority case.

---

## 3. Team-Based vs. User-Centric Permissions

### Option A (current mock): Two-layer model
- Teams hold a default workspace role, gateway permissions, and feature permissions.
- A user's **effective** permission is the union (most-permissive) of all teams they belong to,
  plus any user-level overrides.
- User-level `deny` always wins over team-level `allow`.

### Option B: RBAC with custom roles
- Define named roles (e.g. "Gateway Operator", "ML Researcher") with preset permission bundles.
- Assign roles to users or teams.
- Pros: easier audit; cons: more up-front configuration.

### Option C: Attribute-based (ABAC)
- Attach labels (e.g. `team:ml-eng`, `project:llm-eval`) to resources and users.
- Access controlled by policy rules referencing labels.
- Pros: very flexible; cons: complex to understand / debug.

**Recommendation for MVP:** Option A (two-layer). It's the simplest to implement and reason about
while supporting both team-based and individual management.

---

## 4. Critical User Journeys (CUJs)

### CUJ 1 – Admin onboards a new ML Engineer

1. Navigate to **User Management** in the sidebar.
2. On the **Users** tab, click **Add User**.
3. Fill in username, email; set workspace role to *Editor*; click **Add**.
4. In the users table, click the **Edit Permissions** pencil icon for the new user.
5. Switch to the **Gateway Endpoints** tab; grant `can_write` to the relevant endpoints.
6. Switch to the **Feature Permissions** tab; set `eval_judge_execute` to *Allow*.
7. Click **Done**. The user now has the correct access.

### CUJ 2 – Admin creates an ML Engineers team and bulk-assigns permissions

1. Navigate to **User Management → Teams** tab.
2. Click **Create Team**; enter "ML Engineers" as name; click **Create**.
3. Click the **Edit** icon on the new team.
4. In the **Members** tab: select "bob", click **Add**; repeat for "carol".
5. Switch to **Workspace Role** tab; set to *Editor*.
6. Switch to **Gateway Endpoints** tab; grant `can_write` to the `gpt-4o` endpoint.
7. Switch to **Feature Permissions** tab; allow `eval_judge_execute` and `model_registry_write`.
8. Click **Done**. Both bob and carol now inherit the team's permissions.

### CUJ 3 – Admin revokes access for a departed employee

1. Navigate to **User Management → Users** tab.
2. Locate the user (e.g. "david") via search.
3. Click the **Delete** (trash) icon; confirm in the modal.
4. David is removed from all teams and loses all access immediately.

### CUJ 4 – Admin gives a contractor view-only Eval Judge access

1. Navigate to **Users** tab; click **Add User**.
2. Set workspace role to *Viewer*; click **Add**.
3. Click the **Edit Permissions** icon for the contractor.
4. Under **Feature Permissions**, set `eval_judge_view` to *Allow* and `eval_judge_execute` to *Deny*.
5. Under **Gateway Endpoints**, grant `can_read` only to the endpoint(s) needed for review.
6. Click **Done**.

### CUJ 5 – Admin limits a team's gateway access to a single endpoint

1. Navigate to **Teams** tab; click **Edit** on the relevant team.
2. Under **Gateway Endpoints**, set all endpoints to `no_permissions`.
3. Set only the target endpoint to `can_read`.
4. Click **Done**. All team members now only have read access to that one endpoint.

---

## 5. Additional Design Considerations

### Audit log
A production implementation should record every permission change with:
- Who made the change (admin username)
- What changed (resource, old value, new value)
- Timestamp

### Bulk operations
The current mock supports individual user/team edits. A future enhancement could add:
- Multi-select users → apply role in bulk
- CSV import of users

### Role inheritance precedence
Recommended precedence (highest to lowest):
1. Explicit user-level `deny`
2. Explicit user-level `allow`
3. Team-level permissions (union of all teams)
4. Workspace role baseline

### Separation of duties
Admins should not be able to escalate their own privileges beyond their current role
(prevent privilege escalation via self-edit). The UI should disable editing one's own
admin checkbox; the backend enforces this too.

### Pagination & search
The current mock loads all users/teams in memory. A production API should support:
- Server-side pagination (page token pattern already used elsewhere in MLflow)
- Server-side search/filter

---

## 6. File Map

```
mlflow/server/js/src/admin/
├── types.ts                          – Type definitions
├── routes.ts                          – Route paths & route helper class
├── route-defs.ts                      – React Router route definitions
├── hooks/
│   └── useAdminData.ts               – Mock data hook (replace with API calls)
├── pages/
│   ├── AdminPage.tsx                  – Root admin page (tabs: Users / Teams)
│   ├── UsersPage.tsx                  – Users management tab
│   └── TeamsPage.tsx                  – Teams management tab
└── components/
    ├── permissions/
    │   ├── GatewayPermissionsTable.tsx – Per-endpoint permission selector table
    │   └── FeaturePermissionsTable.tsx – Per-feature permission selector table
    ├── users/
    │   ├── UsersList.tsx               – Searchable users table
    │   ├── AddUserModal.tsx            – Add new user form
    │   ├── DeleteUserModal.tsx         – Confirm delete user
    │   └── UserPermissionsModal.tsx   – Tabbed permissions editor (workspace / gateway / features)
    └── teams/
        ├── TeamsList.tsx               – Teams table
        ├── AddTeamModal.tsx            – Create team form
        ├── DeleteTeamModal.tsx         – Confirm delete team
        └── EditTeamModal.tsx          – Tabbed team editor (members / workspace / gateway / features)
```
