import AdminAuthWrapper from '../../../src/components/AdminAuthWrapper';
import AdminPanel from '../../../src/components/AdminPanel';

export default function AdminDashboardPage() {
  return (
    <AdminAuthWrapper>
      <AdminPanel />
    </AdminAuthWrapper>
  );
}
