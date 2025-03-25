import { getAllUsers } from './actions';
import AdminDashboard from './admin-dashboard';

export default async function AdminPage() {
  // Fetch users server-side
  const usersResult = await getAllUsers();

  return <AdminDashboard initialUsers={usersResult.users} />;
}
