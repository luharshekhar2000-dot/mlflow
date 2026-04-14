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
import type { FeaturePermission, FeaturePermissionRecord, FeatureName } from '../../types';

interface FeaturePermissionsTableProps {
  permissions: FeaturePermissionRecord[];
  onPermissionChange: (feature: FeatureName, perm: FeaturePermission) => void;
  readOnly?: boolean;
}

const FEATURE_LABELS: Record<FeatureName, string> = {
  eval_judge_execute: 'Execute Eval Judge',
  eval_judge_view: 'View Eval Results',
  model_registry_write: 'Model Registry (write)',
  experiment_write: 'Experiment Tracking (write)',
  gateway_admin: 'AI Gateway Administration',
};

const FEATURE_DESCRIPTIONS: Record<FeatureName, string> = {
  eval_judge_execute: 'Trigger LLM-judge evaluation runs',
  eval_judge_view: 'Read-only access to evaluation results',
  model_registry_write: 'Create, update, and delete registered models',
  experiment_write: 'Log runs and modify experiment metadata',
  gateway_admin: 'Full administration of AI Gateway endpoints and secrets',
};

const PERMISSION_OPTIONS: Array<{ value: FeaturePermission; label: string }> = [
  { value: 'inherit', label: 'Inherit (from team/workspace)' },
  { value: 'allow', label: 'Allow' },
  { value: 'deny', label: 'Deny' },
];

const permissionColor = (perm: FeaturePermission): 'primary' | 'secondary' | 'error' => {
  if (perm === 'allow') return 'primary';
  if (perm === 'deny') return 'error';
  return 'secondary';
};

export const FeaturePermissionsTable = ({
  permissions,
  onPermissionChange,
  readOnly,
}: FeaturePermissionsTableProps) => {
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
        <TableHeader componentId="mlflow.admin.feature-perms.feature-header" css={{ flex: 3 }}>
          <FormattedMessage defaultMessage="Feature" description="Feature permissions table - feature column header" />
        </TableHeader>
        <TableHeader componentId="mlflow.admin.feature-perms.permission-header" css={{ flex: 2 }}>
          <FormattedMessage
            defaultMessage="Permission"
            description="Feature permissions table - permission column header"
          />
        </TableHeader>
      </TableRow>
      {permissions.map((fp) => (
        <TableRow key={fp.feature}>
          <TableCell css={{ flex: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography.Text bold>{FEATURE_LABELS[fp.feature]}</Typography.Text>
            <Typography.Text size="sm" color="secondary">
              {FEATURE_DESCRIPTIONS[fp.feature]}
            </Typography.Text>
          </TableCell>
          <TableCell css={{ flex: 2 }}>
            {readOnly ? (
              <Typography.Text color={permissionColor(fp.permission)}>
                {PERMISSION_OPTIONS.find((o) => o.value === fp.permission)?.label ?? fp.permission}
              </Typography.Text>
            ) : (
              <SimpleSelect
                componentId="mlflow.admin.feature-perms.permission-select"
                value={fp.permission}
                onChange={({ target: { value } }) => onPermissionChange(fp.feature, value as FeaturePermission)}
                aria-label={formatMessage(
                  {
                    defaultMessage: 'Permission for {feature}',
                    description: 'Aria label for feature permission selector',
                  },
                  { feature: FEATURE_LABELS[fp.feature] },
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
