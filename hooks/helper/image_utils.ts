import * as FileSystem from "expo-file-system";
import { Image } from "react-native";
import * as ImageManipulator from "expo-image-manipulator";
import atob from "atob";
import btoa from "btoa";

/**
 * Converts an image URI to ImageData format for processing
 * @param uri Path to the image file
 * @returns Promise that resolves to ImageData object
 */
export async function imageUriToImageData(uri: string): Promise<ImageData> {
    // First, get the image dimensions
    const imageSize = await getImageSize(uri);

    // Create a temporary file with base64 encoding to get raw data
    const base64Data = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });

    // Decode base64 data to binary
    const binaryData = atob(base64Data);

    // Create Uint8ClampedArray from binary data
    const uint8Array = new Uint8ClampedArray(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
        uint8Array[i] = binaryData.charCodeAt(i);
    }

    // Create and return ImageData object
    return new ImageData(uint8Array, imageSize.width, imageSize.height);
}

/**
 * Gets the dimensions of an image
 * @param uri Path to the image
 * @returns Promise resolving to width and height
 */
function getImageSize(uri: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        Image.getSize(
            uri,
            (width, height) => {
                resolve({ width, height });
            },
            (error) => {
                reject(new Error(`Failed to get image size: ${error}`));
            }
        );
    });
}

/**
 * Converts ImageData back to a file URI - not used in React Native environment
 * @deprecated Use imageDataToUriRN instead
 */
export async function imageDataToUri(imageData: ImageData): Promise<string> {
    // This function is kept for API compatibility but should not be used in React Native
    // Instead, use imageDataToUriRN
    return imageDataToUriRN(imageData);
}

/**
 * A React Native compatible implementation since we don't have direct canvas support
 */
export async function imageDataToUriRN(imageData: ImageData): Promise<string> {
    // Create a temporary file from the raw data
    const tempFile = `${FileSystem.cacheDirectory}temp-raw-${new Date().getTime()}.png`;

    // Convert Uint8ClampedArray to base64
    let binary = "";
    const bytes = new Uint8Array(imageData.data.buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    // Write to file
    await FileSystem.writeAsStringAsync(tempFile, base64, { encoding: FileSystem.EncodingType.Base64 });

    // Use ImageManipulator to ensure the file is properly formatted
    const result = await ImageManipulator.manipulateAsync(
        tempFile,
        [{ resize: { width: imageData.width, height: imageData.height } }],
        { format: ImageManipulator.SaveFormat.PNG }
    );

    // Delete the temporary file
    await FileSystem.deleteAsync(tempFile, { idempotent: true });

    return result.uri;
}
