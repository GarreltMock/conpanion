import React, { useState, useEffect, useRef } from "react";
import {
    StyleSheet,
    View,
    TouchableOpacity,
    Dimensions,
    SafeAreaView,
    ActivityIndicator,
    Text,
    Alert,
    Image,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    runOnJS,
    useAnimatedRef,
    measure,
} from "react-native-reanimated";
import Svg, { Polygon, Circle } from "react-native-svg";

import { IconSymbol } from "@/components/ui/IconSymbol";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Point, Polygon as PolygonType } from "@/types";
import { useImageTransform } from "@/hooks/useImageTransform";

export default function ImageViewModal() {
    const { imageUri, originalUri, hasCorners } = useLocalSearchParams<{
        imageUri: string;
        originalUri?: string;
        hasCorners?: string;
    }>();
    const decodedUri = decodeURIComponent(imageUri as string);
    const decodedOriginalUri = originalUri ? decodeURIComponent(originalUri as string) : null;
    const hasOriginalCorners = hasCorners === "true";

    // State for edit mode
    const [isEditMode, setIsEditMode] = useState(false);
    const [corners, setCorners] = useState<PolygonType | null>(null);
    const [loading, setLoading] = useState(false);
    const imageRef = useAnimatedRef<Animated.Image>();
    const [imageLayout, setImageLayout] = useState({ width: 0, height: 0, x: 0, y: 0 });

    // For image transformations
    const { processImageFromUri, transformImageWithCorners } = useImageTransform();

    // Normal view mode state
    const scale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedScale = useSharedValue(1);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);
    const focalX = useSharedValue(0);
    const focalY = useSharedValue(0);
    const isPinching = useSharedValue(false);

    // When entering edit mode, try to load better corners from the image (only if we have corner detection capability)
    useEffect(() => {
        console.log('First effect - isEditMode:', isEditMode, 'decodedOriginalUri:', !!decodedOriginalUri, 'hasOriginalCorners:', hasOriginalCorners);
        if (isEditMode && decodedOriginalUri && hasOriginalCorners && corners) {
            console.log('Attempting to load detected corners to replace fallback corners');
            loadImageCorners();
        }
    }, [isEditMode, decodedOriginalUri, hasOriginalCorners]);

    // Set default corners when image layout is ready (only if we don't have corners yet)
    useEffect(() => {
        console.log('Second effect triggered:', { isEditMode, corners: !!corners, imageLayout });
        // Only set default corners if we don't have any and the image layout is ready
        // This is a backup for cases where the immediate fallback corners in handleToggleEditMode weren't set
        if (isEditMode && !corners && imageLayout.width > 0 && imageLayout.height > 0) {
            console.log('Calling setDefaultCorners as backup');
            setDefaultCorners();
        }
    }, [isEditMode, corners, imageLayout.width, imageLayout.height, setDefaultCorners]);

    // Load corners from original image if available
    const loadImageCorners = async () => {
        const sourceImageUri = decodedOriginalUri || decodedUri;
        if (!sourceImageUri) {
            console.log('No image URI available, setting default corners');
            setDefaultCorners();
            return;
        }

        console.log('Loading image corners for:', sourceImageUri);
        setLoading(true);
        try {
            // Get original image dimensions first
            const { width: originalWidth, height: originalHeight } = await getImageDimensions(sourceImageUri);
            console.log('Original image dimensions:', { originalWidth, originalHeight });

            // If we already know the image has corners, try to detect them
            if (hasOriginalCorners) {
                console.log('Trying to detect corners from image');
                const result = await processImageFromUri(sourceImageUri);
                if (result.corners && result.corners.length === 4) {
                    console.log('Found corners from image (image coordinates):', result.corners);
                    
                    // Transform corners from image coordinates to screen coordinates
                    const transformedCorners = transformCornersToScreen(result.corners, originalWidth, originalHeight);
                    console.log('Transformed corners to screen coordinates:', transformedCorners);
                    setCorners(transformedCorners);
                } else {
                    console.log('Corner detection failed, setting default corners');
                    setDefaultCorners();
                }
            } else {
                console.log('No original corners, setting default corners');
                setDefaultCorners();
            }
        } catch (error) {
            console.error("Error loading image corners:", error);
            console.log('Error occurred, setting default corners');
            setDefaultCorners();
        } finally {
            setLoading(false);
        }
    };

    // Set default corners to the image bounds
    const setDefaultCorners = () => {
        // Only proceed if we have image dimensions
        if (imageLayout.width === 0 || imageLayout.height === 0) {
            console.log('Cannot set default corners - no image layout:', imageLayout);
            return;
        }

        console.log('Setting default corners with layout:', imageLayout);

        // Set corners to 10% inset from the image edges
        const inset = 0.1;
        const width = imageLayout.width;
        const height = imageLayout.height;
        const x = imageLayout.x;
        const y = imageLayout.y;

        const topLeft: Point = [x + width * inset, y + height * inset];
        const topRight: Point = [x + width * (1 - inset), y + height * inset];
        const bottomRight: Point = [x + width * (1 - inset), y + height * (1 - inset)];
        const bottomLeft: Point = [x + width * inset, y + height * (1 - inset)];

        const newCorners = [topLeft, topRight, bottomRight, bottomLeft];
        console.log('Setting corners to:', newCorners);
        setCorners(newCorners);
    };

    const handleClose = () => {
        router.back();
    };

    // Get original image dimensions
    const getImageDimensions = (uri: string): Promise<{ width: number; height: number }> => {
        return new Promise((resolve, reject) => {
            Image.getSize(
                uri,
                (width, height) => resolve({ width, height }),
                (error) => reject(error)
            );
        });
    };

    // Transform corners from image coordinates to screen coordinates
    const transformCornersToScreen = (imageCorners: PolygonType, originalImageWidth: number, originalImageHeight: number): PolygonType => {
        if (!imageLayout.width || !imageLayout.height) {
            console.log('No image layout available for transformation');
            return imageCorners;
        }

        // Calculate scale factor - the image is displayed with resizeMode="contain"
        // so we need to figure out how it's scaled and positioned
        const displayAspectRatio = imageLayout.width / imageLayout.height;
        const originalAspectRatio = originalImageWidth / originalImageHeight;
        
        let scaleX, scaleY, offsetX, offsetY;
        
        if (originalAspectRatio > displayAspectRatio) {
            // Image is wider, so it's constrained by width
            scaleX = scaleY = imageLayout.width / originalImageWidth;
            offsetX = imageLayout.x;
            offsetY = imageLayout.y + (imageLayout.height - (originalImageHeight * scaleY)) / 2;
        } else {
            // Image is taller, so it's constrained by height  
            scaleX = scaleY = imageLayout.height / originalImageHeight;
            offsetX = imageLayout.x + (imageLayout.width - (originalImageWidth * scaleX)) / 2;
            offsetY = imageLayout.y;
        }

        console.log('Transform params:', { scaleX, scaleY, offsetX, offsetY, imageLayout, originalImageWidth, originalImageHeight });

        // Transform each corner
        const transformedCorners = imageCorners.map(([x, y]) => {
            const screenX = x * scaleX + offsetX;
            const screenY = y * scaleY + offsetY;
            console.log(`Transforming (${x}, ${y}) -> (${screenX}, ${screenY})`);
            return [screenX, screenY] as Point;
        });

        return transformedCorners;
    };

    // Transform corners from screen coordinates back to image coordinates
    const transformCornersToImage = (screenCorners: PolygonType, originalImageWidth: number, originalImageHeight: number): PolygonType => {
        if (!imageLayout.width || !imageLayout.height) {
            console.log('No image layout available for reverse transformation');
            return screenCorners;
        }

        // Calculate scale factor and offsets (same logic as transformCornersToScreen)
        const displayAspectRatio = imageLayout.width / imageLayout.height;
        const originalAspectRatio = originalImageWidth / originalImageHeight;
        
        let scaleX, scaleY, offsetX, offsetY;
        
        if (originalAspectRatio > displayAspectRatio) {
            scaleX = scaleY = imageLayout.width / originalImageWidth;
            offsetX = imageLayout.x;
            offsetY = imageLayout.y + (imageLayout.height - (originalImageHeight * scaleY)) / 2;
        } else {
            scaleX = scaleY = imageLayout.height / originalImageHeight;
            offsetX = imageLayout.x + (imageLayout.width - (originalImageWidth * scaleX)) / 2;
            offsetY = imageLayout.y;
        }

        // Reverse transform each corner
        const imageCorners = screenCorners.map(([screenX, screenY]) => {
            const imageX = (screenX - offsetX) / scaleX;
            const imageY = (screenY - offsetY) / scaleY;
            console.log(`Reverse transforming (${screenX}, ${screenY}) -> (${imageX}, ${imageY})`);
            return [imageX, imageY] as Point;
        });

        return imageCorners;
    };

    const handleToggleEditMode = () => {
        if (isEditMode) {
            // Exit edit mode
            console.log('Exiting edit mode');
            setIsEditMode(false);
            setCorners(null); // Clear corners when exiting edit mode
        } else {
            // Enter edit mode
            console.log('Entering edit mode');
            setIsEditMode(true);
            // Set immediate fallback corners to ensure something is always visible
            const fallbackCorners: PolygonType = [
                [100, 100],     // top-left
                [300, 100],    // top-right  
                [300, 400],   // bottom-right
                [100, 400]     // bottom-left
            ];
            console.log('Setting immediate fallback corners:', fallbackCorners);
            setCorners(fallbackCorners);
        }
    };

    const handleSaveCorners = async () => {
        if (!corners || corners.length !== 4) return;

        // Use original URI if available, otherwise use the main image URI
        const sourceImageUri = decodedOriginalUri || decodedUri;
        console.log('Processing image with URI:', sourceImageUri);

        setLoading(true);
        try {
            // Get original image dimensions for coordinate transformation
            const { width: originalWidth, height: originalHeight } = await getImageDimensions(sourceImageUri);
            console.log('Original image dimensions for save:', { originalWidth, originalHeight });

            // Transform screen coordinates back to image coordinates
            const imageCorners = transformCornersToImage(corners, originalWidth, originalHeight);
            console.log('Transformed corners to image coordinates for processing:', imageCorners);

            // Transform the image with the new corners (in image coordinates)
            const result = await transformImageWithCorners(sourceImageUri, imageCorners);

            // Redirect to the new transformed image
            router.replace({
                pathname: "/modals/image-view",
                params: {
                    imageUri: encodeURIComponent(result.uri),
                    originalUri: encodeURIComponent(sourceImageUri),
                    hasCorners: "true",
                },
            });
        } catch (error) {
            console.error("Error transforming image:", error);
            Alert.alert("Transformation Error", "Failed to transform the image with the selected corners.");
            setIsEditMode(false);
        } finally {
            setLoading(false);
        }
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

    // Update a specific corner position - defined early to ensure it's available for runOnJS
    const updateCorner = React.useCallback((index: number, x: number, y: number) => {
        console.log(`Updating corner ${index} to (${x}, ${y})`);
        
        setCorners((prevCorners) => {
            if (!prevCorners || prevCorners.length !== 4) {
                console.log('Invalid corners state, cannot update');
                return prevCorners;
            }
            
            const newCorners = [...prevCorners];
            newCorners[index] = [x, y];
            console.log('New corners:', newCorners);
            return newCorners;
        });
    }, []);

    // Shared values to store current corner positions
    const corner0X = useSharedValue(50);
    const corner0Y = useSharedValue(50);
    const corner1X = useSharedValue(350);
    const corner1Y = useSharedValue(50);
    const corner2X = useSharedValue(350);
    const corner2Y = useSharedValue(450);
    const corner3X = useSharedValue(50);
    const corner3Y = useSharedValue(450);

    // Shared values to track start positions for each gesture
    const corner0StartX = useSharedValue(0);
    const corner0StartY = useSharedValue(0);
    const corner1StartX = useSharedValue(0);
    const corner1StartY = useSharedValue(0);
    const corner2StartX = useSharedValue(0);
    const corner2StartY = useSharedValue(0);
    const corner3StartX = useSharedValue(0);
    const corner3StartY = useSharedValue(0);

    // Update shared values when corners state changes
    useEffect(() => {
        if (corners && corners.length === 4) {
            corner0X.value = corners[0][0];
            corner0Y.value = corners[0][1];
            corner1X.value = corners[1][0];
            corner1Y.value = corners[1][1];
            corner2X.value = corners[2][0];
            corner2Y.value = corners[2][1];
            corner3X.value = corners[3][0];
            corner3Y.value = corners[3][1];
        }
    }, [corners, corner0X, corner0Y, corner1X, corner1Y, corner2X, corner2Y, corner3X, corner3Y]);

    // Create pan gestures for each corner
    const corner0Gesture = Gesture.Pan()
        .onStart(() => {
            corner0StartX.value = corner0X.value;
            corner0StartY.value = corner0Y.value;
        })
        .onUpdate((event) => {
            corner0X.value = corner0StartX.value + event.translationX;
            corner0Y.value = corner0StartY.value + event.translationY;
        })
        .onEnd(() => {
            runOnJS(updateCorner)(0, corner0X.value, corner0Y.value);
        });

    const corner1Gesture = Gesture.Pan()
        .onStart(() => {
            corner1StartX.value = corner1X.value;
            corner1StartY.value = corner1Y.value;
        })
        .onUpdate((event) => {
            corner1X.value = corner1StartX.value + event.translationX;
            corner1Y.value = corner1StartY.value + event.translationY;
        })
        .onEnd(() => {
            runOnJS(updateCorner)(1, corner1X.value, corner1Y.value);
        });

    const corner2Gesture = Gesture.Pan()
        .onStart(() => {
            corner2StartX.value = corner2X.value;
            corner2StartY.value = corner2Y.value;
        })
        .onUpdate((event) => {
            corner2X.value = corner2StartX.value + event.translationX;
            corner2Y.value = corner2StartY.value + event.translationY;
        })
        .onEnd(() => {
            runOnJS(updateCorner)(2, corner2X.value, corner2Y.value);
        });

    const corner3Gesture = Gesture.Pan()
        .onStart(() => {
            corner3StartX.value = corner3X.value;
            corner3StartY.value = corner3Y.value;
        })
        .onUpdate((event) => {
            corner3X.value = corner3StartX.value + event.translationX;
            corner3Y.value = corner3StartY.value + event.translationY;
        })
        .onEnd(() => {
            runOnJS(updateCorner)(3, corner3X.value, corner3Y.value);
        });

    // Array of gestures for easy access
    const cornerGestures = [corner0Gesture, corner1Gesture, corner2Gesture, corner3Gesture];

    // Create animated styles for each corner
    const corner0Style = useAnimatedStyle(() => ({
        left: corner0X.value - 15,
        top: corner0Y.value - 15,
    }));

    const corner1Style = useAnimatedStyle(() => ({
        left: corner1X.value - 15,
        top: corner1Y.value - 15,
    }));

    const corner2Style = useAnimatedStyle(() => ({
        left: corner2X.value - 15,
        top: corner2Y.value - 15,
    }));

    const corner3Style = useAnimatedStyle(() => ({
        left: corner3X.value - 15,
        top: corner3Y.value - 15,
    }));

    const cornerStyles = [corner0Style, corner1Style, corner2Style, corner3Style];


    // Render the corner editor interface
    const renderCornerEditor = () => {
        if (!corners || corners.length !== 4) {
            console.log('No corners to render:', corners);
            return null;
        }

        console.log('Rendering corners:', corners);

        // Create SVG polygon points string from corners
        const polygonPoints = corners.map((point) => `${point[0]},${point[1]}`).join(" ");

        return (
            <View style={styles.editorContainer}>
                <Svg style={StyleSheet.absoluteFill}>
                    <Polygon points={polygonPoints} fill="none" stroke="rgba(0, 122, 255, 0.8)" strokeWidth="3" />
                </Svg>

                {corners.map((corner, index) => {
                    console.log(`Corner ${index}:`, corner);
                    
                    return (
                        <GestureDetector key={`corner-${index}`} gesture={cornerGestures[index]}>
                            <Animated.View
                                style={[
                                    styles.cornerHandle,
                                    cornerStyles[index],
                                    {
                                        backgroundColor: 'red', // Make visible for debugging
                                    },
                                ]}
                            >
                                <View style={styles.cornerHandleInner} />
                            </Animated.View>
                        </GestureDetector>
                    );
                })}

                <View style={styles.cornerLabels}>
                    <ThemedText style={styles.cornerLabel}>
                        Drag the corners to adjust the document boundaries
                    </ThemedText>
                </View>
            </View>
        );
    };

    // When in edit mode, show the original image with editable corners
    // When in view mode, show the regular image with zoom/pan
    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.editButton} onPress={handleToggleEditMode} disabled={loading}>
                        <IconSymbol name={isEditMode ? "eye" : "pencil"} size={22} color="white" />
                        <ThemedText style={styles.editButtonText}>{isEditMode ? "View" : "Edit"}</ThemedText>
                    </TouchableOpacity>

                    <View style={{ flex: 1 }} />

                    <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                        <IconSymbol name="xmark" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#007AFF" />
                        <ThemedText style={styles.loadingText}>
                            {isEditMode ? "Processing image..." : "Loading..."}
                        </ThemedText>
                    </View>
                ) : isEditMode ? (
                    // Edit mode - show original image with editable corners
                    <View style={styles.imageContainer}>
                        <Animated.Image
                            ref={imageRef}
                            source={{ uri: decodedOriginalUri || decodedUri }}
                            style={styles.image}
                            resizeMode="contain"
                            onLayout={(event) => {
                                const { x, y, width, height } = event.nativeEvent.layout;
                                setImageLayout({ x, y, width, height });
                            }}
                        />
                        {renderCornerEditor()}

                        <View style={styles.editActions}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.cancelButton]}
                                onPress={() => {
                                    console.log('Cancel button pressed');
                                    setIsEditMode(false);
                                }}
                            >
                                <ThemedText style={styles.actionButtonText}>Cancel</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionButton, styles.saveButton]}
                                onPress={() => {
                                    console.log('Transform button pressed');
                                    handleSaveCorners();
                                }}
                                disabled={!corners}
                            >
                                <ThemedText style={styles.actionButtonText}>Transform</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    // View mode - zoomable/pannable image
                    <GestureDetector gesture={combinedGestures}>
                        <Animated.View style={styles.imageContainer}>
                            <Animated.Image
                                source={{ uri: decodedUri }}
                                style={[styles.image, animatedImageStyle]}
                                resizeMode="contain"
                            />
                        </Animated.View>
                    </GestureDetector>
                )}
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
        alignItems: "center",
        padding: 16,
    },
    closeButton: {
        padding: 8,
    },
    editButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.2)",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
    },
    editButtonText: {
        color: "white",
        marginLeft: 6,
        fontSize: 14,
    },
    imageContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    image: {
        width: width,
        height: height * 0.8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "white",
    },
    editorContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
    },
    cornerHandle: {
        position: "absolute",
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 20,
    },
    cornerHandleInner: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "rgba(0, 122, 255, 0.8)",
        borderWidth: 2,
        borderColor: "white",
    },
    cornerLabels: {
        position: "absolute",
        top: 20,
        left: 0,
        right: 0,
        alignItems: "center",
    },
    cornerLabel: {
        backgroundColor: "rgba(0,0,0,0.7)",
        color: "white",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        fontSize: 14,
    },
    editActions: {
        position: "absolute",
        bottom: 40,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "center",
        paddingHorizontal: 20,
        zIndex: 20, // Higher than editorContainer to ensure buttons are clickable
    },
    actionButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginHorizontal: 8,
        minWidth: 120,
        alignItems: "center",
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    cancelButton: {
        backgroundColor: "rgba(150, 150, 150, 0.8)",
    },
    saveButton: {
        backgroundColor: "rgba(0, 122, 255, 0.8)",
    },
});
