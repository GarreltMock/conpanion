import { Conference } from "../types";

export interface UpdatePolicy {
    upcoming: number; // Days before conference - update daily
    active: boolean; // During conference - update on every startup
    past: boolean; // After conference - no updates
}

export interface AutoUpdateResult {
    updated: boolean;
    error?: string;
    conferenceId: string;
}

class AutoUpdateService {
    private readonly defaultPolicy: UpdatePolicy = {
        upcoming: 1, // Update daily when upcoming
        active: true, // Update on every startup when active
        past: false, // No updates when past
    };

    /**
     * Determines if a conference should be updated based on its timing and last sync
     */
    shouldUpdateConference(conference: Conference, policy: UpdatePolicy = this.defaultPolicy): boolean {
        if (!conference.apiUrl) {
            return false; // No API URL, can't update
        }

        const now = new Date();
        const conferenceStart = new Date(conference.startDate);
        const conferenceEnd = new Date(conference.endDate);

        // Check conference timing status
        const isUpcoming = now < conferenceStart;
        const isActive = now >= conferenceStart && now <= conferenceEnd;
        const isPast = now > conferenceEnd;

        if (isPast && !policy.past) {
            return false;
        }

        if (isActive && policy.active) {
            return true;
        }

        if (isUpcoming) {
            if (!conference.lastApiSync) {
                return true; // Never synced, should sync
            }

            const daysSinceLastSync = Math.floor(
                (now.getTime() - conference.lastApiSync.getTime()) / (1000 * 60 * 60 * 24)
            );

            return daysSinceLastSync >= policy.upcoming;
        }

        return false;
    }

    /**
     * Gets the conference timing status for logging/debugging
     */
    getConferenceStatus(conference: Conference): "upcoming" | "active" | "past" {
        const now = new Date();
        const conferenceStart = new Date(conference.startDate);
        const conferenceEnd = new Date(conference.endDate);

        if (now < conferenceStart) return "upcoming";
        if (now >= conferenceStart && now <= conferenceEnd) return "active";
        return "past";
    }

    /**
     * Gets days until conference start (negative if past start)
     */
    getDaysUntilConference(conference: Conference): number {
        const now = new Date();
        const conferenceStart = new Date(conference.startDate);
        return Math.ceil((conferenceStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    /**
     * Gets days since last API sync
     */
    getDaysSinceLastSync(conference: Conference): number | null {
        if (!conference.lastApiSync) {
            return null;
        }
        const now = new Date();
        return Math.floor((now.getTime() - conference.lastApiSync.getTime()) / (1000 * 60 * 60 * 24));
    }

    /**
     * Attempts to update a single conference
     */
    async updateConference(
        conference: Conference,
        syncFunction: (conferenceId: string) => Promise<void>
    ): Promise<AutoUpdateResult> {
        console.log(`Auto-updating conference: ${conference.name} (${conference.id})`);
        console.log(`Status: ${this.getConferenceStatus(conference)}`);

        const daysSinceSync = this.getDaysSinceLastSync(conference);
        if (daysSinceSync !== null) {
            console.log(`Days since last sync: ${daysSinceSync}`);
        } else {
            console.log("Never synced before");
        }

        try {
            await syncFunction(conference.id);
            console.log(`Successfully updated conference: ${conference.name}`);

            return {
                updated: true,
                conferenceId: conference.id,
            };
        } catch (error: any) {
            console.error(`Failed to update conference ${conference.name}:`, error);

            return {
                updated: false,
                error: error.message || "Unknown error occurred",
                conferenceId: conference.id,
            };
        }
    }

    /**
     * Updates all conferences that need updating
     */
    async updateConferences(
        conferences: Conference[],
        syncFunction: (conferenceId: string) => Promise<void>,
        policy: UpdatePolicy = this.defaultPolicy
    ): Promise<AutoUpdateResult[]> {
        console.log(`Auto-update: Checking ${conferences.length} conferences for updates`);

        const results: AutoUpdateResult[] = [];
        const conferencesToUpdate = conferences.filter((conf) => this.shouldUpdateConference(conf, policy));

        console.log(`Auto-update: ${conferencesToUpdate.length} conferences need updating`);

        // Update conferences sequentially to avoid overwhelming the API
        for (const conference of conferencesToUpdate) {
            const result = await this.updateConference(conference, syncFunction);
            results.push(result);
        }

        const successCount = results.filter((r) => r.updated).length;
        const failCount = results.filter((r) => !r.updated).length;

        console.log(`Auto-update completed: ${successCount} successful, ${failCount} failed`);

        return results;
    }
}

// Export singleton instance
export const autoUpdateService = new AutoUpdateService();
export default autoUpdateService;
