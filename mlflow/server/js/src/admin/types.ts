/**
 * Type definitions for the User Management (Admin) module.
 *
 * Design Notes:
 * - Users can be assigned roles at the workspace level (admin, viewer, editor)
 * - Permissions for gateway endpoints are scoped per endpoint (can_read, can_write, can_manage)
 * - Feature permissions control access to specific MLflow features
 * - Teams allow batch management of permissions for groups of users
 */

// -------------------------
// Permission Enumerations
// -------------------------

/** Workspace-level roles for a user */
export type WorkspaceRole = 'admin' | 'editor' | 'viewer' | 'no_permissions';

/** Per-resource permission level for gateway endpoints */
export type GatewayPermissionLevel = 'can_read' | 'can_write' | 'can_manage' | 'no_permissions';

/** Feature-flag style permissions for individual MLflow features */
export type FeaturePermission = 'allow' | 'deny' | 'inherit';

// -------------------------
// Core Entities
// -------------------------

export interface User {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
  workspace_role: WorkspaceRole;
  created_at: string;
  last_active_at?: string;
  teams: string[]; // team IDs
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  members: string[]; // user IDs
  created_at: string;
}

// -------------------------
// Permission Records
// -------------------------

export interface GatewayEndpointPermission {
  endpoint_id: string;
  endpoint_name: string;
  permission: GatewayPermissionLevel;
}

/**
 * Represents the available feature flags that can be granted or denied per user/team.
 *
 * Design choices:
 * - `eval_judge_execute`  – Can trigger evaluation / LLM-judge runs
 * - `eval_judge_view`     – Read-only access to evaluation results
 * - `model_registry_write` – Create/update/delete registered models
 * - `experiment_write`    – Log runs and modify experiments
 * - `gateway_admin`       – Full gateway endpoint administration
 */
export type FeatureName =
  | 'eval_judge_execute'
  | 'eval_judge_view'
  | 'model_registry_write'
  | 'experiment_write'
  | 'gateway_admin';

export interface FeaturePermissionRecord {
  feature: FeatureName;
  permission: FeaturePermission;
}

export interface UserPermissions {
  user_id: string;
  workspace_role: WorkspaceRole;
  gateway_endpoint_permissions: GatewayEndpointPermission[];
  feature_permissions: FeaturePermissionRecord[];
}

export interface TeamPermissions {
  team_id: string;
  workspace_role: WorkspaceRole;
  gateway_endpoint_permissions: GatewayEndpointPermission[];
  feature_permissions: FeaturePermissionRecord[];
}

// -------------------------
// UI State Types
// -------------------------

export interface AddUserFormValues {
  username: string;
  email: string;
  workspace_role: WorkspaceRole;
  is_admin: boolean;
}

export interface AddTeamFormValues {
  name: string;
  description: string;
}
