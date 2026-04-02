import { useEffect, useState } from 'react';
import {
  Modal,
  SimpleSelect,
  SimpleSelectOption,
  Tabs,
  Typography,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';
import type {
  User,
  UserPermissions,
  WorkspaceRole,
  GatewayPermissionLevel,
  FeaturePermission,
  FeatureName,
} from '../../types';
import { GatewayPermissionsTable } from '../permissions/GatewayPermissionsTable';
import { FeaturePermissionsTable } from '../permissions/FeaturePermissionsTable';

interface UserPermissionsModalProps {
  open: boolean;
  user: User | null;
  permissions: UserPermissions | null;
  onClose: () => void;
  onWorkspaceRoleChange: (userId: string, role: WorkspaceRole) => void;
  onGatewayPermissionChange: (userId: string, endpointId: string, level: GatewayPermissionLevel) => void;
  onFeaturePermissionChange: (userId: string, feature: FeatureName, perm: FeaturePermission) => void;
}

export const UserPermissionsModal = ({
  open,
  user,
  permissions,
  onClose,
  onWorkspaceRoleChange,
  onGatewayPermissionChange,
  onFeaturePermissionChange,
}: UserPermissionsModalProps) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const [activeTab, setActiveTab] = useState('workspace');

  useEffect(() => {
    if (open) setActiveTab('workspace');
  }, [open]);

  if (!user || !permissions) return null;

  return (
    <Modal
      componentId="mlflow.admin.user-permissions-modal"
      title={intl.formatMessage(
        { defaultMessage: 'Permissions for {username}', description: 'User permissions modal title' },
        { username: user.username },
      )}
      visible={open}
      onCancel={onClose}
      onOk={onClose}
      okText={intl.formatMessage({ defaultMessage: 'Done', description: 'Close permissions modal button' })}
      cancelButtonProps={{ style: { display: 'none' } }}
      size="wide"
    >
      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
        <Tabs.Root
          componentId="mlflow.admin.user-permissions-modal.tabs"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <Tabs.List>
            <Tabs.Trigger value="workspace">
              <FormattedMessage defaultMessage="Workspace Role" description="Workspace role tab" />
            </Tabs.Trigger>
            <Tabs.Trigger value="gateway">
              <FormattedMessage defaultMessage="Gateway Endpoints" description="Gateway endpoints tab" />
            </Tabs.Trigger>
            <Tabs.Trigger value="features">
              <FormattedMessage defaultMessage="Feature Permissions" description="Feature permissions tab" />
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="workspace">
            <div
              css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md, paddingTop: theme.spacing.md }}
            >
              <Typography.Text color="secondary">
                <FormattedMessage
                  defaultMessage="Set the workspace-level role for this user. This controls broad access to all resources."
                  description="Workspace role description"
                />
              </Typography.Text>
              <div css={{ maxWidth: 300 }}>
                <SimpleSelect
                  id="user-permissions-workspace-role"
                  componentId="mlflow.admin.user-permissions-modal.workspace-role"
                  value={permissions.workspace_role}
                  onChange={({ target }) => onWorkspaceRoleChange(user.id, target.value as WorkspaceRole)}
                >
                  <SimpleSelectOption value="admin">Admin – full control</SimpleSelectOption>
                  <SimpleSelectOption value="editor">Editor – can edit experiments and models</SimpleSelectOption>
                  <SimpleSelectOption value="viewer">Viewer – read-only access</SimpleSelectOption>
                  <SimpleSelectOption value="no_permissions">No permissions</SimpleSelectOption>
                </SimpleSelect>
              </div>
            </div>
          </Tabs.Content>

          <Tabs.Content value="gateway">
            <div
              css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md, paddingTop: theme.spacing.md }}
            >
              <Typography.Text color="secondary">
                <FormattedMessage
                  defaultMessage="Control access to individual AI Gateway endpoints. Each endpoint can be independently configured."
                  description="Gateway endpoints permissions description"
                />
              </Typography.Text>
              <GatewayPermissionsTable
                permissions={permissions.gateway_endpoint_permissions}
                onPermissionChange={(endpointId, level) => onGatewayPermissionChange(user.id, endpointId, level)}
              />
            </div>
          </Tabs.Content>

          <Tabs.Content value="features">
            <div
              css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md, paddingTop: theme.spacing.md }}
            >
              <Typography.Text color="secondary">
                <FormattedMessage
                  defaultMessage="Fine-grained feature flags. 'Inherit' means the user receives the permission from their team or workspace role."
                  description="Feature permissions description"
                />
              </Typography.Text>
              <FeaturePermissionsTable
                permissions={permissions.feature_permissions}
                onPermissionChange={(feature, perm) => onFeaturePermissionChange(user.id, feature, perm)}
              />
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </Modal>
  );
};
