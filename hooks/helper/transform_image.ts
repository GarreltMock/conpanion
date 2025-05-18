import { Polygon } from "./docaligner";
import * as nativeOpenCV from "@/native-modules/opencv";

export interface TransformResult {
    img: string;
    width: number;
    height: number;
}

export async function transformImage(imageBase64: string, points: Polygon): Promise<TransformResult> {
    const result = await nativeOpenCV.transformImage(imageBase64, points);

    // Convert base64 PNG to ImageData (React Native: use a library or custom decoder as needed)
    // Here, just return the base64 and dimensions for further processing
    // If you need ImageData, you must decode base64 PNG to RGBA buffer (platform-specific)
    return {
        img: result.data,
        width: result.width,
        height: result.height,
    };
}
