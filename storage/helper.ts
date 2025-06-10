import * as FileSystem from "expo-file-system";

export const getAbsolutePath = (path: string) => {
    return path.startsWith("/") || path.startsWith("file:") ? path : `${FileSystem.documentDirectory}${path}`;
};
export const generateId = (length = 8) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};
