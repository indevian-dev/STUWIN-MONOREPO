// Shared Base Types

// Timestamps

export interface Timestamps {
    createdAt: string;
    updatedAt?: string;
}

// Sorting & Filtering

export interface SortOrder {
    field: string;
    direction: 'asc' | 'desc';
}

export interface FilterParams {
    [key: string]: any;
}

// Location & Geo

export interface Location {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    country?: string;
}

export interface GeoBounds {
    northEast: {
        latitude: number;
        longitude: number;
    };
    southWest: {
        latitude: number;
        longitude: number;
    };
}
