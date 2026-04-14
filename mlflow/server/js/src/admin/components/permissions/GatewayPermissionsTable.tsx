import {
  SimpleSelect,
  SimpleSelectOption,
  Table,
  TableCell,
  TableHeader,
  TableRow,
  Typography,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';
import type { GatewayEndpointPermission, GatewayPermissionLevel } from '../../types';

interface GatewayPermissionsTableProps {
  permissions: GatewayEndpointPermission[];
  onPermissionChange: (endpointId: string, level: GatewayPermissionLevel) => void;
  readOnly?: boolean;
}

const PERMISSION_OPTIONS: Array<{ value: GatewayPermissionLevel; label: string }> = [
  { value: 'no_permissions', label: 'No access' },
  { value: 'can_read', label: 'Read (use endpoint)' },
  { value: 'can_write', label: 'Write (create/edit endpoint)' },
  { value: 'can_manage', label: 'Manage (full control)' },
];

const permissionColor = (level: GatewayPermissionLevel): 'primary' | 'secondary' | 'error' => {
  if (level === 'can_manage') return 'primary';
  if (level === 'no_permissions') return 'secondary';
  return 'primary';
};

export const GatewayPermissionsTable = ({
  permissions,
  onPermissionChange,
  readOnly,
}: GatewayPermissionsTableProps) => {
  const { theme } = useDesignSystemTheme();
  const { formatMessage } = useIntl();

  return (
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
        <TableHeader componentId="mlflow.admin.gateway-perms.endpoint-header" css={{ flex: 2 }}>
          <FormattedMessage
            defaultMessage="Endpoint"
            description="Gateway permissions table - endpoint column header"
          />
        </TableHeader>
        <TableHeader componentId="mlflow.admin.gateway-perms.permission-header" css={{ flex: 2 }}>
          <FormattedMessage
            defaultMessage="Permission"
            description="Gateway permissions table - permission column header"
          />
        </TableHeader>
      </TableRow>
      {permissions.map((ep) => (
        <TableRow key={ep.endpoint_id}>
          <TableCell css={{ flex: 2 }}>
            <Typography.Text bold>{ep.endpoint_name}</Typography.Text>
          </TableCell>
          <TableCell css={{ flex: 2 }}>
            {readOnly ? (
              <Typography.Text color={permissionColor(ep.permission)}>
                {PERMISSION_OPTIONS.find((o) => o.value === ep.permission)?.label ?? ep.permission}
              </Typography.Text>
            ) : (
              <SimpleSelect
                componentId="mlflow.admin.gateway-perms.permission-select"
                value={ep.permission}
                onChange={({ target: { value } }) =>
                  onPermissionChange(ep.endpoint_id, value as GatewayPermissionLevel)
                }
                aria-label={formatMessage(
                  {
                    defaultMessage: 'Permission for {endpoint}',
                    description: 'Aria label for endpoint permission selector',
                  },
                  { endpoint: ep.endpoint_name },
                )}
              >
                {PERMISSION_OPTIONS.map((opt) => (
                  <SimpleSelectOption key={opt.value} value={opt.value}>
                    {opt.label}
                  </SimpleSelectOption>
                ))}
              </SimpleSelect>
            )}
          </TableCell>
        </TableRow>
      ))}
    </Table>
  );
};
