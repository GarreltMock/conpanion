import React, { createContext, useContext, useState, ReactNode } from "react";

interface TransformedImageData {
    originalImageUri: string;
    newImageUri: string;
    originalUri: string;
    corners: [number, number][]; // The corners used for transformation (in image coordinates)
    timestamp: number;
    detectedUrls?: string[]; // URLs detected from QR codes in the transformed image
}

interface ImageTransformContextType {
    lastTransformedImage: TransformedImageData | null;
    notifyImageTransformed: (data: TransformedImageData) => void;
    clearLastTransformed: () => void;
}

const ImageTransformContext = createContext<ImageTransformContextType | undefined>(undefined);

export function ImageTransformProvider({ children }: { children: ReactNode }) {
    const [lastTransformedImage, setLastTransformedImage] = useState<TransformedImageData | null>(null);

    const notifyImageTransformed = (data: TransformedImageData) => {
        setLastTransformedImage(data);
    };

    const clearLastTransformed = () => {
        setLastTransformedImage(null);
    };

    return (
        <ImageTransformContext.Provider
            value={{
                lastTransformedImage,
                notifyImageTransformed,
                clearLastTransformed,
            }}
        >
            {children}
        </ImageTransformContext.Provider>
    );
}

export function useImageTransformNotification() {
    const context = useContext(ImageTransformContext);
    if (context === undefined) {
        throw new Error("useImageTransformNotification must be used within an ImageTransformProvider");
    }
    return context;
}
