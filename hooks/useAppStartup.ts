import { useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { trackAppStart } from "@/utils/analytics";

/**
 * Custom hook for centralized app startup logic
 * Ensures startup tasks only run once when the app loads
 */
export function useAppStartup() {
    const { runAutoUpdates, isLoading, activeTalk } = useApp();
    const hasRunStartup = useRef(false);

    useEffect(() => {
        const runStartupTasks = async () => {
            // Only run startup tasks once and after initial loading is complete
            if (hasRunStartup.current || isLoading) {
                return;
            }

            hasRunStartup.current = true;

            try {
                console.log("Running app startup tasks...");

                // Track app start for analytics
                await trackAppStart();

                // Run automatic conference updates
                await runAutoUpdates();

                console.log("App startup tasks completed");
            } catch (error) {
                console.error("Error during app startup tasks:", error);
                // Don't throw - startup failures shouldn't crash the app
            }
        };

        runStartupTasks();
    }, [runAutoUpdates, isLoading, activeTalk]);
}
