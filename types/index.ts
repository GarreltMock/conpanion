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

export interface Talk {
    id: string;
    conferenceId: string;
    title: string;
    startTime: Date;
    endTime?: Date;
}

export interface Note {
    id: string;
    talkId: string;
    textContent: string;
    images: string[];
    audioRecordings: string[];
    timestamp: Date;
}

export interface ExportOptions {
    format: "pdf" | "md";
    includeImages: boolean;
    includeTalkIds: string[];
    filename: string;
}
