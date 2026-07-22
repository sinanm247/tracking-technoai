import TrackingPage from '../Pages/TrackingPage';
import DashboardPage from '../Pages/DashboardPage';
import UnauthorizedPage from '../Pages/UnauthorizedPage';
import { STAFF_ROLES } from '../Constants/roles';

const routes = [
  {
    path: '/',
    element: <TrackingPage />,
  },
  {
    path: '/dashboard',
    element: <DashboardPage />,
    isProtected: true,
    roles: STAFF_ROLES,
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
];

export default routes;
