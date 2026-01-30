import { useTranslations } from 'next-intl';
import { PdfToolManagementWidget } from '../(widgets)/PdfToolManagementWidget';

export const metadata = {
    title: 'stuwin.ai - PDF Tools'
};

export default function PdfToolPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <PdfToolManagementWidget />
            </div>
        </div>
    );
}