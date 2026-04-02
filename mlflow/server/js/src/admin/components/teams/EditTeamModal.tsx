import { useEffect, useState } from 'react';
import {
  Button,
  Modal,
  SimpleSelect,
  SimpleSelectOption,
  Table,
  TableCell,
  TableHeader,
  TableRow,
  Tabs,
  Tag,
  TrashIcon,
  Typography,
  PlusIcon,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';
import type {
  Team,
  TeamPermissions,
  User,
  WorkspaceRole,
  GatewayPermissionLevel,
  FeaturePermission,
  FeatureName,
} from '../../types';
import { GatewayPermissionsTable } from '../permissions/GatewayPermissionsTable';
import { FeaturePermissionsTable } from '../permissions/FeaturePermissionsTable';

interface EditTeamModalProps {
  open: boolean;
  team: Team | null;
  permissions: TeamPermissions | null;
  allUsers: User[];
  onClose: () => void;
  onAddMember: (teamId: string, userId: string) => void;
  onRemoveMember: (teamId: string, userId: string) => void;
  onWorkspaceRoleChange: (teamId: string, role: WorkspaceRole) => void;
  onGatewayPermissionChange: (teamId: string, endpointId: string, level: GatewayPermissionLevel) => void;
  onFeaturePermissionChange: (teamId: string, feature: FeatureName, perm: FeaturePermission) => void;
}

export const EditTeamModal = ({
  open,
  team,
  permissions,
  allUsers,
  onClose,
  onAddMember,
  onRemoveMember,
  onWorkspaceRoleChange,
  onGatewayPermissionChange,
  onFeaturePermissionChange,
}: EditTeamModalProps) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const [activeTab, setActiveTab] = useState('members');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  useEffect(() => {
    if (open) {
      setActiveTab('members');
      setSelectedUserId('');
    }
  }, [open]);

  if (!team || !permissions) return null;

  const memberUsers = allUsers.filter((u) => team.members.includes(u.id));
  const nonMemberUsers = allUsers.filter((u) => !team.members.includes(u.id));

  const handleAddMember = () => {
    if (selectedUserId) {
      onAddMember(team.id, selectedUserId);
      setSelectedUserId('');
    }
  };

  return (
    <Modal
      componentId="mlflow.admin.edit-team-modal"
      title={intl.formatMessage(
        { defaultMessage: 'Edit Team: {name}', description: 'Edit team modal title' },
        { name: team.name },
      )}
      visible={open}
      onCancel={onClose}
      onOk={onClose}
      okText={intl.formatMessage({ defaultMessage: 'Done', description: 'Close edit team modal button' })}
      cancelButtonProps={{ style: { display: 'none' } }}
      size="wide"
    >
      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
        <Tabs.Root componentId="mlflow.admin.edit-team-modal.tabs" value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Trigger value="members">
              <FormattedMessage defaultMessage="Members" description="Team members tab" />
            </Tabs.Trigger>
            <Tabs.Trigger value="workspace">
              <FormattedMessage defaultMessage="Workspace Role" description="Team workspace role tab" />
            </Tabs.Trigger>
            <Tabs.Trigger value="gateway">
              <FormattedMessage defaultMessage="Gateway Endpoints" description="Team gateway endpoints tab" />
            </Tabs.Trigger>
            <Tabs.Trigger value="features">
              <FormattedMessage defaultMessage="Feature Permissions" description="Team feature permissions tab" />
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="members">
            <div
              css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md, paddingTop: theme.spacing.md }}
            >
              {nonMemberUsers.length > 0 && (
                <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                  <SimpleSelect
                    id="edit-team-add-member"
                    componentId="mlflow.admin.edit-team-modal.add-member-select"
                    value={selectedUserId}
                    onChange={({ target }) => setSelectedUserId(target.value)}
                    css={{ flex: 1 }}
                  >
                    <SimpleSelectOption value="">
                      {intl.formatMessage({
                        defaultMessage: '— Select a user to add —',
                        description: 'Placeholder for add member select',
                      })}
                    </SimpleSelectOption>
                    {nonMemberUsers.map((u) => (
                      <SimpleSelectOption key={u.id} value={u.id}>
                        {u.username} ({u.email})
                      </SimpleSelectOption>
                    ))}
                  </SimpleSelect>
                  <Button
                    componentId="mlflow.admin.edit-team-modal.add-member-button"
                    type="primary"
                    icon={<PlusIcon />}
                    disabled={!selectedUserId}
                    onClick={handleAddMember}
                  >
                    <FormattedMessage defaultMessage="Add" description="Add member button" />
                  </Button>
                </div>
              )}
              {memberUsers.length > 0 ? (
                <Table
                  scrollable
                  noMinHeight
                  css={{
                    borderLeft: `1px solid ${theme.colors.border}`,
                    borderRight: `1px solid ${theme.colors.border}`,
                    borderTop: `1px solid ${theme.colors.border}`,
                    borderBottom: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.general.borderRadiusBase,
                    overflow: 'hidden',
                  }}
                >
                  <TableRow isHeader>
                    <TableHeader componentId="mlflow.admin.edit-team-modal.member-username-header" css={{ flex: 2 }}>
                      <FormattedMessage defaultMessage="Username" description="Member username column header" />
                    </TableHeader>
                    <TableHeader componentId="mlflow.admin.edit-team-modal.member-email-header" css={{ flex: 3 }}>
                      <FormattedMessage defaultMessage="Email" description="Member email column header" />
                    </TableHeader>
                    <TableHeader componentId="mlflow.admin.edit-team-modal.member-role-header" css={{ flex: 2 }}>
                      <FormattedMessage defaultMessage="Role" description="Member role column header" />
                    </TableHeader>
                    <TableHeader
                      componentId="mlflow.admin.edit-team-modal.member-actions-header"
                      css={{ flex: 0, minWidth: 64, maxWidth: 64 }}
                    />
                  </TableRow>
                  {memberUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell css={{ flex: 2 }}>
                        <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                          <Typography.Text bold>{u.username}</Typography.Text>
                          {u.is_admin && (
                            <Tag componentId="mlflow.admin.edit-team-modal.admin-tag" color="lemon">
                              Admin
                            </Tag>
                          )}
                        </div>
                      </TableCell>
                      <TableCell css={{ flex: 3 }}>
                        <Typography.Text color="secondary">{u.email}</Typography.Text>
                      </TableCell>
                      <TableCell css={{ flex: 2 }}>
                        <Typography.Text>{u.workspace_role}</Typography.Text>
                      </TableCell>
                      <TableCell css={{ flex: 0, minWidth: 64, maxWidth: 64 }}>
                        <Button
                          componentId="mlflow.admin.edit-team-modal.remove-member-button"
                          icon={<TrashIcon />}
                          aria-label={intl.formatMessage(
                            {
                              defaultMessage: 'Remove {username} from team',
                              description: 'Remove member button aria label',
                            },
                            { username: u.username },
                          )}
                          onClick={() => onRemoveMember(team.id, u.id)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </Table>
              ) : (
                <Typography.Text color="secondary">
                  <FormattedMessage
                    defaultMessage="No members yet. Add users above."
                    description="Empty members list message"
                  />
                </Typography.Text>
              )}
            </div>
          </Tabs.Content>

          <Tabs.Content value="workspace">
            <div
              css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md, paddingTop: theme.spacing.md }}
            >
              <Typography.Text color="secondary">
                <FormattedMessage
                  defaultMessage="Set the default workspace role inherited by all team members. Individual overrides can be set per user."
                  description="Team workspace role description"
                />
              </Typography.Text>
              <div css={{ maxWidth: 300 }}>
                <SimpleSelect
                  id="edit-team-workspace-role"
                  componentId="mlflow.admin.edit-team-modal.workspace-role"
                  value={permissions.workspace_role}
                  onChange={({ target }) => onWorkspaceRoleChange(team.id, target.value as WorkspaceRole)}
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
                  defaultMessage="Control which AI Gateway endpoints this team can use or manage. Members inherit these permissions."
                  description="Team gateway permissions description"
                />
              </Typography.Text>
              <GatewayPermissionsTable
                permissions={permissions.gateway_endpoint_permissions}
                onPermissionChange={(endpointId, level) => onGatewayPermissionChange(team.id, endpointId, level)}
              />
            </div>
          </Tabs.Content>

          <Tabs.Content value="features">
            <div
              css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md, paddingTop: theme.spacing.md }}
            >
              <Typography.Text color="secondary">
                <FormattedMessage
                  defaultMessage="Feature permissions granted to all members of this team. Individual user settings can override these."
                  description="Team feature permissions description"
                />
              </Typography.Text>
              <FeaturePermissionsTable
                permissions={permissions.feature_permissions}
                onPermissionChange={(feature, perm) => onFeaturePermissionChange(team.id, feature, perm)}
              />
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </Modal>
  );
};
import { FormattedMessage, useIntl } from 'react-intl';
import type {
  Team,
  TeamPermissions,
  User,
  WorkspaceRole,
  GatewayPermissionLevel,
  FeaturePermission,
  FeatureName,
} from '../../types';
import { GatewayPermissionsTable } from '../permissions/GatewayPermissionsTable';
import { FeaturePermissionsTable } from '../permissions/FeaturePermissionsTable';

interface EditTeamModalProps {
  open: boolean;
  team: Team | null;
  permissions: TeamPermissions | null;
  allUsers: User[];
  onClose: () => void;
  onAddMember: (teamId: string, userId: string) => void;
  onRemoveMember: (teamId: string, userId: string) => void;
  onWorkspaceRoleChange: (teamId: string, role: WorkspaceRole) => void;
  onGatewayPermissionChange: (teamId: string, endpointId: string, level: GatewayPermissionLevel) => void;
  onFeaturePermissionChange: (teamId: string, feature: FeatureName, perm: FeaturePermission) => void;
}

export const EditTeamModal = ({
  open,
  team,
  permissions,
  allUsers,
  onClose,
  onAddMember,
  onRemoveMember,
  onWorkspaceRoleChange,
  onGatewayPermissionChange,
  onFeaturePermissionChange,
}: EditTeamModalProps) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const [activeTab, setActiveTab] = useState('members');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  useEffect(() => {
    if (open) {
      setActiveTab('members');
      setSelectedUserId('');
    }
  }, [open]);

  if (!team || !permissions) return null;

  const memberUsers = allUsers.filter((u) => team.members.includes(u.id));
  const nonMemberUsers = allUsers.filter((u) => !team.members.includes(u.id));

  const handleAddMember = () => {
    if (selectedUserId) {
      onAddMember(team.id, selectedUserId);
      setSelectedUserId('');
    }
  };

  return (
    <Modal
      componentId="mlflow.admin.edit-team-modal"
      title={intl.formatMessage(
        { defaultMessage: 'Edit Team: {name}', description: 'Edit team modal title' },
        { name: team.name },
      )}
      visible={open}
      onCancel={onClose}
      onOk={onClose}
      okText={intl.formatMessage({ defaultMessage: 'Done', description: 'Close edit team modal button' })}
      cancelButtonProps={{ style: { display: 'none' } }}
      size="wide"
    >
      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane
            tab={intl.formatMessage({ defaultMessage: 'Members', description: 'Team members tab' })}
            key="members"
          >
            <div
              css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md, paddingTop: theme.spacing.md }}
            >
              {/* Add member */}
              {nonMemberUsers.length > 0 && (
                <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                  <SimpleSelect
                    id="edit-team-add-member"
                    componentId="mlflow.admin.edit-team-modal.add-member-select"
                    value={selectedUserId}
                    onChange={({ target }) => setSelectedUserId(target.value)}
                    css={{ flex: 1 }}
                  >
                    <SimpleSelectOption value="">
                      {intl.formatMessage({
                        defaultMessage: '— Select a user to add —',
                        description: 'Placeholder for add member select',
                      })}
                    </SimpleSelectOption>
                    {nonMemberUsers.map((u) => (
                      <SimpleSelectOption key={u.id} value={u.id}>
                        {u.username} ({u.email})
                      </SimpleSelectOption>
                    ))}
                  </SimpleSelect>
                  <Button
                    componentId="mlflow.admin.edit-team-modal.add-member-button"
                    type="primary"
                    icon={<PlusIcon />}
                    disabled={!selectedUserId}
                    onClick={handleAddMember}
                  >
                    <FormattedMessage defaultMessage="Add" description="Add member button" />
                  </Button>
                </div>
              )}

              {/* Members table */}
              {memberUsers.length > 0 ? (
                <Table
                  scrollable
                  noMinHeight
                  css={{
                    borderLeft: `1px solid ${theme.colors.border}`,
                    borderRight: `1px solid ${theme.colors.border}`,
                    borderTop: `1px solid ${theme.colors.border}`,
                    borderBottom: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.general.borderRadiusBase,
                    overflow: 'hidden',
                  }}
                >
                  <TableRow isHeader>
                    <TableHeader componentId="mlflow.admin.edit-team-modal.member-username-header" css={{ flex: 2 }}>
                      <FormattedMessage defaultMessage="Username" description="Member username column header" />
                    </TableHeader>
                    <TableHeader componentId="mlflow.admin.edit-team-modal.member-email-header" css={{ flex: 3 }}>
                      <FormattedMessage defaultMessage="Email" description="Member email column header" />
                    </TableHeader>
                    <TableHeader componentId="mlflow.admin.edit-team-modal.member-role-header" css={{ flex: 2 }}>
                      <FormattedMessage defaultMessage="Role" description="Member role column header" />
                    </TableHeader>
                    <TableHeader
                      componentId="mlflow.admin.edit-team-modal.member-actions-header"
                      css={{ flex: 0, minWidth: 64, maxWidth: 64 }}
                    />
                  </TableRow>
                  {memberUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell css={{ flex: 2 }}>
                        <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                          <Typography.Text bold>{u.username}</Typography.Text>
                          {u.is_admin && (
                            <Tag componentId="mlflow.admin.edit-team-modal.admin-tag" color="lemon">
                              Admin
                            </Tag>
                          )}
                        </div>
                      </TableCell>
                      <TableCell css={{ flex: 3 }}>
                        <Typography.Text color="secondary">{u.email}</Typography.Text>
                      </TableCell>
                      <TableCell css={{ flex: 2 }}>
                        <Typography.Text>{u.workspace_role}</Typography.Text>
                      </TableCell>
                      <TableCell css={{ flex: 0, minWidth: 64, maxWidth: 64 }}>
                        <Button
                          componentId="mlflow.admin.edit-team-modal.remove-member-button"
                          icon={<TrashIcon />}
                          aria-label={intl.formatMessage(
                            {
                              defaultMessage: 'Remove {username} from team',
                              description: 'Remove member button aria label',
                            },
                            { username: u.username },
                          )}
                          onClick={() => onRemoveMember(team.id, u.id)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </Table>
              ) : (
                <Typography.Text color="secondary">
                  <FormattedMessage
                    defaultMessage="No members yet. Add users above."
                    description="Empty members list message"
                  />
                </Typography.Text>
              )}
            </div>
          </Tabs.TabPane>

          <Tabs.TabPane
            tab={intl.formatMessage({ defaultMessage: 'Workspace Role', description: 'Team workspace role tab' })}
            key="workspace"
          >
            <div
              css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md, paddingTop: theme.spacing.md }}
            >
              <Typography.Text color="secondary">
                <FormattedMessage
                  defaultMessage="Set the default workspace role inherited by all team members. Individual overrides can be set per user."
                  description="Team workspace role description"
                />
              </Typography.Text>
              <div css={{ maxWidth: 300 }}>
                <SimpleSelect
                  id="edit-team-workspace-role"
                  componentId="mlflow.admin.edit-team-modal.workspace-role"
                  value={permissions.workspace_role}
                  onChange={({ target }) => onWorkspaceRoleChange(team.id, target.value as WorkspaceRole)}
                >
                  <SimpleSelectOption value="admin">Admin – full control</SimpleSelectOption>
                  <SimpleSelectOption value="editor">Editor – can edit experiments and models</SimpleSelectOption>
                  <SimpleSelectOption value="viewer">Viewer – read-only access</SimpleSelectOption>
                  <SimpleSelectOption value="no_permissions">No permissions</SimpleSelectOption>
                </SimpleSelect>
              </div>
            </div>
          </Tabs.TabPane>

          <Tabs.TabPane
            tab={intl.formatMessage({ defaultMessage: 'Gateway Endpoints', description: 'Team gateway endpoints tab' })}
            key="gateway"
          >
            <div
              css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md, paddingTop: theme.spacing.md }}
            >
              <Typography.Text color="secondary">
                <FormattedMessage
                  defaultMessage="Control which AI Gateway endpoints this team can use or manage. Members inherit these permissions."
                  description="Team gateway permissions description"
                />
              </Typography.Text>
              <GatewayPermissionsTable
                permissions={permissions.gateway_endpoint_permissions}
                onPermissionChange={(endpointId, level) => onGatewayPermissionChange(team.id, endpointId, level)}
              />
            </div>
          </Tabs.TabPane>

          <Tabs.TabPane
            tab={intl.formatMessage({
              defaultMessage: 'Feature Permissions',
              description: 'Team feature permissions tab',
            })}
            key="features"
          >
            <div
              css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md, paddingTop: theme.spacing.md }}
            >
              <Typography.Text color="secondary">
                <FormattedMessage
                  defaultMessage="Feature permissions granted to all members of this team. Individual user settings can override these."
                  description="Team feature permissions description"
                />
              </Typography.Text>
              <FeaturePermissionsTable
                permissions={permissions.feature_permissions}
                onPermissionChange={(feature, perm) => onFeaturePermissionChange(team.id, feature, perm)}
              />
            </div>
          </Tabs.TabPane>
        </Tabs>
      </div>
    </Modal>
  );
};
