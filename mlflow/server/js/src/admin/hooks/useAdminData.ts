/**
 * Mock data and hook for the User Management (Admin) module.
 *
 * In a real implementation these would be replaced with API calls to the MLflow
 * auth backend (e.g. /api/2.0/mlflow/users/list, etc.).
 */

import { useState } from 'react';
import type {
  User,
  Team,
  UserPermissions,
  TeamPermissions,
  WorkspaceRole,
  GatewayPermissionLevel,
  FeaturePermission,
  FeatureName,
  AddUserFormValues,
  AddTeamFormValues,
} from '../types';

// -------------------------
// Seed / Mock data
// -------------------------

const MOCK_USERS: User[] = [
  {
    id: 'u1',
    username: 'alice',
    email: 'alice@example.com',
    is_admin: true,
    workspace_role: 'admin',
    created_at: '2024-01-10T09:00:00Z',
    last_active_at: '2024-04-01T14:23:00Z',
    teams: ['t1'],
  },
  {
    id: 'u2',
    username: 'bob',
    email: 'bob@example.com',
    is_admin: false,
    workspace_role: 'editor',
    created_at: '2024-02-14T11:00:00Z',
    last_active_at: '2024-03-28T09:12:00Z',
    teams: ['t1', 't2'],
  },
  {
    id: 'u3',
    username: 'carol',
    email: 'carol@example.com',
    is_admin: false,
    workspace_role: 'viewer',
    created_at: '2024-03-01T08:00:00Z',
    teams: ['t2'],
  },
  {
    id: 'u4',
    username: 'david',
    email: 'david@example.com',
    is_admin: false,
    workspace_role: 'no_permissions',
    created_at: '2024-03-20T16:00:00Z',
    teams: [],
  },
];

const MOCK_TEAMS: Team[] = [
  {
    id: 't1',
    name: 'ML Engineers',
    description: 'Core machine-learning engineering team',
    members: ['u1', 'u2'],
    created_at: '2024-01-05T08:00:00Z',
  },
  {
    id: 't2',
    name: 'Data Science',
    description: 'Data science research team',
    members: ['u2', 'u3'],
    created_at: '2024-02-01T08:00:00Z',
  },
];

const MOCK_USER_PERMISSIONS: Record<string, UserPermissions> = {
  u1: {
    user_id: 'u1',
    workspace_role: 'admin',
    gateway_endpoint_permissions: [
      { endpoint_id: 'ep1', endpoint_name: 'gpt-4o', permission: 'can_manage' },
      { endpoint_id: 'ep2', endpoint_name: 'claude-3-sonnet', permission: 'can_manage' },
      { endpoint_id: 'ep3', endpoint_name: 'llama-3', permission: 'can_manage' },
    ],
    feature_permissions: [
      { feature: 'eval_judge_execute', permission: 'allow' },
      { feature: 'eval_judge_view', permission: 'allow' },
      { feature: 'model_registry_write', permission: 'allow' },
      { feature: 'experiment_write', permission: 'allow' },
      { feature: 'gateway_admin', permission: 'allow' },
    ],
  },
  u2: {
    user_id: 'u2',
    workspace_role: 'editor',
    gateway_endpoint_permissions: [
      { endpoint_id: 'ep1', endpoint_name: 'gpt-4o', permission: 'can_write' },
      { endpoint_id: 'ep2', endpoint_name: 'claude-3-sonnet', permission: 'can_read' },
      { endpoint_id: 'ep3', endpoint_name: 'llama-3', permission: 'no_permissions' },
    ],
    feature_permissions: [
      { feature: 'eval_judge_execute', permission: 'allow' },
      { feature: 'eval_judge_view', permission: 'allow' },
      { feature: 'model_registry_write', permission: 'allow' },
      { feature: 'experiment_write', permission: 'allow' },
      { feature: 'gateway_admin', permission: 'deny' },
    ],
  },
  u3: {
    user_id: 'u3',
    workspace_role: 'viewer',
    gateway_endpoint_permissions: [
      { endpoint_id: 'ep1', endpoint_name: 'gpt-4o', permission: 'can_read' },
      { endpoint_id: 'ep2', endpoint_name: 'claude-3-sonnet', permission: 'no_permissions' },
      { endpoint_id: 'ep3', endpoint_name: 'llama-3', permission: 'no_permissions' },
    ],
    feature_permissions: [
      { feature: 'eval_judge_execute', permission: 'deny' },
      { feature: 'eval_judge_view', permission: 'allow' },
      { feature: 'model_registry_write', permission: 'deny' },
      { feature: 'experiment_write', permission: 'deny' },
      { feature: 'gateway_admin', permission: 'deny' },
    ],
  },
  u4: {
    user_id: 'u4',
    workspace_role: 'no_permissions',
    gateway_endpoint_permissions: [
      { endpoint_id: 'ep1', endpoint_name: 'gpt-4o', permission: 'no_permissions' },
      { endpoint_id: 'ep2', endpoint_name: 'claude-3-sonnet', permission: 'no_permissions' },
      { endpoint_id: 'ep3', endpoint_name: 'llama-3', permission: 'no_permissions' },
    ],
    feature_permissions: [
      { feature: 'eval_judge_execute', permission: 'deny' },
      { feature: 'eval_judge_view', permission: 'deny' },
      { feature: 'model_registry_write', permission: 'deny' },
      { feature: 'experiment_write', permission: 'deny' },
      { feature: 'gateway_admin', permission: 'deny' },
    ],
  },
};

const MOCK_TEAM_PERMISSIONS: Record<string, TeamPermissions> = {
  t1: {
    team_id: 't1',
    workspace_role: 'editor',
    gateway_endpoint_permissions: [
      { endpoint_id: 'ep1', endpoint_name: 'gpt-4o', permission: 'can_write' },
      { endpoint_id: 'ep2', endpoint_name: 'claude-3-sonnet', permission: 'can_read' },
      { endpoint_id: 'ep3', endpoint_name: 'llama-3', permission: 'can_read' },
    ],
    feature_permissions: [
      { feature: 'eval_judge_execute', permission: 'allow' },
      { feature: 'eval_judge_view', permission: 'allow' },
      { feature: 'model_registry_write', permission: 'allow' },
      { feature: 'experiment_write', permission: 'allow' },
      { feature: 'gateway_admin', permission: 'deny' },
    ],
  },
  t2: {
    team_id: 't2',
    workspace_role: 'viewer',
    gateway_endpoint_permissions: [
      { endpoint_id: 'ep1', endpoint_name: 'gpt-4o', permission: 'can_read' },
      { endpoint_id: 'ep2', endpoint_name: 'claude-3-sonnet', permission: 'can_read' },
      { endpoint_id: 'ep3', endpoint_name: 'llama-3', permission: 'no_permissions' },
    ],
    feature_permissions: [
      { feature: 'eval_judge_execute', permission: 'deny' },
      { feature: 'eval_judge_view', permission: 'allow' },
      { feature: 'model_registry_write', permission: 'deny' },
      { feature: 'experiment_write', permission: 'deny' },
      { feature: 'gateway_admin', permission: 'deny' },
    ],
  },
};

// -------------------------
// Mock hook
// -------------------------

export const useAdminData = () => {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [teams, setTeams] = useState<Team[]>(MOCK_TEAMS);
  const [userPermissions, setUserPermissions] = useState<Record<string, UserPermissions>>(MOCK_USER_PERMISSIONS);
  const [teamPermissions, setTeamPermissions] = useState<Record<string, TeamPermissions>>(MOCK_TEAM_PERMISSIONS);

  // ---------- User CRUD ----------

  const addUser = (form: AddUserFormValues) => {
    const newUser: User = {
      id: `u${Date.now()}`,
      username: form.username,
      email: form.email,
      is_admin: form.is_admin,
      workspace_role: form.workspace_role,
      created_at: new Date().toISOString(),
      teams: [],
    };
    const defaultPerms: UserPermissions = {
      user_id: newUser.id,
      workspace_role: form.workspace_role,
      gateway_endpoint_permissions: [
        { endpoint_id: 'ep1', endpoint_name: 'gpt-4o', permission: 'no_permissions' },
        { endpoint_id: 'ep2', endpoint_name: 'claude-3-sonnet', permission: 'no_permissions' },
        { endpoint_id: 'ep3', endpoint_name: 'llama-3', permission: 'no_permissions' },
      ],
      feature_permissions: [
        { feature: 'eval_judge_execute', permission: 'inherit' },
        { feature: 'eval_judge_view', permission: 'inherit' },
        { feature: 'model_registry_write', permission: 'inherit' },
        { feature: 'experiment_write', permission: 'inherit' },
        { feature: 'gateway_admin', permission: 'deny' },
      ],
    };
    setUsers((prev) => [...prev, newUser]);
    setUserPermissions((prev) => ({ ...prev, [newUser.id]: defaultPerms }));
  };

  const deleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setTeams((prev) =>
      prev.map((t) => ({
        ...t,
        members: t.members.filter((id) => id !== userId),
      })),
    );
    setUserPermissions((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  };

  const updateUserWorkspaceRole = (userId: string, role: WorkspaceRole) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, workspace_role: role } : u)));
    setUserPermissions((prev) =>
      prev[userId] ? { ...prev, [userId]: { ...prev[userId], workspace_role: role } } : prev,
    );
  };

  const updateUserGatewayPermission = (userId: string, endpointId: string, level: GatewayPermissionLevel) => {
    setUserPermissions((prev) => {
      if (!prev[userId]) return prev;
      return {
        ...prev,
        [userId]: {
          ...prev[userId],
          gateway_endpoint_permissions: prev[userId].gateway_endpoint_permissions.map((ep) =>
            ep.endpoint_id === endpointId ? { ...ep, permission: level } : ep,
          ),
        },
      };
    });
  };

  const updateUserFeaturePermission = (userId: string, feature: FeatureName, perm: FeaturePermission) => {
    setUserPermissions((prev) => {
      if (!prev[userId]) return prev;
      return {
        ...prev,
        [userId]: {
          ...prev[userId],
          feature_permissions: prev[userId].feature_permissions.map((fp) =>
            fp.feature === feature ? { ...fp, permission: perm } : fp,
          ),
        },
      };
    });
  };

  // ---------- Team CRUD ----------

  const addTeam = (form: AddTeamFormValues) => {
    const newTeam: Team = {
      id: `t${Date.now()}`,
      name: form.name,
      description: form.description,
      members: [],
      created_at: new Date().toISOString(),
    };
    const defaultPerms: TeamPermissions = {
      team_id: newTeam.id,
      workspace_role: 'viewer',
      gateway_endpoint_permissions: [
        { endpoint_id: 'ep1', endpoint_name: 'gpt-4o', permission: 'no_permissions' },
        { endpoint_id: 'ep2', endpoint_name: 'claude-3-sonnet', permission: 'no_permissions' },
        { endpoint_id: 'ep3', endpoint_name: 'llama-3', permission: 'no_permissions' },
      ],
      feature_permissions: [
        { feature: 'eval_judge_execute', permission: 'inherit' },
        { feature: 'eval_judge_view', permission: 'inherit' },
        { feature: 'model_registry_write', permission: 'inherit' },
        { feature: 'experiment_write', permission: 'inherit' },
        { feature: 'gateway_admin', permission: 'deny' },
      ],
    };
    setTeams((prev) => [...prev, newTeam]);
    setTeamPermissions((prev) => ({ ...prev, [newTeam.id]: defaultPerms }));
  };

  const deleteTeam = (teamId: string) => {
    setTeams((prev) => prev.filter((t) => t.id !== teamId));
    setUsers((prev) => prev.map((u) => ({ ...u, teams: u.teams.filter((id) => id !== teamId) })));
    setTeamPermissions((prev) => {
      const next = { ...prev };
      delete next[teamId];
      return next;
    });
  };

  const addTeamMember = (teamId: string, userId: string) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId && !t.members.includes(userId) ? { ...t, members: [...t.members, userId] } : t)),
    );
    setUsers((prev) =>
      prev.map((u) => (u.id === userId && !u.teams.includes(teamId) ? { ...u, teams: [...u.teams, teamId] } : u)),
    );
  };

  const removeTeamMember = (teamId: string, userId: string) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, members: t.members.filter((id) => id !== userId) } : t)),
    );
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, teams: u.teams.filter((id) => id !== teamId) } : u)));
  };

  const updateTeamGatewayPermission = (teamId: string, endpointId: string, level: GatewayPermissionLevel) => {
    setTeamPermissions((prev) => {
      if (!prev[teamId]) return prev;
      return {
        ...prev,
        [teamId]: {
          ...prev[teamId],
          gateway_endpoint_permissions: prev[teamId].gateway_endpoint_permissions.map((ep) =>
            ep.endpoint_id === endpointId ? { ...ep, permission: level } : ep,
          ),
        },
      };
    });
  };

  const updateTeamFeaturePermission = (teamId: string, feature: FeatureName, perm: FeaturePermission) => {
    setTeamPermissions((prev) => {
      if (!prev[teamId]) return prev;
      return {
        ...prev,
        [teamId]: {
          ...prev[teamId],
          feature_permissions: prev[teamId].feature_permissions.map((fp) =>
            fp.feature === feature ? { ...fp, permission: perm } : fp,
          ),
        },
      };
    });
  };

  const updateTeamWorkspaceRole = (teamId: string, role: WorkspaceRole) => {
    setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t } : t)));
    setTeamPermissions((prev) =>
      prev[teamId] ? { ...prev, [teamId]: { ...prev[teamId], workspace_role: role } } : prev,
    );
  };

  return {
    users,
    teams,
    userPermissions,
    teamPermissions,
    addUser,
    deleteUser,
    updateUserWorkspaceRole,
    updateUserGatewayPermission,
    updateUserFeaturePermission,
    addTeam,
    deleteTeam,
    addTeamMember,
    removeTeamMember,
    updateTeamGatewayPermission,
    updateTeamFeaturePermission,
    updateTeamWorkspaceRole,
  };
};
