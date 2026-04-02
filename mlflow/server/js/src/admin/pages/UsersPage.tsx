import { useState } from 'react';
import { Button, PlusIcon, Typography, UserIcon, useDesignSystemTheme } from '@databricks/design-system';
import { FormattedMessage } from 'react-intl';
import { withErrorBoundary } from '../../common/utils/withErrorBoundary';
import ErrorUtils from '../../common/utils/ErrorUtils';
import { useAdminData } from '../hooks/useAdminData';
import { UsersList } from '../components/users/UsersList';
import { AddUserModal } from '../components/users/AddUserModal';
import { DeleteUserModal } from '../components/users/DeleteUserModal';
import { UserPermissionsModal } from '../components/users/UserPermissionsModal';
import type {
  User,
  AddUserFormValues,
  WorkspaceRole,
  GatewayPermissionLevel,
  FeaturePermission,
  FeatureName,
} from '../types';

const UsersPage = () => {
  const { theme } = useDesignSystemTheme();

  const {
    users,
    userPermissions,
    addUser,
    deleteUser,
    updateUserWorkspaceRole,
    updateUserGatewayPermission,
    updateUserFeaturePermission,
  } = useAdminData();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleAddSuccess = (values: AddUserFormValues) => {
    addUser(values);
    setIsAddModalOpen(false);
  };

  const handleDeleteSuccess = (userId: string) => {
    deleteUser(userId);
    setDeletingUser(null);
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
          <FormattedMessage defaultMessage="Users" description="Users management page title" />
        </Typography.Title>
      </div>

      {/* Content */}
      <div css={{ flex: 1, overflow: 'auto', padding: theme.spacing.md }}>
        <UsersList
          users={users}
          onAddClick={() => setIsAddModalOpen(true)}
          onEditPermissionsClick={(user) => setEditingUser(user)}
          onDeleteClick={(user) => setDeletingUser(user)}
        />
      </div>

      {/* Modals */}
      <AddUserModal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={handleAddSuccess} />

      <DeleteUserModal
        open={deletingUser !== null}
        user={deletingUser}
        onClose={() => setDeletingUser(null)}
        onSuccess={handleDeleteSuccess}
      />

      <UserPermissionsModal
        open={editingUser !== null}
        user={editingUser}
        permissions={editingUser ? (userPermissions[editingUser.id] ?? null) : null}
        onClose={() => setEditingUser(null)}
        onWorkspaceRoleChange={(userId: string, role: WorkspaceRole) => updateUserWorkspaceRole(userId, role)}
        onGatewayPermissionChange={(userId: string, endpointId: string, level: GatewayPermissionLevel) =>
          updateUserGatewayPermission(userId, endpointId, level)
        }
        onFeaturePermissionChange={(userId: string, feature: FeatureName, perm: FeaturePermission) =>
          updateUserFeaturePermission(userId, feature, perm)
        }
      />
    </div>
  );
};

export default withErrorBoundary(ErrorUtils.mlflowServices.EXPERIMENTS, UsersPage);
