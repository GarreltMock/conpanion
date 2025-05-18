import React, { useState } from "react";
import { View, Image, Button, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useImageTransform } from "../hooks/useImageTransform";
import { Polygon, TransformedImage } from "../types";
import ThemedView from "./ThemedView";
import ThemedText from "./ThemedText";

interface ImageTransformProps {
    onImageTransformed?: (transformedImage: TransformedImage) => void;
    style?: React.ComponentProps<typeof View>["style"];
}

export default function ImageTransform({ onImageTransformed, style }: ImageTransformProps) {
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [transformedImage, setTransformedImage] = useState<TransformedImage | null>(null);
    const [detectedCorners, setDetectedCorners] = useState<Polygon | null>(null);
    const [processing, setProcessing] = useState(false);

    const { isInitialized, isLoading, error, processImageFromUri } = useImageTransform();

    const pickImage = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permissionResult.granted) {
                alert("Permission to access camera roll is required!");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 1,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setOriginalImage(result.assets[0].uri);
                setTransformedImage(null);
                setDetectedCorners(null);
            }
        } catch (error) {
            console.error("Error picking image:", error);
            alert("Failed to pick image");
        }
    };

    const processImage = async () => {
        if (!originalImage || !isInitialized) return;

        setProcessing(true);
        try {
            const result = await processImageFromUri(originalImage);
            setDetectedCorners(result.corners);

            if (result.transformed) {
                setTransformedImage(result.transformed);

                if (onImageTransformed) {
                    onImageTransformed(result.transformed);
                }
            }
        } catch (err) {
            console.error("Error processing image:", err);
            alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <ThemedView style={[styles.container, style]}>
                <ActivityIndicator size="large" color="#0000ff" />
                <ThemedText>Loading models...</ThemedText>
            </ThemedView>
        );
    }

    if (error) {
        return (
            <ThemedView style={[styles.container, style]}>
                <ThemedText style={styles.errorText}>Error: {error}</ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={[styles.container, style]}>
            <TouchableOpacity style={styles.button} onPress={pickImage} disabled={processing}>
                <ThemedText style={styles.buttonText}>Pick an image</ThemedText>
            </TouchableOpacity>

            {originalImage && (
                <>
                    <ThemedText style={styles.label}>Original Image:</ThemedText>
                    <Image source={{ uri: originalImage }} style={styles.image} />
                    <TouchableOpacity
                        style={[styles.button, processing && styles.processingButton]}
                        onPress={processImage}
                        disabled={processing || !isInitialized}
                    >
                        <ThemedText style={styles.buttonText}>
                            {processing ? "Processing..." : "Detect & Transform"}
                        </ThemedText>
                    </TouchableOpacity>
                </>
            )}

            {transformedImage && (
                <>
                    <ThemedText style={styles.label}>Transformed Image:</ThemedText>
                    <Image
                        source={{ uri: transformedImage.uri }}
                        style={[
                            styles.image,
                            {
                                width:
                                    transformedImage.width > transformedImage.height
                                        ? 300
                                        : 300 * (transformedImage.width / transformedImage.height),
                                height:
                                    transformedImage.width > transformedImage.height
                                        ? 300 * (transformedImage.height / transformedImage.width)
                                        : 300,
                            },
                        ]}
                    />
                </>
            )}

            {!transformedImage && detectedCorners && (
                <ThemedText style={styles.message}>
                    Corners detected but couldn't transform the image properly
                </ThemedText>
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    image: {
        width: 300,
        height: 400,
        resizeMode: "contain",
        marginVertical: 15,
        borderRadius: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: "bold",
        marginTop: 10,
    },
    errorText: {
        color: "red",
        fontSize: 16,
    },
    message: {
        color: "orange",
        fontSize: 14,
        marginTop: 10,
        textAlign: "center",
    },
    button: {
        backgroundColor: "#2196F3",
        padding: 12,
        borderRadius: 8,
        marginVertical: 10,
        alignSelf: "stretch",
        alignItems: "center",
    },
    processingButton: {
        backgroundColor: "#CCCCCC",
    },
    buttonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
});
