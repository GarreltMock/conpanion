export type ConferenceStatus = "active" | "past" | "upcoming";

export interface Conference {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    location?: string;
    description?: string;
    status: ConferenceStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface Speaker {
    name: string;
    photo?: string;
    bio?: string;
}

export interface Talk {
    id: string;
    conferenceId: string;
    title: string;
    startTime: Date;
    duration?: number; // Duration in minutes
    isUserSelected?: boolean;
    speakers?: Speaker[];
    stage?: string;
    description?: string;
    rating?: number; // 1-5 stars for talk evaluation
    summary?: string; // Evaluation summary/remaining thoughts
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
