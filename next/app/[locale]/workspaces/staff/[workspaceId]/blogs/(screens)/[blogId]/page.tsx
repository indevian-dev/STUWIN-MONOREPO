import BlogEdit from '@/app/[locale]/workspaces/staff/[workspaceId]/blogs/(widgets)/StaffBlogEditWidget';
import { withPageAuth } from '@/lib/middleware/handlers';

interface BlogEditPageProps {
  params: Promise<{ blogId: string; locale: string }>;
}

async function BlogEditPage({ params }: BlogEditPageProps) {
  return <BlogEdit />;
}

export default withPageAuth(
  BlogEditPage,
  {
    path: '/workspaces/staff/:workspaceId/blogs/:blogId',
  }
);

