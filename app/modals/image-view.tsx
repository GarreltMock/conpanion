import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";

import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useImageZoomPan } from "@/hooks/useImageZoomPan";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ImageViewModal() {
    const { imageUri } = useLocalSearchParams<{
        imageUri: string;
    }>();

    const decodedUri = decodeURIComponent(imageUri as string);

    // Theme colors
    const textColor = useThemeColor({}, "text");
    const backgroundColor = useThemeColor({}, "background");

    // Image zoom and pan functionality
    const { combinedGestures, animatedImageStyle } = useImageZoomPan();

    const handleClose = () => {
        router.back();
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ThemedView style={[styles.container, { backgroundColor: backgroundColor }]}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                        <IconSymbol name="xmark" size={24} color={textColor} />
                    </TouchableOpacity>
                </View>

                <GestureDetector gesture={combinedGestures}>
                    <Animated.View style={styles.imageContainer}>
                        <Animated.Image
                            source={{ uri: decodedUri }}
                            style={[styles.image, animatedImageStyle]}
                            resizeMode="contain"
                        />
                    </Animated.View>
                </GestureDetector>
            </ThemedView>
        </SafeAreaView>
    );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: 16,
        zIndex: 100,
        position: "relative",
    },
    closeButton: {
        padding: 8,
        zIndex: 101,
    },
    imageContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    image: {
        width: width,
        height: height * 0.8,
    },
});
