import { redirect } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side authentication check
  const session = await auth();
  const isAdmin = session?.user?.email === process.env.ADMIN_USER;

  // Redirect unauthorized users
  if (!session || !isAdmin) {
    console.warn('Unauthorized access attempt to admin area');
    redirect('/');
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-zinc-900 text-white px-4 py-2">
        <div className="container mx-auto">
          <h1 className="text-lg font-semibold">Admin Panel</h1>
        </div>
      </div>
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
