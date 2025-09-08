import {
    ApiAgendaResponse,
    ApiTalk,
    ApiSpeaker,
    ApiTransformerConfig,
    ApiTransformerFunction,
} from "../types/apiSchemas";

// Default passthrough transformer for APIs that already match our schema
const passthroughTransformer: ApiTransformerFunction = (data: any): ApiAgendaResponse => {
    if (!data || !data.talks) {
        throw new Error("Invalid API response: missing talks array");
    }

    return {
        talks: data.talks,
        lastModified: data.lastModified,
        version: data.version,
        conference: data.conference,
    };
};

// Sessionize transformer (popular conference platform)
const sessionizeTransformer: ApiTransformerFunction = (data: any): ApiAgendaResponse => {
    if (!Array.isArray(data)) {
        throw new Error("Invalid Sessionize response: expected array of sessions");
    }

    const talks: ApiTalk[] = data.map((session: any) => {
        // Handle speakers
        const speakers: ApiSpeaker[] = (session.speakers || []).map((speaker: any) => ({
            id: speaker.id?.toString(),
            name: speaker.fullName || `${speaker.firstName || ""} ${speaker.lastName || ""}`.trim(),
            photo: speaker.profilePicture,
            bio: speaker.bio,
            company: speaker.tagLine,
        }));

        return {
            id: session.id?.toString(),
            title: session.title,
            description: session.description,
            startTime: session.startsAt,
            endTime: session.endsAt,
            speakers,
            stage: session.roomName || session.room,
            category: session.categoryItems?.[0]?.name,
            level: session.levelItems?.[0]?.name,
        };
    });

    return {
        talks,
        lastModified: new Date().toISOString(),
    };
};

// Pretalx transformer (open-source conference management)
const pretalxTransformer: ApiTransformerFunction = (data: any): ApiAgendaResponse => {
    if (!data.results || !Array.isArray(data.results)) {
        throw new Error("Invalid Pretalx response: expected results array");
    }

    const talks: ApiTalk[] = data.results.map((talk: any) => {
        // Handle speakers
        const speakers: ApiSpeaker[] = (talk.speakers || []).map((speaker: any) => ({
            id: speaker.code,
            name: speaker.name,
            bio: speaker.biography,
            photo: speaker.avatar,
        }));

        return {
            id: talk.code,
            title: talk.title,
            description: talk.abstract,
            startTime: talk.slot?.start,
            endTime: talk.slot?.end,
            speakers,
            stage: talk.slot?.room?.name,
            type: talk.submission_type?.name,
            level: talk.track?.name,
        };
    });

    return {
        talks,
        lastModified: data.last_modified,
    };
};

// Custom conference API transformer (for example-api.json format)
const programmierconTransformer: ApiTransformerFunction = (data: any): ApiAgendaResponse => {
    if (!data.conference || !data.conference.agenda || !Array.isArray(data.conference.agenda)) {
        throw new Error("Invalid custom conference response: expected conference.agenda array");
    }

    // Filter out agenda items that don't have talk_object or where talk_object is null
    const validAgendaItems = data.conference.agenda.filter((item: any) => item.talk_object !== null);

    const talks: ApiTalk[] = validAgendaItems.map((agendaItem: any) => {
        const talkObject = agendaItem.talk_object;

        // Combine speakers from both 'speakers' and 'members' arrays
        const allSpeakers: ApiSpeaker[] = [];

        // Add speakers from 'speakers' array
        if (talkObject.speakers && Array.isArray(talkObject.speakers)) {
            talkObject.speakers.forEach((speaker: any) => {
                allSpeakers.push({
                    id: speaker.id,
                    name:
                        speaker.first_name && speaker.last_name
                            ? `${speaker.first_name} ${speaker.last_name}`.trim()
                            : speaker.first_name || speaker.last_name || "Unknown Speaker",
                    photo: speaker.profile_image || speaker.event_image,
                    bio: speaker.description,
                    company: speaker.occupation,
                    twitter: speaker.twitter_url,
                    linkedin: speaker.linkedin_url,
                    github: speaker.github_url,
                    website: speaker.website_url,
                });
            });
        }

        // Add speakers from 'members' array
        if (talkObject.members && Array.isArray(talkObject.members)) {
            talkObject.members.forEach((member: any) => {
                allSpeakers.push({
                    id: member.id,
                    name:
                        member.first_name && member.last_name
                            ? `${member.first_name} ${member.last_name}`.trim()
                            : member.first_name || member.last_name || "Unknown Member",
                    photo: member.normal_image || member.action_image,
                    bio: member.description,
                    company: member.occupation,
                    twitter: member.twitter_url,
                    linkedin: member.linkedin_url,
                    github: member.github_url,
                    website: member.website_url,
                });
            });
        }

        // Calculate duration from start and end times if both are available
        let duration: number | undefined;
        if (agendaItem.start && agendaItem.end) {
            const startTime = new Date(agendaItem.start);
            const endTime = new Date(agendaItem.end);
            duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // Convert to minutes
        }

        return {
            id: talkObject.id,
            title: talkObject.title,
            description: talkObject.abstract,
            startTime: agendaItem.start,
            endTime: agendaItem.end,
            duration,
            speakers: allSpeakers.length > 0 ? allSpeakers : undefined,
            stage: agendaItem.track,
            type: agendaItem.subtitle, // Use subtitle as type (e.g., "Talk 1", "Special Talk")
        };
    });

    return {
        talks,
        lastModified: data.conference.date_created || new Date().toISOString(),
        conference: {
            name: data.conference.title,
            description: data.conference.headline_1,
            location: undefined, // Not provided in this API format
        },
    };
};

// Generic transformer for simple JSON structures
const genericTransformer: ApiTransformerFunction = (data: any): ApiAgendaResponse => {
    let talks: any[] = [];

    // Try to find talks array in various common locations
    if (Array.isArray(data)) {
        talks = data;
    } else if (data.talks && Array.isArray(data.talks)) {
        talks = data.talks;
    } else if (data.sessions && Array.isArray(data.sessions)) {
        talks = data.sessions;
    } else if (data.events && Array.isArray(data.events)) {
        talks = data.events;
    } else if (data.schedule && Array.isArray(data.schedule)) {
        talks = data.schedule;
    } else {
        throw new Error("Could not find talks array in API response");
    }

    const transformedTalks: ApiTalk[] = talks.map((talk: any, index: number) => {
        // Try to extract speakers from various formats
        let speakers: ApiSpeaker[] = [];
        if (talk.speakers && Array.isArray(talk.speakers)) {
            speakers = talk.speakers.map((speaker: any) => ({
                name: speaker.name || speaker.fullName || speaker.speaker || `Speaker ${index + 1}`,
                photo: speaker.photo || speaker.avatar || speaker.image,
                bio: speaker.bio || speaker.biography,
                company: speaker.company || speaker.organization,
            }));
        } else if (talk.speaker) {
            speakers = [
                {
                    name: typeof talk.speaker === "string" ? talk.speaker : talk.speaker.name,
                    photo: typeof talk.speaker === "object" ? talk.speaker.photo : undefined,
                    bio: typeof talk.speaker === "object" ? talk.speaker.bio : undefined,
                },
            ];
        }

        return {
            id: talk.id?.toString() || talk.sessionId?.toString() || talk.eventId?.toString() || `talk-${index}`,
            title: talk.title || talk.name || talk.session || `Untitled Talk ${index + 1}`,
            description: talk.description || talk.abstract || talk.summary,
            startTime: talk.startTime || talk.start || talk.time || talk.datetime,
            endTime: talk.endTime || talk.end,
            duration: talk.duration,
            speakers,
            stage: talk.stage || talk.room || talk.location || talk.venue,
            category: talk.category || talk.track || talk.type,
            level: talk.level || talk.difficulty,
        };
    });

    return {
        talks: transformedTalks,
        lastModified: data.lastModified || data.updated || new Date().toISOString(),
    };
};

// Registry of available transformers
const transformerRegistry: Record<string, ApiTransformerConfig> = {
    passthrough: {
        id: "passthrough",
        name: "Passthrough",
        description: "For APIs that already match our expected format",
        transformer: passthroughTransformer,
    },
    sessionize: {
        id: "sessionize",
        name: "Sessionize",
        description: "For Sessionize conference platform APIs",
        transformer: sessionizeTransformer,
    },
    pretalx: {
        id: "pretalx",
        name: "Pretalx",
        description: "For Pretalx conference management APIs",
        transformer: pretalxTransformer,
    },
    custom_conference: {
        id: "programmiercon",
        name: "programmier.con",
        description: "For custom conference APIs with agenda structure",
        transformer: programmierconTransformer,
    },
    generic: {
        id: "generic",
        name: "Generic",
        description: "Auto-detect format for simple JSON structures",
        transformer: genericTransformer,
    },
};

// Utility functions
export const getTransformer = (transformerId: string): ApiTransformerFunction => {
    const config = transformerRegistry[transformerId];
    if (!config) {
        throw new Error(`Unknown transformer: ${transformerId}`);
    }
    return config.transformer;
};

export const getAvailableTransformers = (): ApiTransformerConfig[] => {
    return Object.values(transformerRegistry);
};

export const transformApiResponse = (data: any, transformerId: string = "generic"): ApiAgendaResponse => {
    const transformer = getTransformer(transformerId);
    return transformer(data);
};

// Helper function to auto-detect transformer based on response structure
export const autoDetectTransformer = (data: any): string => {
    // Check for Custom Conference format
    if (data.conference && data.conference.agenda && Array.isArray(data.conference.agenda)) {
        return "custom_conference";
    }

    // Check for Sessionize format
    if (Array.isArray(data) && data.length > 0 && data[0].startsAt && data[0].speakers) {
        return "sessionize";
    }

    // Check for Pretalx format
    if (data.results && Array.isArray(data.results) && data.results.length > 0 && data.results[0].code) {
        return "pretalx";
    }

    // Check for passthrough format
    if (data.talks && Array.isArray(data.talks)) {
        return "passthrough";
    }

    // Default to generic
    return "generic";
};
