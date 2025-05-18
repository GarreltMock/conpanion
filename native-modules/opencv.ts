import { Polygon } from "@/types";
import { NativeModules } from "react-native";
const { RNOpenCvLibrary } = NativeModules;

export default RNOpenCvLibrary;

export async function preprocess(
    imageAsBase64: string
): Promise<{ data: Float32Array; originalSize: { width: number; height: number } }> {
    return new Promise((resolve, reject) => {
        RNOpenCvLibrary.preprocess(imageAsBase64, (err: any, res: any) => {
            if (err) return reject(err);
            const floatArray = new Float32Array(Buffer.from(res.data, "base64").buffer);
            resolve({ data: floatArray, originalSize: res.originalSize });
        });
    });
}

export async function postprocessHeatmap(
    heatmap: Float32Array,
    originalSize: { width: number; height: number }
): Promise<Polygon> {
    return new Promise((resolve, reject) => {
        const base64 = Buffer.from(heatmap.buffer).toString("base64");
        RNOpenCvLibrary.postprocessHeatmap(
            base64,
            originalSize.width,
            originalSize.height,
            (err: any, polygon: Polygon) => {
                if (err) return reject(err);
                resolve(polygon);
            }
        );
    });
}
