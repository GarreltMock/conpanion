import { useEffect, useState, useCallback } from "react";
import * as FileSystem from "expo-file-system";
import { processImage } from "./helper/docaligner";
import { transformImage } from "./helper/transform_image";
import { imageUriToImageData, imageDataToUriRN } from "./helper/image_utils";
import { Polygon } from "@/types";
import { Platform } from "react-native";

export function useImageTransform() {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize the models by copying them from app bundle to document directory
    useEffect(() => {
        const initModels = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Create models directory if it doesn't exist
                const modelDir = `${FileSystem.documentDirectory}models`;
                const dirInfo = await FileSystem.getInfoAsync(modelDir);
                if (!dirInfo.exists) {
                    await FileSystem.makeDirectoryAsync(modelDir, { intermediates: true });
                }

                // Copy models from bundle to document directory
                const modelFiles = ["model_point.onnx", "model_heat.onnx"];
                for (const file of modelFiles) {
                    const fileUri = `${FileSystem.documentDirectory}models/${file}`;
                    const fileInfo = await FileSystem.getInfoAsync(fileUri);

                    if (!fileInfo.exists) {
                        // Copy from asset bundle - you'll need to adjust this path based on where you place the models
                        await FileSystem.copyAsync({
                            from: `${FileSystem.bundleDirectory}${Platform.OS === "ios" ? "" : "models"}/${file}`,
                            to: fileUri,
                        });
                    }
                }

                setIsInitialized(true);
            } catch (err) {
                setError(`Failed to initialize models: ${err instanceof Error ? err.message : String(err)}`);
                console.error("Error initializing models:", err);
            } finally {
                setIsLoading(false);
            }
        };

        initModels();
    }, []);

    // Process image from URI
    const processImageFromUri = useCallback(
        async (
            imageUri: string
        ): Promise<{
            corners: Polygon | null;
            transformed?: { uri: string; width: number; height: number };
        }> => {
            if (!isInitialized) {
                throw new Error("Models are not initialized");
            }

            try {
                // Convert image URI to ImageData
                const imageData = await imageUriToImageData(imageUri);

                // Detect corners
                const start = Date.now();
                const result = await processImage(imageData);
                const end = Date.now();
                console.log(`processImage took ${end - start}ms`);

                // If valid corners were detected, transform the image
                if (result.polygon && result.polygon.length === 4) {
                    const startTime = Date.now();
                    const transformed = await transformImage(imageData, result.polygon);
                    const endTime = Date.now();
                    console.log(`transformImage took ${endTime - startTime}ms`);

                    // Convert back to URI
                    const transformedUri = await imageDataToUriRN(
                        transformed.img,
                        transformed.width,
                        transformed.height
                    );

                    return {
                        corners: result.polygon,
                        transformed: {
                            uri: transformedUri,
                            width: transformed.width,
                            height: transformed.height,
                        },
                    };
                }

                return { corners: result.polygon };
            } catch (err) {
                console.error("Error processing image:", err);
                throw new Error(`Failed to process image: ${err instanceof Error ? err.message : String(err)}`);
            }
        },
        [isInitialized]
    );

    // Transform image manually with provided corners
    const transformImageWithCorners = useCallback(
        async (
            imageUri: string,
            corners: Polygon
        ): Promise<{
            uri: string;
            width: number;
            height: number;
        }> => {
            if (!isInitialized) {
                throw new Error("Models are not initialized");
            }

            if (!corners || corners.length !== 4) {
                throw new Error("Invalid corner points: must provide exactly 4 points");
            }

            try {
                // Convert image URI to ImageData
                const imageData = await imageUriToImageData(imageUri);

                // Transform image
                const transformed = await transformImage(imageData, corners);

                // Convert back to URI
                const transformedUri = await imageDataToUriRN(transformed.img, transformed.width, transformed.height);

                return {
                    uri: transformedUri,
                    width: transformed.width,
                    height: transformed.height,
                };
            } catch (err) {
                console.error("Error transforming image:", err);
                throw new Error(`Failed to transform image: ${err instanceof Error ? err.message : String(err)}`);
            }
        },
        [isInitialized]
    );

    return {
        isInitialized,
        isLoading,
        error,
        processImageFromUri,
        transformImageWithCorners,
    };
}
