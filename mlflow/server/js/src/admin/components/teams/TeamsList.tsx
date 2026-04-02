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
import type { Team, User } from '../../types';

interface TeamsListProps {
  teams: Team[];
  users: User[];
  isLoading?: boolean;
  onAddClick: () => void;
  onEditClick: (team: Team) => void;
  onDeleteClick: (team: Team) => void;
}

export const TeamsList = ({ teams, users, isLoading, onAddClick, onEditClick, onDeleteClick }: TeamsListProps) => {
  const { theme } = useDesignSystemTheme();
  const { formatMessage } = useIntl();

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
        <FormattedMessage defaultMessage="Loading teams..." description="Loading message for teams list" />
      </div>
    );
  }

  return (
    <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
      <div css={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button componentId="mlflow.admin.teams.add-button" type="primary" icon={<PlusIcon />} onClick={onAddClick}>
          <FormattedMessage defaultMessage="Create team" description="Create team button" />
        </Button>
      </div>

      <Table
        scrollable
        noMinHeight
        empty={
          teams.length === 0 ? (
            <Empty
              image={<UserIcon />}
              title={
                <FormattedMessage defaultMessage="No teams created" description="Empty state title for teams list" />
              }
              description={
                <FormattedMessage
                  defaultMessage='Use "Create team" to group users and manage shared permissions'
                  description="Empty state message for teams list"
                />
              }
            />
          ) : null
        }
        css={{
          borderLeft: `1px solid ${theme.colors.border}`,
          borderRight: `1px solid ${theme.colors.border}`,
          borderTop: `1px solid ${theme.colors.border}`,
          borderBottom: teams.length === 0 ? `1px solid ${theme.colors.border}` : 'none',
          borderRadius: theme.general.borderRadiusBase,
          overflow: 'hidden',
        }}
      >
        <TableRow isHeader>
          <TableHeader componentId="mlflow.admin.teams-list.name-header" css={{ flex: 2 }}>
            <FormattedMessage defaultMessage="Team Name" description="Teams list - name column header" />
          </TableHeader>
          <TableHeader componentId="mlflow.admin.teams-list.description-header" css={{ flex: 3 }}>
            <FormattedMessage defaultMessage="Description" description="Teams list - description column header" />
          </TableHeader>
          <TableHeader componentId="mlflow.admin.teams-list.members-header" css={{ flex: 2 }}>
            <FormattedMessage defaultMessage="Members" description="Teams list - members column header" />
          </TableHeader>
          <TableHeader
            componentId="mlflow.admin.teams-list.actions-header"
            css={{ flex: 0, minWidth: 96, maxWidth: 96 }}
          />
        </TableRow>
        {teams.map((team) => {
          const memberUsers = users.filter((u) => team.members.includes(u.id));
          return (
            <TableRow key={team.id}>
              <TableCell css={{ flex: 2 }}>
                <Typography.Text bold>{team.name}</Typography.Text>
              </TableCell>
              <TableCell css={{ flex: 3 }}>
                <Typography.Text color="secondary">{team.description ?? '—'}</Typography.Text>
              </TableCell>
              <TableCell css={{ flex: 2 }}>
                <div css={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                  {memberUsers.slice(0, 3).map((u) => (
                    <Tag key={u.id} componentId="mlflow.admin.teams-list.member-tag" color="blue">
                      {u.username}
                    </Tag>
                  ))}
                  {memberUsers.length > 3 && (
                    <Tag componentId="mlflow.admin.teams-list.more-members-tag" color="default">
                      +{memberUsers.length - 3}
                    </Tag>
                  )}
                  {memberUsers.length === 0 && <Typography.Text color="secondary">—</Typography.Text>}
                </div>
              </TableCell>
              <TableCell css={{ flex: 0, minWidth: 96, maxWidth: 96 }}>
                <div css={{ display: 'flex', gap: theme.spacing.xs }}>
                  <Button
                    componentId="mlflow.admin.teams-list.edit-button"
                    type="primary"
                    icon={<PencilIcon />}
                    aria-label={formatMessage(
                      {
                        defaultMessage: 'Edit team {name}',
                        description: 'Edit team button aria label',
                      },
                      { name: team.name },
                    )}
                    onClick={() => onEditClick(team)}
                  />
                  <Button
                    componentId="mlflow.admin.teams-list.delete-button"
                    type="primary"
                    icon={<TrashIcon />}
                    aria-label={formatMessage(
                      {
                        defaultMessage: 'Delete team {name}',
                        description: 'Delete team button aria label',
                      },
                      { name: team.name },
                    )}
                    onClick={() => onDeleteClick(team)}
                  />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </Table>
    </div>
  );
};
