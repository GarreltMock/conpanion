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
            const floatArray = new Float32Array(Uint8Array.from(atob(res.data), (c) => c.charCodeAt(0)).buffer);
            resolve({ data: floatArray, originalSize: res.originalSize });
        });
    });
}

export async function postprocessHeatmap(
    heatmap: Float32Array,
    originalSize: { width: number; height: number }
): Promise<Polygon> {
    return new Promise((resolve, reject) => {
        const uint8Array = new Uint8Array(heatmap.buffer);
        const binary = Array.from(uint8Array)
            .map((byte) => String.fromCharCode(byte))
            .join("");
        const base64 = global.btoa(binary);
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

export async function transformImage(
    imageAsBase64: string,
    corners: number[][]
): Promise<{ data: string; width: number; height: number }> {
    return new Promise((resolve, reject) => {
        RNOpenCvLibrary.transformImage(imageAsBase64, corners, (err: any, res: any) => {
            if (err) return reject(err);
            resolve(res);
        });
    });
}

export async function readQRCode(imageAsBase64: string): Promise<{ found: boolean; text: string }> {
    return new Promise((resolve, reject) => {
        RNOpenCvLibrary.readQRCode(imageAsBase64, (err: any, res: any) => {
            if (err) return reject(err);
            resolve({ found: res.found, text: res.text });
        });
    });
}
