export interface Conference {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    location?: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    apiUrl?: string;
    apiTransformer?: string;
    lastApiSync?: Date;
}

export interface Speaker {
    name: string;
    photo?: string;
    bio?: string;
}

export interface AgendaItem {
    id: string;
    conferenceId: string;
    apiId?: string; // External ID from the API (for matching during updates)
    source: "user" | "api";
    title: string;
    startTime: Date;
    duration?: number; // Duration in minutes
    isUserSelected?: boolean;
    location?: string;
    description?: string;
}

export interface Talk extends AgendaItem {
    speakers?: Speaker[];
    rating?: number; // 1-5 stars for talk evaluation
    summary?: string;
    feedback?: string;
}

export interface Activity extends AgendaItem {
}

export interface NoteImage {
    uri: string;
    originalUri?: string; // Set only for transformed images
    corners?: Polygon; // Set only for transformed images
    links?: string[]; // URLs detected from QR codes in this image
}

export interface Note {
    id: string;
    talkId: string;
    textContent: string;
    images: NoteImage[];
    audioRecordings: string[];
    timestamp: Date;
    relativeTime?: number; // Time in seconds relative to talk start
}

export interface ExportOptions {
    format: "pdf" | "md";
    includeImages: boolean;
    includeTalkIds: string[];
    filename: string;
}

export type Point = [number, number];
export type Polygon = Point[];

export interface TransformedImage {
    uri: string;
    width: number;
    height: number;
}
