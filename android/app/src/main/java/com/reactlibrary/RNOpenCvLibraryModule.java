package com.reactlibrary;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.Arguments;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;

import org.opencv.core.CvType;
import org.opencv.core.Mat;
import org.opencv.core.Size;
import org.opencv.core.Point;
import org.opencv.core.MatOfPoint;
import org.opencv.core.MatOfPoint2f;

import org.opencv.android.Utils;
import org.opencv.imgproc.Imgproc;
import org.opencv.imgproc.Moments;

import android.util.Base64;

import java.util.List;
import java.util.ArrayList;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.io.ByteArrayOutputStream;

public class RNOpenCvLibraryModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;

    public RNOpenCvLibraryModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "RNOpenCvLibrary";
    }

    @ReactMethod
    public void preprocess(String imageAsBase64, Callback callback) {
        try {
            Bitmap image = decodeBase64Image(imageAsBase64);
            if (image == null) {
                callback.invoke("Invalid image", null);
                return;
            }

            Mat src = new Mat();
            Utils.bitmapToMat(image, src);

            // Convert RGBA to RGB if needed
            if (src.channels() == 4) {
                Imgproc.cvtColor(src, src, Imgproc.COLOR_RGBA2RGB);
            }

            int origWidth = src.cols();
            int origHeight = src.rows();

            // Resize to 256x256
            Mat resized = new Mat();
            Imgproc.resize(src, resized, new Size(256, 256), 0, 0, Imgproc.INTER_LINEAR);

            // Convert to float and normalize
            Mat floatImg = new Mat();
            resized.convertTo(floatImg, CvType.CV_32FC3, 1.0 / 255.0);

            // Convert HWC to CHW
            List<Mat> channels = new ArrayList<>();
            org.opencv.core.Core.split(floatImg, channels);

            float[] chwData = new float[3 * 256 * 256];
            int idx = 0;
            for (int c = 0; c < 3; c++) {
                float[] channelData = new float[256 * 256];
                channels.get(c).get(0, 0, channelData);
                for (float value : channelData) {
                    chwData[idx++] = value;
                }
            }

            // Convert to base64
            ByteBuffer buffer = ByteBuffer.allocate(chwData.length * 4);
            buffer.order(ByteOrder.nativeOrder());
            for (float value : chwData) {
                buffer.putFloat(value);
            }
            String base64 = Base64.encodeToString(buffer.array(), Base64.DEFAULT);

            WritableMap originalSize = Arguments.createMap();
            originalSize.putInt("width", origWidth);
            originalSize.putInt("height", origHeight);

            WritableMap result = Arguments.createMap();
            result.putString("data", base64);
            result.putMap("originalSize", originalSize);

            callback.invoke(null, result);
        } catch (Exception e) {
            callback.invoke("Error in preprocess: " + e.getMessage(), null);
        }
    }

    @ReactMethod
    public void postprocessHeatmap(String heatmapBase64, int originalWidth, int originalHeight, Callback callback) {
        try {
            byte[] heatmapData = Base64.decode(heatmapBase64, Base64.DEFAULT);
            if (heatmapData == null) {
                callback.invoke("Invalid heatmap", null);
                return;
            }

            int H = 128, W = 128, C = 4;
            ByteBuffer buffer = ByteBuffer.wrap(heatmapData);
            buffer.order(ByteOrder.nativeOrder());

            WritableArray polygon = Arguments.createArray();

            for (int c = 0; c < C; c++) {
                // Extract channel data
                float[] channelData = new float[H * W];
                for (int i = 0; i < H * W; i++) {
                    channelData[i] = buffer.getFloat();
                }

                // Create Mat for this channel
                Mat mat = new Mat(H, W, CvType.CV_32F);
                mat.put(0, 0, channelData);

                // Resize to original dimensions
                Mat resized = new Mat();
                Imgproc.resize(mat, resized, new Size(originalWidth, originalHeight), 0, 0, Imgproc.INTER_LINEAR);

                // Threshold
                Mat thresh = new Mat();
                Imgproc.threshold(resized, thresh, 0.3, 1.0, Imgproc.THRESH_BINARY);

                // Convert to binary
                Mat binary = new Mat();
                thresh.convertTo(binary, CvType.CV_8U, 255);

                // Find contours
                List<MatOfPoint> contours = new ArrayList<>();
                Mat hierarchy = new Mat();
                Imgproc.findContours(binary, contours, hierarchy, Imgproc.RETR_EXTERNAL, Imgproc.CHAIN_APPROX_SIMPLE);

                // Find largest contour
                double maxArea = 0;
                int maxIdx = -1;
                for (int i = 0; i < contours.size(); i++) {
                    double area = Imgproc.contourArea(contours.get(i));
                    if (area > maxArea) {
                        maxArea = area;
                        maxIdx = i;
                    }
                }

                if (maxIdx >= 0) {
                    Moments m = Imgproc.moments(contours.get(maxIdx));
                    if (m.m00 != 0) {
                        double cx = m.m10 / m.m00;
                        double cy = m.m01 / m.m00;
                        WritableArray point = Arguments.createArray();
                        point.pushDouble(cx);
                        point.pushDouble(cy);
                        polygon.pushArray(point);
                    }
                }
            }

            callback.invoke(null, polygon);
        } catch (Exception e) {
            callback.invoke("Error in postprocessHeatmap: " + e.getMessage(), null);
        }
    }

    @ReactMethod
    public void transformImage(String imageAsBase64, ReadableArray corners, Callback callback) {
        try {
            Bitmap image = decodeBase64Image(imageAsBase64);
            if (image == null || corners.size() != 4) {
                callback.invoke("Invalid input", null);
                return;
            }

            Mat src = new Mat();
            Utils.bitmapToMat(image, src);

            // Convert RGBA to RGB if needed
            if (src.channels() == 4) {
                Imgproc.cvtColor(src, src, Imgproc.COLOR_RGBA2RGB);
            }

            // Prepare source points
            Point[] srcPts = new Point[4];
            for (int i = 0; i < 4; i++) {
                ReadableArray pt = corners.getArray(i);
                if (pt.size() != 2) {
                    callback.invoke("Invalid corner format", null);
                    return;
                }
                srcPts[i] = new Point(pt.getDouble(0), pt.getDouble(1));
            }

            // Calculate dimensions
            double heightLeft = distance(srcPts[0], srcPts[3]);
            double heightRight = distance(srcPts[1], srcPts[2]);
            double height = Math.min(heightLeft, heightRight);
            double ratio = 16.0 / 9.0;
            double width = height * ratio;

            // Destination points
            Point[] dstPts = {
                    new Point(0, 0),
                    new Point(width, 0),
                    new Point(width, height),
                    new Point(0, height)
            };

            // Create transformation matrix
            MatOfPoint2f srcMat = new MatOfPoint2f(srcPts);
            MatOfPoint2f dstMat = new MatOfPoint2f(dstPts);
            Mat M = Imgproc.getPerspectiveTransform(srcMat, dstMat);

            // Apply perspective transformation
            Mat dst = new Mat();
            Imgproc.warpPerspective(src, dst, M, new Size(width, height), Imgproc.INTER_LINEAR);

            // Convert to bitmap
            Bitmap resultBitmap = Bitmap.createBitmap((int)width, (int)height, Bitmap.Config.ARGB_8888);
            Utils.matToBitmap(dst, resultBitmap);

            // Encode to PNG base64
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            resultBitmap.compress(Bitmap.CompressFormat.PNG, 100, baos);
            byte[] imageBytes = baos.toByteArray();
            String base64 = Base64.encodeToString(imageBytes, Base64.DEFAULT);

            WritableMap result = Arguments.createMap();
            result.putString("data", base64);
            result.putInt("width", (int)width);
            result.putInt("height", (int)height);

            callback.invoke(null, result);
        } catch (Exception e) {
            callback.invoke("Error in transformImage: " + e.getMessage(), null);
        }
    }

    private Bitmap decodeBase64Image(String base64) {
        try {
            byte[] decodedString = Base64.decode(base64, Base64.DEFAULT);
            return BitmapFactory.decodeByteArray(decodedString, 0, decodedString.length);
        } catch (Exception e) {
            return null;
        }
    }

    private double distance(Point a, Point b) {
        return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
    }
}