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
    const file = `${FileSystem.cacheDirectory}temp-raw-${new Date().getTime()}.png`;
    await FileSystem.writeAsStringAsync(file, base64, { encoding: FileSystem.EncodingType.Base64 });
    return file;
}
