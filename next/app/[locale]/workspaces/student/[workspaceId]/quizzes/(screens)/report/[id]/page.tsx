import { withPageAuth } from '@/lib/middleware/_Middleware.index';
import { StudentQuizReportWidget } from "@/app/[locale]/workspaces/student/[workspaceId]/quizzes/(widgets)/StudentQuizReport.widget";
import { Link } from '@/i18n/routing';
import { PiArrowLeft } from 'react-icons/pi';

interface StudentQuizReportPageProps {
    params: Promise<{ id: string; workspaceId: string }>;
}

async function StudentQuizReportPage({ params }: StudentQuizReportPageProps) {
    const { id: quizId, workspaceId } = await params;

    return (
        <div className="p-6 h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto mb-6">
                <Link
                    href={`/workspaces/student/${workspaceId}/quizzes`}
                    className="flex items-center gap-2 text-gray-500 hover:text-app-bright-green transition font-medium text-sm"
                >
                    <PiArrowLeft />
                    Back to Quiz History
                </Link>
            </div>
            <StudentQuizReportWidget
                quizId={quizId}
            />
        </div>
    );
}

export default withPageAuth(
    StudentQuizReportPage,
    {
        path: '/workspaces/student/:workspaceId/quizzes/report/:id',
    }
);
