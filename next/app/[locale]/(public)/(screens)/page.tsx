

import { PublicHomeHeroWidget } from '@/app/[locale]/(public)/(widgets)/PublicHomeHero.widget';
// import { PdfToolButtonTile } from '@/app/[locale]/(public)/(tiles)/PdfToolButton.tile';
import { PublicHomeProgramsWidget } from '@/app/[locale]/(public)/(widgets)/PublicHomePrograms.widget';
import { PublicHomeCognitiveAnalysisWidget } from '@/app/[locale]/(public)/(widgets)/PublicHomeCognitiveAnalysis.widget';
// import { PublicHomeAutonomousCurriculumWidget } from '@/app/[locale]/(public)/(widgets)/PublicHomeAutonomousCurriculum.widget';
import { PublicHomeExpertIntelligenceWidget } from '@/app/[locale]/(public)/(widgets)/PublicHomeExpertIntelligence.widget';
import { PublicHomeVisionWidget } from '@/app/[locale]/(public)/(widgets)/PublicHomeVision.widget';

export const metadata = {
    title: 'STUWIN.AI - Homepage'
};

const PublicHomeScreen = async () => {
    return (
        <>
            <PublicHomeHeroWidget />
            <PublicHomeCognitiveAnalysisWidget />
            {/* <PublicHomeAutonomousCurriculumWidget /> */}
            <PublicHomeExpertIntelligenceWidget />
            <PublicHomeVisionWidget />
            <PublicHomeProgramsWidget />
            {/* <PdfToolButtonTile /> */}
        </>
    );
};

export default PublicHomeScreen;