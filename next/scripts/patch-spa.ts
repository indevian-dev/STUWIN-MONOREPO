import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const files = [
    'app/[locale]/(global)/(context)/GlobalAuthProfileContext.tsx',
    'app/[locale]/(global)/(tiles)/GlobalNotificationBadge.tile.tsx',
    'app/[locale]/(public)/(context)/PublicBookmarkedQuestionsContext.tsx',
    'app/[locale]/(public)/(layout)/header/(widgets)/PublicSearch.widget.tsx',
    'app/[locale]/(public)/blogs/(widgets)/PublicBlogsList.widget.tsx',
    'app/[locale]/(public)/blogs/(widgets)/PublicSingleBlog.widget.tsx',
    'app/[locale]/(public)/docs/rules/(widgets)/PublicRules.widget.tsx',
    'app/[locale]/workspaces/student/[workspaceId]/quizzes/(screens)/take/[id]/StudentTakeQuizPageClient.tsx',
    'app/[locale]/workspaces/student/[workspaceId]/quizzes/(widgets)/StudentQuizHistoryList.widget.tsx',
    'app/[locale]/workspaces/student/[workspaceId]/quizzes/(widgets)/StudentQuizReport.widget.tsx',
    'app/[locale]/workspaces/student/[workspaceId]/quizzes/(widgets)/StudentStartQuiz.widget.tsx',
    'lib/utils/http/StaffAiLabApiHelper.ts',
    'lib/utils/http/StaffJobsApiHelper.ts'
];

for (const file of files) {
    try {
        const fullPath = join(process.cwd(), file);
        let c = readFileSync(fullPath, 'utf8');
        c = c.replace(/import\s+(.*?)\s+from\s+['"]@\/lib\/utils\/http\/SpaApi\.util['"];/g, 'import { apiCall } from "@/lib/utils/http/FetchApiSPA.util";');
        c = c.replace(/SpaApiUtility\.SpaApiCall.util/g, 'SpaApiCall.util');
        c = c.replace(/SpaApiUtil\.SpaApiCall.util/g, 'SpaApiCall.util');
        c = c.replace(/apiCall\./g, 'SpaApiCall.util.');

        writeFileSync(fullPath, c, 'utf8');
        console.log('Fixed SpaApi usage in', file);
    } catch (e) { }
}
