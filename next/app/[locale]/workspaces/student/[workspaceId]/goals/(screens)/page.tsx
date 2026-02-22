import { StudentGoalsWidget } from "@/app/[locale]/workspaces/student/[workspaceId]/goals/(widgets)/StudentGoals.widget";
import { WorkspacePageTitleTile } from "@/app/[locale]/workspaces/(root)/(tiles)/WorkspacePageTitle.tile";
import { withPageAuth } from "@/lib/middleware/_Middleware.index";
import { PiTarget } from "react-icons/pi";

function StudentGoalsPage() {
    return (
        <div>
            <WorkspacePageTitleTile
                title="My Goals"
                subtitle="Track your learning milestones and activity"
                icon={<PiTarget />}
                action={null}
                className="mb-4"
            />
            <StudentGoalsWidget />
        </div>
    );
}

export default withPageAuth(StudentGoalsPage, {
    path: "/workspaces/student/:workspaceId/goals",
});
