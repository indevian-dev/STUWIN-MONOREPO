import { withPageAuth } from '@/lib/middleware/handlers';

function StaffBlogsPage() {
  return (
    <div className="p-4">
      <p className="text-gray-600">Blogs management coming soon.</p>
    </div>
  );
}

export default withPageAuth(
  StaffBlogsPage,
  {
    path: '/workspaces/staff/:workspaceId/blogs',
  }
);

