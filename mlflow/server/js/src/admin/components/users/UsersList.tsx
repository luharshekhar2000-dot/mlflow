import { useState } from 'react';
import {
  Button,
  Empty,
  PencilIcon,
  PlusIcon,
  Spinner,
  Table,
  TableCell,
  TableHeader,
  TableRow,
  Tag,
  TrashIcon,
  Typography,
  UserIcon,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';
import type { User } from '../../types';

interface UsersListProps {
  users: User[];
  isLoading?: boolean;
  onAddClick: () => void;
  onEditPermissionsClick: (user: User) => void;
  onDeleteClick: (user: User) => void;
}

const ROLE_TAG_COLORS = {
  admin: 'lemon',
  editor: 'indigo',
  viewer: 'blue',
  no_permissions: 'default',
} satisfies Record<string, 'default' | 'lemon' | 'indigo' | 'blue' | 'red'>;

const formatRole = (role: string) => {
  const map: Record<string, string> = {
    admin: 'Admin',
    editor: 'Editor',
    viewer: 'Viewer',
    no_permissions: 'No Permissions',
  };
  return map[role] ?? role;
};

export const UsersList = ({ users, isLoading, onAddClick, onEditPermissionsClick, onDeleteClick }: UsersListProps) => {
  const { theme } = useDesignSystemTheme();
  const { formatMessage } = useIntl();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div
        css={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.spacing.sm,
          padding: theme.spacing.lg,
          minHeight: 200,
        }}
      >
        <Spinner size="small" />
        <FormattedMessage defaultMessage="Loading users..." description="Loading message for users list" />
      </div>
    );
  }

  return (
    <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
      <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
        <input
          type="search"
          placeholder={formatMessage({ defaultMessage: 'Search users…', description: 'Users list search placeholder' })}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          css={{
            flex: 1,
            padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borders.borderRadiusSm,
            fontSize: theme.typography.fontSizeBase,
            outline: 'none',
            '&:focus': { borderColor: theme.colors.actionPrimaryBackgroundDefault },
          }}
        />
        <Button componentId="mlflow.admin.users.add-button" type="primary" icon={<PlusIcon />} onClick={onAddClick}>
          <FormattedMessage defaultMessage="Add user" description="Add user button" />
        </Button>
      </div>

      <Table
        scrollable
        noMinHeight
        empty={
          filtered.length === 0 ? (
            <Empty
              image={<UserIcon />}
              title={<FormattedMessage defaultMessage="No users found" description="Empty state for users list" />}
              description={
                searchQuery ? (
                  <FormattedMessage
                    defaultMessage="No users match your search"
                    description="Empty state when search returns no results"
                  />
                ) : (
                  <FormattedMessage
                    defaultMessage='Use the "Add user" button to invite users'
                    description="Empty state message for users list"
                  />
                )
              }
            />
          ) : null
        }
        css={{
          borderLeft: `1px solid ${theme.colors.border}`,
          borderRight: `1px solid ${theme.colors.border}`,
          borderTop: `1px solid ${theme.colors.border}`,
          borderBottom: filtered.length === 0 ? `1px solid ${theme.colors.border}` : 'none',
          borderRadius: theme.general.borderRadiusBase,
          overflow: 'hidden',
        }}
      >
        <TableRow isHeader>
          <TableHeader componentId="mlflow.admin.users-list.username-header" css={{ flex: 2 }}>
            <FormattedMessage defaultMessage="Username" description="Users list - username column header" />
          </TableHeader>
          <TableHeader componentId="mlflow.admin.users-list.email-header" css={{ flex: 3 }}>
            <FormattedMessage defaultMessage="Email" description="Users list - email column header" />
          </TableHeader>
          <TableHeader componentId="mlflow.admin.users-list.role-header" css={{ flex: 2 }}>
            <FormattedMessage defaultMessage="Workspace Role" description="Users list - workspace role column header" />
          </TableHeader>
          <TableHeader componentId="mlflow.admin.users-list.teams-header" css={{ flex: 2 }}>
            <FormattedMessage defaultMessage="Teams" description="Users list - teams column header" />
          </TableHeader>
          <TableHeader
            componentId="mlflow.admin.users-list.actions-header"
            css={{ flex: 0, minWidth: 96, maxWidth: 96 }}
          />
        </TableRow>
        {filtered.map((user) => (
          <TableRow key={user.id}>
            <TableCell css={{ flex: 2 }}>
              <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                <Typography.Text bold>{user.username}</Typography.Text>
                {user.is_admin && (
                  <Tag
                    componentId="mlflow.admin.users-list.admin-tag"
                    color="lemon"
                    css={{ fontSize: theme.typography.fontSizeSm }}
                  >
                    <FormattedMessage defaultMessage="Admin" description="Admin badge on users list" />
                  </Tag>
                )}
              </div>
            </TableCell>
            <TableCell css={{ flex: 3 }}>
              <Typography.Text color="secondary">{user.email}</Typography.Text>
            </TableCell>
            <TableCell css={{ flex: 2 }}>
              <Tag
                componentId="mlflow.admin.users-list.role-tag"
                color={ROLE_TAG_COLORS[user.workspace_role] ?? 'default'}
              >
                {formatRole(user.workspace_role)}
              </Tag>
            </TableCell>
            <TableCell css={{ flex: 2 }}>
              <Typography.Text color="secondary">
                {user.teams.length > 0 ? `${user.teams.length} team(s)` : '—'}
              </Typography.Text>
            </TableCell>
            <TableCell css={{ flex: 0, minWidth: 96, maxWidth: 96 }}>
              <div css={{ display: 'flex', gap: theme.spacing.xs }}>
                <Button
                  componentId="mlflow.admin.users-list.edit-button"
                  type="primary"
                  icon={<PencilIcon />}
                  aria-label={formatMessage(
                    {
                      defaultMessage: 'Edit permissions for {username}',
                      description: 'Edit user permissions button aria label',
                    },
                    { username: user.username },
                  )}
                  onClick={() => onEditPermissionsClick(user)}
                />
                <Button
                  componentId="mlflow.admin.users-list.delete-button"
                  type="primary"
                  icon={<TrashIcon />}
                  aria-label={formatMessage(
                    { defaultMessage: 'Delete user {username}', description: 'Delete user button aria label' },
                    { username: user.username },
                  )}
                  onClick={() => onDeleteClick(user)}
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  );
};
