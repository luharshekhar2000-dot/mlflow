import { createMLflowRoutePath } from '../common/utils/RoutingUtils';

export enum AdminPageId {
  adminPage = 'mlflow.admin',
  usersPage = 'mlflow.admin.users',
  teamsPage = 'mlflow.admin.teams',
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- following repo convention
export class AdminRoutePaths {
  static get adminPage() {
    return createMLflowRoutePath('/admin');
  }

  static get usersPage() {
    return createMLflowRoutePath('/admin/users');
  }

  static get teamsPage() {
    return createMLflowRoutePath('/admin/teams');
  }
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- following repo convention
class AdminRoutes {
  static get adminPageRoute() {
    return AdminRoutePaths.adminPage;
  }

  static get usersPageRoute() {
    return AdminRoutePaths.usersPage;
  }

  static get teamsPageRoute() {
    return AdminRoutePaths.teamsPage;
  }
}

export default AdminRoutes;
