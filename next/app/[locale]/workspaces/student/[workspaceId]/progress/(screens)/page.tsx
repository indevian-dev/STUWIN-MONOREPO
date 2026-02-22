import { StudentProgressWidget } from "@/app/[locale]/workspaces/student/[workspaceId]/progress/(widgets)/StudentProgress.widget";
import { WorkspacePageTitleTile } from "@/app/[locale]/workspaces/(root)/(tiles)/WorkspacePageTitle.tile";
import { withPageAuth } from "@/lib/middleware/_Middleware.index";
import { PiChartLineUp } from "react-icons/pi";

function StudentProgressPage() {
    return (
        <div>
            <WorkspacePageTitleTile
                title="My Progress"
                subtitle="Track your topic mastery across subjects"
                icon={<PiChartLineUp />}
                action={null}
                className="mb-4"
            />
            <StudentProgressWidget />
        </div>
    );
}

export default withPageAuth(StudentProgressPage, {
    path: "/workspaces/student/:workspaceId/progress",
});
