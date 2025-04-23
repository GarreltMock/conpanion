import React from "react";
import {
    StyleSheet,
    View,
    TouchableOpacity,
    Dimensions,
    SafeAreaView,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    runOnJS,
} from "react-native-reanimated";

import { IconSymbol } from "@/components/ui/IconSymbol";
import { ThemedView } from "@/components/ThemedView";

export default function ImageViewModal() {
    const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
    const decodedUri = decodeURIComponent(imageUri as string);

    const scale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedScale = useSharedValue(1);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);
    const focalX = useSharedValue(0);
    const focalY = useSharedValue(0);

    const handleClose = () => {
        router.back();
    };

    const resetImage = () => {
        scale.value = withTiming(1);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
    };

    // Create a pinch gesture with focal point zooming
    const pinchGesture = Gesture.Pinch()
        .onStart((e) => {
            savedScale.value = scale.value;
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;

            // Save the focal point of the pinch
            focalX.value = e.focalX;
            focalY.value = e.focalY;
        })
        .onUpdate((e) => {
            // Calculate new scale
            let newScale = savedScale.value * e.scale;

            // Apply limits
            if (newScale < 1) newScale = 1;
            if (newScale > 5) newScale = 5;

            if (savedScale.value === 1 && newScale === 1) {
                // Don't adjust translation if we're at minimum scale
                return;
            }

            // Get the dimensions
            const centerX = width / 2;
            const centerY = height / 2;

            // Calculate scale factor difference
            const scaleFactor = newScale / savedScale.value;

            // Convert the focal point to be relative to the image's current center
            // This considers both the image center and the current translation
            const focusX = focalX.value - centerX - savedTranslateX.value;
            const focusY = focalY.value - centerY - savedTranslateY.value;

            // Calculate new translation to keep the focal point fixed on screen
            // This formula works for both zooming in and out
            translateX.value =
                savedTranslateX.value - (scaleFactor - 1) * focusX;
            translateY.value =
                savedTranslateY.value - (scaleFactor - 1) * focusY;

            // Apply the new scale
            scale.value = newScale;
        });

    // Create a pan gesture
    const panGesture = Gesture.Pan()
        .onStart(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
        })
        .onUpdate((e) => {
            // Only allow panning if zoomed in
            if (scale.value > 1) {
                translateX.value = savedTranslateX.value + e.translationX;
                translateY.value = savedTranslateY.value + e.translationY;
            }
        });

    // Double tap gesture for resetting zoom
    const doubleTapGesture = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
            runOnJS(resetImage)();
        });

    // Combine gestures
    const combinedGestures = Gesture.Simultaneous(
        pinchGesture,
        panGesture,
        doubleTapGesture
    );

    const animatedImageStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { scale: scale.value },
            ],
        };
    });

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={handleClose}
                    >
                        <IconSymbol name="xmark" size={24} color="white" />
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
            </SafeAreaView>
        </ThemedView>
    );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        justifyContent: "flex-end",
        padding: 16,
    },
    closeButton: {
        padding: 8,
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
