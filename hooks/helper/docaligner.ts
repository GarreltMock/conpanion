import { InferenceSession, Tensor } from "onnxruntime-react-native";
import * as cv from "react-native-opencv";
import * as FileSystem from "expo-file-system";

export type Point = [number, number];
export type Polygon = Point[];

interface PreprocessResult {
    data: Float32Array;
    originalSize: { width: number; height: number };
}

interface CustomTensor {
    data: Float32Array;
    dims: number[];
    size: number;
    cpuData: Float32Array;
}

interface Session {
    run(feeds: Record<string, any>): Promise<Record<string, any>>;
}

const sessions: Map<string, Promise<Session>> = new Map();

async function getSession(modelName: string): Promise<Session> {
    if (!sessions.has(modelName)) {
        // Get absolute path to model file in assets directory
        const modelPath = `${FileSystem.documentDirectory}models/${modelName}`;
        sessions.set(modelName, InferenceSession.create(modelPath));
    }
    return sessions.get(modelName)!;
}

const pointModel = "model_point.onnx";
const heatmapModel = "model_heat.onnx";

export async function processImage(imageData: ImageData): Promise<{ polygon: Polygon | null; type: number }> {
    let type = 0;
    let polygon: Polygon | null = await callHeatmapModel(imageData);

    if (polygon.length !== 4) {
        polygon = await callPointModel(imageData);
        type = 1;

        if (polygon.length !== 4) {
            polygon = null;
            type = 2;
        }
    }

    return { polygon, type };
}

async function callHeatmapModel(imageData: ImageData): Promise<Polygon> {
    const { data, originalSize } = await preprocess(imageData);

    const session = await getSession(heatmapModel);
    const tensor = new Tensor("float32", data, [1, 3, 256, 256]);
    const feeds = { img: tensor };
    const results = await session.run(feeds);

    return postprocessHeatmap(results.heatmap as Tensor, originalSize);
}

async function callPointModel(imageData: ImageData): Promise<Polygon> {
    const { data, originalSize } = await preprocess(imageData);

    const session = await getSession(pointModel);
    const tensor = new Tensor("float32", data, [1, 3, 256, 256]);
    const feeds = { img: tensor };
    const results = await session.run(feeds);

    return postprocessPoint(results.points as CustomTensor, results.has_obj as CustomTensor, [
        originalSize.height,
        originalSize.width,
    ]);
}

async function preprocess(imageData: ImageData): Promise<PreprocessResult> {
    // OpenCV: Load image data into a matrix
    const src = await cv.matFromImageData(imageData);
    const originalSize = { width: src.cols, height: src.rows };

    // Scale image to 256x256
    const imgSizeInfer = new cv.Size(256, 256);
    const resized = new cv.Mat();
    await cv.resize(src, resized, imgSizeInfer, 0, 0, cv.INTER_LINEAR);

    // Normalization and conversion to Float32Array
    const input = new cv.Mat();
    await resized.convertTo(input, cv.CV_32FC3, 1.0 / 255.0);
    const inputData: Float32Array = await input.data32F();

    // Rearrange channels from HWC to CHW
    const [C, H, W] = [3, 256, 256];
    const chwData = new Float32Array(C * H * W);
    for (let c = 0; c < C; c++) {
        for (let h = 0; h < H; h++) {
            for (let w = 0; w < W; w++) {
                chwData[c * H * W + h * W + w] = inputData[h * W * 4 + w * 4 + c];
            }
        }
    }

    // Clean up resources
    await src.delete();
    await resized.delete();
    await input.delete();

    return { data: chwData, originalSize };
}

function postprocessPoint(pointsTensor: CustomTensor, hasObjTensor: CustomTensor, imgSize: [number, number]): Polygon {
    const hasObjValue = hasObjTensor.cpuData[0];
    if (hasObjValue <= 0.4) return [];

    // Punkte extrahieren
    const pointCount = pointsTensor.size;
    const cpuData = pointsTensor.cpuData;

    const points = Array.from({ length: pointCount }, (_, i) => cpuData[i]);

    if (points.length !== 8) {
        console.warn("Erwartet 8 Koordinatenwerte (4 Punkte), aber erhalten:", points.length);
        return [];
    }

    const [height, width] = imgSize;
    const polygon: Polygon = [];
    for (let i = 0; i < 4; i++) {
        const x = points[i * 2] * width;
        const y = points[i * 2 + 1] * height;
        polygon.push([x, y]);
    }

    return polygon;
}

async function postprocessHeatmap(heatmap: Tensor, originalSize: { width: number; height: number }): Promise<Polygon> {
    const [batch, channels, height, width] = heatmap.dims;
    const outputData = heatmap.data;
    const heatmapThreshold = 0.3;
    const polygon: Polygon = [];

    for (let c = 0; c < channels; c++) {
        const start = c * height * width;
        const end = (c + 1) * height * width;
        const channelData = outputData.slice(start, end);

        const mat = new cv.Mat(height, width, cv.CV_32F);
        await mat.setData32F(channelData);

        const resized = new cv.Mat();
        await cv.resize(mat, resized, new cv.Size(originalSize.width, originalSize.height), 0, 0, cv.INTER_LINEAR);

        // Thresholding
        const thresh = new cv.Mat();
        await cv.threshold(resized, thresh, heatmapThreshold, 1.0, cv.THRESH_BINARY);

        const binary = new cv.Mat();
        await thresh.convertTo(binary, cv.CV_8U, 255);

        // Find contours
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
        await cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        let maxArea = 0;
        let maxContour: any = null;
        for (let i = 0; i < (await contours.size()); i++) {
            const contour = await contours.get(i);

            const area = await cv.contourArea(contour);
            if (area > maxArea) {
                maxArea = area;
                maxContour = contour;
            } else {
                await contour.delete();
            }
        }

        if (maxContour) {
            const moments = await cv.moments(maxContour);
            const cx = moments.m10 / moments.m00;
            const cy = moments.m01 / moments.m00;

            polygon.push([cx, cy]);
        }

        // Free memory
        await mat.delete();
        await resized.delete();
        await thresh.delete();
        await binary.delete();
        await contours.delete();
        await hierarchy.delete();
    }

    return polygon;
}
