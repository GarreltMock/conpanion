import { Dimensions } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

/**
 * Custom hook for image zoom and pan functionality
 * Provides pinch-to-zoom with focal point support and pan gestures
 */
export function useImageZoomPan() {
    // View mode state for zoom and pan
    const scale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedScale = useSharedValue(1);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);
    const focalX = useSharedValue(0);
    const focalY = useSharedValue(0);
    const isPinching = useSharedValue(false);

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
            isPinching.value = true;
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
            translateX.value = savedTranslateX.value - (scaleFactor - 1) * focusX;
            translateY.value = savedTranslateY.value - (scaleFactor - 1) * focusY;

            // Apply the new scale
            scale.value = newScale;
        })
        .onEnd(() => {
            isPinching.value = false;

            if (scale.value <= 1) {
                // Reset if scale is less than 1
                runOnJS(resetImage)();
            }
        });

    // Create a pan gesture
    const panGesture = Gesture.Pan()
        .onStart(() => {
            // Don't start pan if we're pinching
            if (isPinching.value) return false;

            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
            return true;
        })
        .onUpdate((e) => {
            // Only allow panning if zoomed in and not pinching
            if (scale.value > 1 && !isPinching.value) {
                translateX.value = savedTranslateX.value + e.translationX;
                translateY.value = savedTranslateY.value + e.translationY;
            }
        });

    // Combine gestures
    const combinedGestures = Gesture.Simultaneous(pinchGesture, panGesture);

    const animatedImageStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
        };
    });

    return {
        combinedGestures,
        animatedImageStyle,
        resetImage,
    };
}
