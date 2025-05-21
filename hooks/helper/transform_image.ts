import { Polygon } from "./docaligner";
import * as nativeOpenCV from "@/native-modules/opencv";

export interface TransformResult {
    img: string;
    width: number;
    height: number;
}

export async function transformImage(imageBase64: string, points: Polygon): Promise<TransformResult> {
    const result = await nativeOpenCV.transformImage(imageBase64, points);

    return {
        img: result.data,
        width: result.width,
        height: result.height,
    };
}
