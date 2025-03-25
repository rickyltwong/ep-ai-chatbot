'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser, getAllUsers } from './actions';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  name?: string;
}

export default function AdminDashboard({
  initialUsers,
}: { initialUsers: User[] }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>(initialUsers);

  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate the email domain
    if (!email.endsWith('@ep.org.hk')) {
      toast.error('Only @ep.org.hk email addresses are allowed');
      return;
    }

    // Validate password length
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await registerUser({ email, password, name });

      if (result.status === 'success') {
        toast.success('User registered successfully');
        // Reset the form
        setEmail('');
        setPassword('');
        setName('');

        // Refresh the user list
        const updatedUsers = await getAllUsers();
        if (updatedUsers.status === 'success') {
          setUsers(updatedUsers.users);
        }
      } else if (result.status === 'user_exists') {
        toast.error('User already exists with this email');
      } else if (result.status === 'unauthorized') {
        toast.error('You are not authorized to register users');
        router.push('/');
      } else {
        toast.error('Failed to register user');
      }
    } catch (error) {
      console.error('Error registering user:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Back to Home
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* User Registration Form */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
          <h2 className="text-xl font-bold mb-6">Register New User</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="user@ep.org.hk"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 8 characters
              </p>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Registering...' : 'Register User'}
              </button>
            </div>
          </form>
        </div>

        {/* User List */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
          <h2 className="text-xl font-bold mb-6">Registered Users</h2>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {filteredUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {searchTerm ? 'No matching users found' : 'No users found'}
            </p>
          ) : (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 px-4 text-left text-sm font-semibold text-gray-900"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="py-3.5 px-4 text-left text-sm font-semibold text-gray-900"
                    >
                      Email
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="whitespace-nowrap p-4 text-sm text-gray-900">
                        {user.name || 'N/A'}
                      </td>
                      <td className="whitespace-nowrap p-4 text-sm text-gray-900">
                        {user.email}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// End of Selection
