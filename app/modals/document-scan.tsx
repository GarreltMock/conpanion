import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as FileSystem from "expo-file-system";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import ImageTransform from "@/components/ImageTransform";
import { TransformedImage } from "@/types";
import * as Haptics from "expo-haptics";

export default function DocumentScanScreen() {
    const router = useRouter();
    const [transformedImage, setTransformedImage] = useState<TransformedImage | null>(null);

    const handleImageTransformed = (image: TransformedImage) => {
        setTransformedImage(image);
        // Provide haptic feedback when an image is successfully transformed
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const handleUseImage = async () => {
        if (!transformedImage) return;

        // Example: Copy the image to a more permanent location
        try {
            const timestamp = new Date().getTime();
            const newImagePath = `${FileSystem.documentDirectory}images/scanned_doc_${timestamp}.png`;

            // Ensure the directory exists
            const dirInfo = await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}images`);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}images`, { intermediates: true });
            }

            // Copy the file
            await FileSystem.copyAsync({
                from: transformedImage.uri,
                to: newImagePath,
            });

            // Provide feedback
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Here, you would typically pass this image back to the calling screen
            // For example, you might use router.back() and pass parameters
            router.back();
        } catch (error) {
            console.error("Error saving transformed image:", error);
            alert("Failed to save the transformed image");
        }
    };

    return (
        <ThemedView style={styles.container}>
            <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <ThemedText style={styles.title}>Document Scanner</ThemedText>
                <ThemedText style={styles.subtitle}>
                    Take or select a photo of a document to scan and align it
                </ThemedText>

                <ImageTransform onImageTransformed={handleImageTransformed} style={styles.scannerContainer} />

                {transformedImage && (
                    <View style={styles.buttonContainer}>
                        <ThemedView style={styles.button} onTouchEnd={handleUseImage}>
                            <ThemedText style={styles.buttonText}>Use This Image</ThemedText>
                        </ThemedView>
                    </View>
                )}
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingVertical: 20,
        paddingHorizontal: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 8,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: "center",
        opacity: 0.8,
    },
    scannerContainer: {
        marginTop: 16,
        alignItems: "center",
    },
    buttonContainer: {
        marginTop: 20,
        alignItems: "center",
    },
    button: {
        backgroundColor: "#2196F3",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    buttonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
});
