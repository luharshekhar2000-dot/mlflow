import { useMemo } from 'react';
import { Header, Spacer, Typography, useDesignSystemTheme } from '@databricks/design-system';
import { FormattedMessage } from 'react-intl';
import { Link, Outlet, useLocation } from '../../common/utils/RoutingUtils';
import { withErrorBoundary } from '../../common/utils/withErrorBoundary';
import ErrorUtils from '../../common/utils/ErrorUtils';
import AdminRoutes from '../routes';
import UsersPage from './UsersPage';
import TeamsPage from './TeamsPage';
import { ScrollablePageWrapper } from '@mlflow/mlflow/src/common/components/ScrollablePageWrapper';

const AdminPageTitle = () => {
  const { theme } = useDesignSystemTheme();
  return (
    <span css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
      <FormattedMessage
        defaultMessage="User Management"
        description="Header title for the admin user management page"
      />
    </span>
  );
};

type AdminTab = 'users' | 'teams';

const AdminPage = () => {
  const { theme } = useDesignSystemTheme();
  const location = useLocation();

  const activeTab: AdminTab = useMemo(() => {
    if (location.pathname.includes('/teams')) return 'teams';
    return 'users';
  }, [location.pathname]);

  const isUsersRoute =
    location.pathname === '/admin' || location.pathname === '/admin/' || location.pathname.includes('/admin/users');
  const isTeamsRoute = location.pathname.includes('/admin/teams');

  const tabItems: Array<{ key: AdminTab; label: React.ReactNode; to: string }> = [
    {
      key: 'users',
      label: <FormattedMessage defaultMessage="Users" description="Admin page - users tab" />,
      to: AdminRoutes.usersPageRoute,
    },
    {
      key: 'teams',
      label: <FormattedMessage defaultMessage="Teams" description="Admin page - teams tab" />,
      to: AdminRoutes.teamsPageRoute,
    },
  ];

  return (
    <ScrollablePageWrapper css={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Spacer shrinks={false} />
      <Header title={<AdminPageTitle />} />
      <div
        css={{
          display: 'flex',
          gap: 0,
          borderBottom: `1px solid ${theme.colors.borderDecorative}`,
          paddingLeft: theme.spacing.md,
        }}
      >
        {tabItems.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <Link
              componentId={`mlflow.admin.page.${item.key}_tab`}
              key={item.key}
              to={item.to}
              css={{
                padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
                borderBottom: isActive
                  ? `2px solid ${theme.colors.actionPrimaryBackgroundDefault}`
                  : '2px solid transparent',
                color: isActive ? theme.colors.actionPrimaryBackgroundDefault : theme.colors.textPrimary,
                fontWeight: isActive ? theme.typography.typographyBoldFontWeight : undefined,
                textDecoration: 'none',
                ':hover': { color: theme.colors.actionPrimaryBackgroundDefault },
              }}
            >
              <Typography.Text bold={isActive}>{item.label}</Typography.Text>
            </Link>
          );
        })}
      </div>
      <div css={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {isUsersRoute && <UsersPage />}
        {isTeamsRoute && <TeamsPage />}
      </div>
    </ScrollablePageWrapper>
  );
};

export default withErrorBoundary(ErrorUtils.mlflowServices.EXPERIMENTS, AdminPage);
