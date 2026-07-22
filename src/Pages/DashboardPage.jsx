import { useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import DashboardLayout from '../Components/Dashboard/DashboardLayout/DashboardLayout';
import DashboardOverview from '../Components/Dashboard/DashboardOverview/DashboardOverview';
import UserManagement from '../Components/Dashboard/UserManagement/UserManagement';
import PurchaseOrders from '../Components/Dashboard/PurchaseOrders/PurchaseOrders';
import ProfileSettings from '../Components/Dashboard/ProfileSettings/ProfileSettings';
import ChangePassword from '../Components/Dashboard/ChangePassword/ChangePassword';

export default function DashboardPage() {
  const { selectedDashboardMenu, handleDashboardMenuChange } = useAuth();

  useEffect(() => {
    const savedMenu = localStorage.getItem('dashboardMenu');
    if (savedMenu && !selectedDashboardMenu) {
      handleDashboardMenuChange(savedMenu);
    } else if (!selectedDashboardMenu) {
      handleDashboardMenuChange('overview');
    }
  }, [handleDashboardMenuChange, selectedDashboardMenu]);

  const renderContent = () => {
    switch (selectedDashboardMenu) {
      case 'users':
        return <UserManagement />;
      case 'purchase-orders':
        return <PurchaseOrders />;
      case 'profile':
        return <ProfileSettings />;
      case 'password':
        return <ChangePassword />;
      case 'overview':
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <DashboardLayout
      activeMenu={selectedDashboardMenu || 'overview'}
      onMenuChange={handleDashboardMenuChange}
    >
      {renderContent()}
    </DashboardLayout>
  );
}
