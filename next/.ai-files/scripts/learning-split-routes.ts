/**
 * Learning Module Split — Route Migration Script
 * Replaces all `module.learning.*` calls with new module calls
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const APP_DIR = join(import.meta.dir, '../../app');

// METHOD → NEW MODULE MAPPING
const REPLACEMENTS: [RegExp, string][] = [
    // ─── SUBJECT methods ───
    [/module\.learning\.createSubject\(/g, 'module.subject.create('],
    [/module\.learning\.updateSubject\(/g, 'module.subject.update('],
    [/module\.learning\.deleteSubject\(/g, 'module.subject.delete('],
    [/module\.learning\.getSubjectById\(/g, 'module.subject.getById('],
    [/module\.learning\.getSubjectOverview\(/g, 'module.subject.getOverview('],
    [/module\.learning\.getWorkspaceSubjects\(/g, 'module.subject.getWorkspaceSubjects('],
    [/module\.learning\.getPublicSubjects\(/g, 'module.subject.getPublicSubjects('],
    [/module\.learning\.getSubjectPdfs\(/g, 'module.subject.getPdfs('],
    [/module\.learning\.saveSubjectPdf\(/g, 'module.subject.savePdf('],
    [/module\.learning\.getSubjectPdfUploadUrl\(/g, 'module.subject.getPdfUploadUrl('],
    [/module\.learning\.getSubjectCoverUploadUrl\(/g, 'module.subject.getCoverUploadUrl('],
    [/module\.learning\.getSubjectCoverUploadUrlLegacy\(/g, 'module.subject.getCoverUploadUrlLegacy('],
    [/module\.learning\.deleteSubjectMedia\(/g, 'module.subject.deleteMedia('],
    [/module\.learning\.getSubjectHeatmap\(/g, 'module.subject.getHeatmap('],
    [/module\.learning\.getSubjectPdfById\(/g, 'module.subject.getPdfById('],
    [/module\.learning\.reorderSubjectPdfs\(/g, 'module.subject.reorderPdfs('],

    // ─── TOPIC methods ───
    [/module\.learning\.createTopicWithContent\(/g, 'module.topic.createWithContent('],
    [/module\.learning\.updateTopic\(/g, 'module.topic.update('],
    [/module\.learning\.deleteTopic\(/g, 'module.topic.delete('],
    [/module\.learning\.getTopicById\(/g, 'module.topic.getById('],
    [/module\.learning\.getTopicDetail\(/g, 'module.topic.getDetail('],
    [/module\.learning\.getTopics\(/g, 'module.topic.list('],
    [/module\.learning\.bulkCreateTopics\(/g, 'module.topic.bulkCreate('],
    [/module\.learning\.analyzeBookTopic\(/g, 'module.topic.analyzeBook('],
    [/module\.learning\.getTopicMediaUploadUrl\(/g, 'module.topic.getMediaUploadUrl('],
    [/module\.learning\.saveTopicPdfMetadata\(/g, 'module.topic.savePdfMetadata('],
    [/module\.learning\.incrementTopicQuestionStats\(/g, 'module.topic.incrementQuestionStats('],

    // ─── QUESTION methods ───
    [/module\.learning\.listQuestions\(/g, 'module.question.list('],
    [/module\.learning\.createQuestion\(/g, 'module.question.create('],
    [/module\.learning\.getQuestionById\(/g, 'module.question.getById('],
    [/module\.learning\.updateQuestion\(/g, 'module.question.update('],
    [/module\.learning\.deleteQuestion\(/g, 'module.question.delete('],
    [/module\.learning\.setQuestionPublished\(/g, 'module.question.setPublished('],
    [/module\.learning\.getQuestionsBySubject\(/g, 'module.question.getBySubject('],
    [/module\.learning\.mapQuestionToLegacy\(/g, 'module.question.mapToLegacy('],
];

async function getAllTsFiles(dir: string): Promise<string[]> {
    const results: string[] = [];
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            results.push(...await getAllTsFiles(fullPath));
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
            results.push(fullPath);
        }
    }
    return results;
}

async function main() {
    console.log('🔍 Scanning route files...\n');
    const files = await getAllTsFiles(APP_DIR);
    let totalChanges = 0;
    const changedFiles: string[] = [];

    for (const file of files) {
        let content = await readFile(file, 'utf-8');
        let fileChanged = false;

        for (const [pattern, replacement] of REPLACEMENTS) {
            const matches = content.match(pattern);
            if (matches) {
                content = content.replace(pattern, replacement);
                fileChanged = true;
                totalChanges += matches.length;
            }
        }

        // Check for any remaining module.learning. calls we missed
        const remaining = content.match(/module\.learning\.\w+\(/g);
        if (remaining) {
            console.log(`  ⚠️  UNMAPPED calls in ${file}:`);
            remaining.forEach(m => console.log(`      ${m}`));
        }

        if (fileChanged) {
            await writeFile(file, content, 'utf-8');
            changedFiles.push(file);
        }
    }

    console.log(`\n✅ Updated ${changedFiles.length} files with ${totalChanges} replacements:`);
    changedFiles.forEach(f => console.log(`   📝 ${f.replace(APP_DIR, 'app')}`));
}

main().catch(console.error);
