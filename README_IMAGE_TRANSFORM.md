# Document Image Transform

This module provides functionality to detect document corners in an image and transform the image to create a properly aligned document view.

## Setup

1. Place the ONNX model files in the `assets/models/` directory:
   - `model_point.onnx` - Model for point detection
   - `model_heat.onnx` - Model for heatmap detection

2. Install the required dependencies:
   ```
   npm install onnxruntime-react-native react-native-opencv expo-image-manipulator
   ```

3. Make sure the following Expo dependencies are installed:
   - expo-file-system
   - expo-image-manipulator

## Usage Example

Here's an example of how to use the image transform hook in a React Native component:

```tsx
import React, { useState } from 'react';
import { View, Image, Button, ActivityIndicator, StyleSheet, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useImageTransform } from '../hooks/useImageTransform';
import { Polygon } from '../hooks/helper/docaligner';

const DocumentScannerScreen = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [detectedCorners, setDetectedCorners] = useState<Polygon | null>(null);
  const [processing, setProcessing] = useState(false);
  
  const { 
    isInitialized, 
    isLoading, 
    error, 
    processImageFromUri
  } = useImageTransform();
  
  const pickImage = async () => {
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
  };
  
  const processImage = async () => {
    if (!originalImage || !isInitialized) return;
    
    setProcessing(true);
    try {
      const result = await processImageFromUri(originalImage);
      setDetectedCorners(result.corners);
      
      if (result.transformed) {
        setTransformedImage(result.transformed.uri);
      }
    } catch (err) {
      console.error('Error processing image:', err);
      alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setProcessing(false);
    }
  };
  
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading models...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Button title="Pick an image" onPress={pickImage} disabled={processing} />
      
      {originalImage && (
        <>
          <Text style={styles.label}>Original Image:</Text>
          <Image source={{ uri: originalImage }} style={styles.image} />
          <Button 
            title={processing ? "Processing..." : "Detect & Transform"} 
            onPress={processImage} 
            disabled={processing || !isInitialized} 
          />
        </>
      )}
      
      {transformedImage && (
        <>
          <Text style={styles.label}>Transformed Image:</Text>
          <Image source={{ uri: transformedImage }} style={styles.image} />
        </>
      )}
      
      {!transformedImage && detectedCorners && (
        <Text style={styles.message}>
          Corners detected but couldn't transform the image properly
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 300,
    height: 400,
    resizeMode: 'contain',
    marginVertical: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  message: {
    color: 'orange',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
});

export default DocumentScannerScreen;
```

## Integration Notes

1. **Models**: The ONNX models need to be placed in the assets directory and will be copied to the app's document directory on initialization.

2. **Performance**: The image processing operations are resource-intensive. Consider adding UI feedback for processing time on larger images.

3. **Debugging**: If you encounter issues with model loading or image processing, check that:
   - ONNX models are correctly placed in the assets/models directory
   - The image format is supported by the app
   - The image isn't too large (consider resizing very large images before processing)

4. **Permissions**: Ensure your app has the necessary permissions to access the camera and photo library.