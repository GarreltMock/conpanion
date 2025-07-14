import * as FileSystem from "expo-file-system";

export const getAbsolutePath = (path: string) => {
    return path.startsWith("/") || path.startsWith("file:") ? path : `${FileSystem.documentDirectory}${path}`;
};

// Helper function to convert absolute paths to relative paths
export const getRelativePath = (path: string): string => {
    if (!path) return path;

    // If it's already a relative path, return as is
    if (!path.startsWith("/") && !path.startsWith("file:")) {
        return path;
    }

    // Convert absolute path to relative path
    const documentDirectory = FileSystem.documentDirectory;
    if (!documentDirectory) {
        console.warn("Document directory is not available");
        return path; // Return as is if document directory is not available
    }

    if (path.startsWith(documentDirectory)) {
        return path.substring(documentDirectory.length);
    }

    // Handle file:// URIs
    if (path.startsWith("file://")) {
        const filePath = path.substring(7); // Remove "file://" prefix
        if (filePath.startsWith(documentDirectory)) {
            return filePath.substring(documentDirectory.length);
        }
    }

    // Return as is if we can't convert to relative
    return path;
};
export const generateId = (length = 8) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};
