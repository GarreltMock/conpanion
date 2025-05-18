/**
 * Provides a TypeScript definition for the ImageData interface,
 * which is not natively available in React Native
 */
interface ImageData {
    /**
     * The Uint8ClampedArray containing the image pixel data
     */
    readonly data: Uint8ClampedArray;
    
    /**
     * The width of the image in pixels
     */
    readonly width: number;
    
    /**
     * The height of the image in pixels
     */
    readonly height: number;
}

/**
 * Constructor for ImageData objects
 */
declare var ImageData: {
    prototype: ImageData;
    new(data: Uint8ClampedArray, width: number, height: number): ImageData;
    new(width: number, height: number): ImageData;
};