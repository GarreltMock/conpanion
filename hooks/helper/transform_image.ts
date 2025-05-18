import { Point, Polygon } from "./docaligner";
import * as cv from "react-native-fast-opencv";

export interface TransformResult {
    img: ImageData;
    width: number;
    height: number;
}

export async function transformImage(imageData: ImageData, points: Polygon): Promise<TransformResult> {
    const src = await cv.matFromImageData(imageData);
    const dim = calculateOriginalDimensions(points);
    const dsize = new cv.Size(dim.width, dim.height);

    const srcTri = await cv.matFromArray(4, 1, cv.CV_32FC2, [
        points[0][0],
        points[0][1],
        points[1][0],
        points[1][1],
        points[2][0],
        points[2][1],
        points[3][0],
        points[3][1],
    ]);

    const dstTri = await cv.matFromArray(4, 1, cv.CV_32FC2, [
        0,
        0,
        dsize.width,
        0,
        dsize.width,
        dsize.height,
        0,
        dsize.height,
    ]);

    const M = await cv.getPerspectiveTransform(srcTri, dstTri);
    const dst = new cv.Mat();

    await cv.warpPerspective(src, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

    // Get data from dst matrix
    const data = await dst.getData();
    const img = new ImageData(new Uint8ClampedArray(data), dst.cols, dst.rows);

    // Clean up
    await src.delete();
    await dst.delete();
    await srcTri.delete();
    await dstTri.delete();
    await M.delete();

    return { img, width: dim.width, height: dim.height };
}

export function calculateOriginalDimensions(points: Polygon): { width: number; height: number } {
    const distance = (p1: Point, p2: Point): number =>
        Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));

    // Seitenlängen berechnen
    const heightLeft = distance(points[0], points[3]);
    const heightRight = distance(points[1], points[2]);

    const height = Math.min(heightLeft, heightRight);
    const ratio = 16 / 9;
    const width = height * (ratio || 1);

    return { width, height };
}
