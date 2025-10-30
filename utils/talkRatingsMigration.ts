import { getTalks } from "@/storage";
import { getConferences } from "@/storage";
import { trackEvent } from "./analytics";
import { runMigration } from "./migrations";
import { Conference } from "@/types";

const MIGRATION_ID = "retrack_talk_ratings_with_conference_info_v1";

/**
 * Re-track all talk ratings with correct data including conferenceId, title, and shareConsent
 */
export const retrackTalkRatings = async (): Promise<void> => {
    await runMigration(MIGRATION_ID, async () => {
        try {
            // Load all talks and conferences from storage
            const talks = await getTalks();
            const conferences = await getConferences();

            // Create a map of conference IDs to conferences for quick lookup
            const conferenceMap = new Map<string, Conference>();
            conferences.forEach((conf) => conferenceMap.set(conf.id, conf));

            // Filter talks that have ratings and feedback with shareConsent
            const ratedTalks = talks.filter(
                (talk) => talk.rating && talk.feedback?.shareConsent && talk.feedback?.ratingOverall
            );

            console.log(`[Migration] Found ${ratedTalks.length} talks with ratings to re-track`);

            // Track each rated talk with the correct data
            for (const talk of ratedTalks) {
                const conference = conferenceMap.get(talk.conferenceId);

                if (!conference) {
                    console.warn(`[Migration] Conference not found for talk ${talk.id}`);
                    continue;
                }

                await trackEvent("talk_rated", {
                    talkId: talk.id,
                    conferenceId: talk.conferenceId,
                    conferenceName: conference.name,
                    talkTitle: talk.title,
                    ratingOverall: talk.feedback?.ratingOverall,
                    ratingContent: talk.feedback?.ratingContent,
                    ratingSpeaker: talk.feedback?.ratingSpeaker,
                    feedback: talk.feedback?.feedback,
                    shareConsent: talk.feedback?.shareConsent,
                });

                console.log(`[Migration] Re-tracked rating for talk: ${talk.title} (${talk.id})`);
            }

            console.log(`[Migration] Successfully re-tracked ${ratedTalks.length} talk ratings`);
        } catch (error) {
            console.error("[Migration] Error re-tracking talk ratings:", error);
            throw error;
        }
    });
};
