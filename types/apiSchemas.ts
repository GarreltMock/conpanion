export interface ApiAgendaResponse {
    talks: ApiTalk[];
    lastModified?: string;
    version?: string;
    conference?: {
        name?: string;
        description?: string;
        location?: string;
        startDate?: string | Date;
        endDate?: string | Date;
    };
}

export interface ApiTalk {
    id: string; // External API ID
    title: string;
    startTime: string | Date;
    endTime?: string | Date;
    duration?: number; // Duration in minutes
    speakers?: ApiSpeaker[];
    stage?: string;
    description?: string;
    category?: string;
    tags?: string[];
    level?: string; // beginner, intermediate, advanced
    type?: string; // talk, workshop, keynote, etc.
}

export interface ApiSpeaker {
    id?: string;
    name: string;
    photo?: string;
    bio?: string;
    company?: string;
    title?: string;
    twitter?: string;
    linkedin?: string;
    github?: string;
    website?: string;
}

// Transformer function type definition
export type ApiTransformerFunction = (data: any) => ApiAgendaResponse;

// Configuration for API transformers
export interface ApiTransformerConfig {
    id: string;
    name: string;
    description: string;
    transformer: ApiTransformerFunction;
}

// Standard error response structure
export interface ApiErrorResponse {
    error: string;
    message?: string;
    statusCode?: number;
    details?: any;
}