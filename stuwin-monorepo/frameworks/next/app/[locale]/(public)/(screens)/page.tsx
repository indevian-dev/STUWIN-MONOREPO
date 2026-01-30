

import { PublicHomeHeroWidget } from '@/app/[locale]/(public)/(widgets)/PublicHomeHeroWidget';
import { PublicHomeHowItWorksWidget } from '@/app/[locale]/(public)/(widgets)/PublicHomeHowItWorksWidget';
import { PdfToolButtonTile } from '@/app/[locale]/(public)/(tiles)/PdfToolButtonTile';
import { PublicHomeTestsWidget } from '@/app/[locale]/(public)/(widgets)/PublicHomeTestsWidget';
import { PublicHomeSummariesWidget } from '@/app/[locale]/(public)/(widgets)/PublicHomeSummariesWidget';
import { PublicHomeParentsWidget } from '@/app/[locale]/(public)/(widgets)/PublicHomeParentsWidget';
import { PublicHomeWhyChooseWidget } from '@/app/[locale]/(public)/(widgets)/PublicHomeWhyChooseWidget';
import { PublicHomePricingWidget } from '@/app/[locale]/(public)/(widgets)/PublicHomePricingWidget';
import { PublicHomeClosingWidget } from '@/app/[locale]/(public)/(widgets)/PublicHomeClosingWidget';

export const metadata = {
    title: 'STUWIN.AI - Homepage'
};

const PublicHomeScreen = async () => {
    return (
        <>
            <PublicHomeHeroWidget />
            <PublicHomeHowItWorksWidget />
            <PdfToolButtonTile />
            <PublicHomeTestsWidget />
            <PublicHomeSummariesWidget />
            <PublicHomeParentsWidget />
            <PublicHomeWhyChooseWidget />
            <PublicHomePricingWidget />
            <PublicHomeClosingWidget />
        </>
    );
};

export default PublicHomeScreen;