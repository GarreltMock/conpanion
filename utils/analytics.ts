import { Octolytics } from "@lotum/octolytics.js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { generateId } from "@/storage/helper";
import Constants from "expo-constants";
import { ProgrammierConFeedback } from "@/types";

// Check if we're in development mode
const isDevelopment = (): boolean => {
    return __DEV__ || Constants.expoConfig?.extra?.environment === "development";
};

// Storage implementation for React Native
class ReactNativeStorage {
    readonly key = "octolytics-storage";

    async getItem(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(this.key);
        } catch (error) {
            console.warn("Failed to get Octolytics storage item:", error);
            return null;
        }
    }

    async setItem(value: string): Promise<void> {
        try {
            await AsyncStorage.setItem(this.key, value);
        } catch (error) {
            console.warn("Failed to set Octolytics storage item:", error);
        }
    }

    async removeItem(): Promise<void> {
        try {
            await AsyncStorage.removeItem(this.key);
        } catch (error) {
            console.warn("Failed to remove Octolytics storage item:", error);
        }
    }
}

// Generate or retrieve consistent user ID
const getUserId = async (): Promise<string> => {
    const USER_ID_KEY = "user_id";
    try {
        let userId = await AsyncStorage.getItem(USER_ID_KEY);
        if (!userId) {
            userId = generateId();
            await AsyncStorage.setItem(USER_ID_KEY, userId);
        }
        return userId;
    } catch (error) {
        console.warn("Failed to get/set user ID:", error);
        return generateId(); // Fallback to generating a new ID each time
    }
};

// Initialize Octolytics instance
let octolyticsInstance: Octolytics | null = null;

export const initializeAnalytics = async (): Promise<Octolytics> => {
    if (octolyticsInstance) {
        return octolyticsInstance;
    }

    try {
        const userId = await getUserId();

        octolyticsInstance = new Octolytics({
            deviceInfos: {
                game: "programmiercon-app",
                platform: "Native" as const,
                os: Platform.OS,
                osVersion: Platform.Version.toString(),
            },
            userProperties: {
                userID: userId,
            },
            storage: new ReactNativeStorage(),
        });

        return octolyticsInstance;
    } catch (error) {
        console.error("Failed to initialize analytics:", error);
        throw error;
    }
};

export const getAnalytics = (): Octolytics | null => {
    return octolyticsInstance;
};

// Generic tracking function with development mode check
export const trackEvent = async (eventName: string, parameters: Record<string, any> = {}): Promise<void> => {
    if (isDevelopment()) {
        console.log(`[Analytics] Skipping tracking in development: ${eventName}`, parameters);
        return;
    }

    try {
        const analytics = await initializeAnalytics();
        await analytics.track(eventName, false, parameters);
        console.log(`[Analytics] Tracked: ${eventName}`, parameters);
    } catch (error) {
        console.error(`Failed to track ${eventName}:`, error);
    }
};

// Track app start event
export const trackAppStart = async (): Promise<void> => {
    await trackEvent("app_start");
};

// Track talk agenda actions
export const trackTalkAddedToAgenda = async (talkId: string): Promise<void> => {
    await trackEvent("talk_added_to_agenda", { talkId });
};

export const trackTalkRemovedFromAgenda = async (talkId: string): Promise<void> => {
    await trackEvent("talk_removed_from_agenda", { talkId });
};

// Track talk rating and summary
export const trackTalkRated = async (params: { talkId: string } & ProgrammierConFeedback): Promise<void> => {
    await trackEvent("talk_rated", params);
};

// Track note item creation
export const trackNoteAdded = async (contentParameter: {
    hasText: boolean;
    hasImages: boolean;
    hasAudio: boolean;
    textLength: number;
    imageCount: number;
    audioCount: number;
}): Promise<void> => {
    await trackEvent("note_added", contentParameter);
};

// Track image transformation result
export const trackImageTransformation = async (success: boolean, errorType?: string): Promise<void> => {
    await trackEvent("image_transformation", {
        success,
        ...(errorType && { errorType }),
    });
};

// Track uncaught errors
export const trackError = async (error: Error, errorInfo?: Record<string, any>): Promise<void> => {
    await trackEvent("uncaught_error", {
        errorMessage: error.message,
        errorName: error.name,
        errorStack: error.stack,
        ...errorInfo,
    });
};

// Export for easy access
export { Octolytics };
