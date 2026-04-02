import type { DocumentTitleHandle } from '../common/utils/RoutingUtils';
import { createLazyRouteElement } from '../common/utils/RoutingUtils';
import { AdminPageId, AdminRoutePaths } from './routes';

export const getAdminRouteDefs = () => {
  return [
    {
      path: AdminRoutePaths.adminPage,
      element: createLazyRouteElement(() => import('./pages/AdminPage')),
      pageId: AdminPageId.adminPage,
      handle: { getPageTitle: () => 'User Management' } satisfies DocumentTitleHandle,
      children: [
        {
          path: 'users',
          element: createLazyRouteElement(() => import('./pages/UsersPage')),
          pageId: AdminPageId.usersPage,
          handle: { getPageTitle: () => 'Users' } satisfies DocumentTitleHandle,
        },
        {
          path: 'teams',
          element: createLazyRouteElement(() => import('./pages/TeamsPage')),
          pageId: AdminPageId.teamsPage,
          handle: { getPageTitle: () => 'Teams' } satisfies DocumentTitleHandle,
        },
      ],
    },
  ];
};
