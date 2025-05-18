import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";

/**
 * Converts an image URI to ImageData format for processing
 * @param uri Path to the image file
 * @returns Promise that resolves to ImageData object
 */
export async function imageUriToImageData(uri: string): Promise<string> {
    return await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
}

export async function imageDataToUriRN(base64: string, width: number, height: number): Promise<string> {
    // Create a temporary file from the base64 data
    const tempFile = `${FileSystem.cacheDirectory}temp-raw-${new Date().getTime()}.png`;

    // Write base64 to file
    await FileSystem.writeAsStringAsync(tempFile, base64, { encoding: FileSystem.EncodingType.Base64 });

    // Use ImageManipulator to ensure the file is properly formatted
    const result = await ImageManipulator.manipulateAsync(tempFile, [{ resize: { width, height } }], {
        format: ImageManipulator.SaveFormat.PNG,
    });

    // Delete the temporary file
    await FileSystem.deleteAsync(tempFile, { idempotent: true });

    return result.uri;
}
