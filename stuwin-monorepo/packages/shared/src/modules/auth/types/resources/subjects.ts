
import type { Timestamps } from '../../../common/base';

export namespace Subject {
    export interface PrivateAccess extends Timestamps {
        id: string;
        title: string;
        title_ru?: string;
        title_en?: string;
        description?: string;
        parentId?: string | null;
        isActive: boolean;
        type?: string;
    }
}
