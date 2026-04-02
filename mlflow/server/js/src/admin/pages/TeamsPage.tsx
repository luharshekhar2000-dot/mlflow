import { useState } from 'react';
import { Typography, UserIcon, useDesignSystemTheme } from '@databricks/design-system';
import { FormattedMessage } from 'react-intl';
import { withErrorBoundary } from '../../common/utils/withErrorBoundary';
import ErrorUtils from '../../common/utils/ErrorUtils';
import { useAdminData } from '../hooks/useAdminData';
import { TeamsList } from '../components/teams/TeamsList';
import { AddTeamModal } from '../components/teams/AddTeamModal';
import { DeleteTeamModal } from '../components/teams/DeleteTeamModal';
import { EditTeamModal } from '../components/teams/EditTeamModal';
import type {
  Team,
  AddTeamFormValues,
  WorkspaceRole,
  GatewayPermissionLevel,
  FeaturePermission,
  FeatureName,
} from '../types';

const TeamsPage = () => {
  const { theme } = useDesignSystemTheme();

  const {
    users,
    teams,
    teamPermissions,
    addTeam,
    deleteTeam,
    addTeamMember,
    removeTeamMember,
    updateTeamWorkspaceRole,
    updateTeamGatewayPermission,
    updateTeamFeaturePermission,
  } = useAdminData();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const handleAddSuccess = (values: AddTeamFormValues) => {
    addTeam(values);
    setIsAddModalOpen(false);
  };

  const handleDeleteSuccess = (teamId: string) => {
    deleteTeam(teamId);
    setDeletingTeam(null);
  };

  return (
    <div css={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Header */}
      <div
        css={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: theme.spacing.md,
          borderBottom: `1px solid ${theme.colors.borderDecorative}`,
        }}
      >
        <Typography.Title level={3} css={{ margin: 0, display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
          <UserIcon />
          <FormattedMessage defaultMessage="Teams" description="Teams management page title" />
        </Typography.Title>
      </div>

      {/* Content */}
      <div css={{ flex: 1, overflow: 'auto', padding: theme.spacing.md }}>
        <TeamsList
          teams={teams}
          users={users}
          onAddClick={() => setIsAddModalOpen(true)}
          onEditClick={(team) => setEditingTeam(team)}
          onDeleteClick={(team) => setDeletingTeam(team)}
        />
      </div>

      {/* Modals */}
      <AddTeamModal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={handleAddSuccess} />

      <DeleteTeamModal
        open={deletingTeam !== null}
        team={deletingTeam}
        onClose={() => setDeletingTeam(null)}
        onSuccess={handleDeleteSuccess}
      />

      <EditTeamModal
        open={editingTeam !== null}
        team={editingTeam}
        permissions={editingTeam ? (teamPermissions[editingTeam.id] ?? null) : null}
        allUsers={users}
        onClose={() => setEditingTeam(null)}
        onAddMember={(teamId: string, userId: string) => addTeamMember(teamId, userId)}
        onRemoveMember={(teamId: string, userId: string) => removeTeamMember(teamId, userId)}
        onWorkspaceRoleChange={(teamId: string, role: WorkspaceRole) => updateTeamWorkspaceRole(teamId, role)}
        onGatewayPermissionChange={(teamId: string, endpointId: string, level: GatewayPermissionLevel) =>
          updateTeamGatewayPermission(teamId, endpointId, level)
        }
        onFeaturePermissionChange={(teamId: string, feature: FeatureName, perm: FeaturePermission) =>
          updateTeamFeaturePermission(teamId, feature, perm)
        }
      />
    </div>
  );
};

export default withErrorBoundary(ErrorUtils.mlflowServices.EXPERIMENTS, TeamsPage);
