import { InferenceSession, Tensor } from "onnxruntime-react-native";
import * as FileSystem from "expo-file-system";
import * as nativeOpenCV from "@/native-modules/opencv";

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

export async function processImage(imageBase64: string): Promise<{ polygon: Polygon | null; type: number }> {
    let type = 0;
    let polygon: Polygon | null = await callHeatmapModel(imageBase64);

    if (polygon.length !== 4) {
        polygon = await callPointModel(imageBase64);
        type = 1;

        if (polygon.length !== 4) {
            polygon = null;
            type = 2;
        }
    }

    return { polygon, type };
}

async function callHeatmapModel(imageBase64: string): Promise<Polygon> {
    const { data, originalSize } = await preprocess(imageBase64);

    const session = await getSession(heatmapModel);
    const tensor = new Tensor("float32", data, [1, 3, 256, 256]);
    const feeds = { img: tensor };
    const results = await session.run(feeds);

    return postprocessHeatmap(results.heatmap as Tensor, originalSize);
}

async function callPointModel(imageBase64: string): Promise<Polygon> {
    const { data, originalSize } = await preprocess(imageBase64);

    const session = await getSession(pointModel);
    const tensor = new Tensor("float32", data, [1, 3, 256, 256]);
    const feeds = { img: tensor };
    const results = await session.run(feeds);

    return postprocessPoint(results.points as CustomTensor, results.has_obj as CustomTensor, [
        originalSize.height,
        originalSize.width,
    ]);
}

async function preprocess(imageBase64: string): Promise<PreprocessResult> {
    // Directly call nativeOpenCV.preprocess with base64 string
    const result = await nativeOpenCV.preprocess(imageBase64);
    return result;
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
    return await nativeOpenCV.postprocessHeatmap(heatmap.data as Float32Array, originalSize);
}
