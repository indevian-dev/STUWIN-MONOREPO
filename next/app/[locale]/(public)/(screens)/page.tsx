

import { PublicHomeHeroWidget } from '@/app/[locale]/(public)/(widgets)/PublicHomeHeroWidget';
import { PdfToolButtonTile } from '@/app/[locale]/(public)/(tiles)/PdfToolButtonTile';
import { PublicHomePricingWidget } from '@/app/[locale]/(public)/(widgets)/PublicHomePricingWidget';
import { PublicHomeCognitiveAnalysisWidget } from '@/app/[locale]/(public)/(widgets)/PublicHomeCognitiveAnalysisWidget';
import { PublicHomeAutonomousCurriculumWidget } from '@/app/[locale]/(public)/(widgets)/PublicHomeAutonomousCurriculumWidget';
import { PublicHomeExpertIntelligenceWidget } from '@/app/[locale]/(public)/(widgets)/PublicHomeExpertIntelligenceWidget';
import { PublicHomeVisionWidget } from '@/app/[locale]/(public)/(widgets)/PublicHomeVisionWidget';

export const metadata = {
    title: 'STUWIN.AI - Homepage'
};

const PublicHomeScreen = async () => {
    return (
        <>
            <PublicHomeHeroWidget />
            <PublicHomeCognitiveAnalysisWidget />
            <PublicHomeAutonomousCurriculumWidget />
            <PublicHomeExpertIntelligenceWidget />
            <PublicHomeVisionWidget />
            <PublicHomePricingWidget />
            <PdfToolButtonTile />
        </>
    );
};

export default PublicHomeScreen;