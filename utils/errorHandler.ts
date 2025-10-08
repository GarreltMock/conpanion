import { trackError } from "./analytics";

let isErrorHandlerSetup = false;

// Access ErrorUtils from the global object
const ErrorUtils = (global as { ErrorUtils?: any }).ErrorUtils;

/**
 * Sets up global error handlers to track uncaught errors
 */
export const setupGlobalErrorHandler = (): void => {
    if (isErrorHandlerSetup) {
        return;
    }

    // Check if ErrorUtils is available
    if (!ErrorUtils) {
        console.warn("[ErrorHandler] ErrorUtils not available, skipping error handler setup");
        return;
    }

    // Handle JavaScript errors
    const defaultErrorHandler = ErrorUtils.getGlobalHandler();

    ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
        // Track the error to analytics
        trackError(error, {
            isFatal,
            type: "javascript_error",
        }).catch((trackingError) => {
            console.error("Failed to track error:", trackingError);
        });

        // Call the default error handler
        defaultErrorHandler(error, isFatal);
    });

    // Handle promise rejections
    const promiseRejectionTracker = (event: PromiseRejectionEvent) => {
        const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));

        trackError(error, {
            type: "unhandled_promise_rejection",
        }).catch((trackingError) => {
            console.error("Failed to track promise rejection:", trackingError);
        });
    };

    if (typeof global !== "undefined") {
        // @ts-ignore - React Native global object
        global.addEventListener?.("unhandledrejection", promiseRejectionTracker);
    }

    isErrorHandlerSetup = true;
    console.log("[ErrorHandler] Global error handler initialized");
};
