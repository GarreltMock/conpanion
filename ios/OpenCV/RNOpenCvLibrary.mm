#import "RNOpenCvLibrary.h"
#import <React/RCTLog.h>
#import <opencv2/imgproc/imgproc.hpp>
#import <opencv2/core/core.hpp>
#import <opencv2/imgcodecs/ios.h>
#import <opencv2/objdetect.hpp>

@implementation RNOpenCvLibrary

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}
RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(preprocess:(NSString *)imageAsBase64
                  callback:(RCTResponseSenderBlock)callback)
{
  UIImage* image = [self decodeAndNormalizeBase64Image:imageAsBase64];
  if (!image) {
    callback(@[@"Invalid image", [NSNull null]]);
    return;
  }
  cv::Mat src;
  UIImageToMat(image, src);

  int origWidth = src.cols;
  int origHeight = src.rows;

  cv::Mat resized;
  cv::resize(src, resized, cv::Size(256, 256), 0, 0, cv::INTER_LINEAR);

  cv::Mat floatImg;
  resized.convertTo(floatImg, CV_32FC3, 1.0 / 255.0);

  // Convert HWC to CHW
  std::vector<cv::Mat> channels(3);
  cv::split(floatImg, channels);
  std::vector<float> chwData;
  for (int c = 0; c < 3; ++c) {
    chwData.insert(chwData.end(), (float*)channels[c].datastart, (float*)channels[c].dataend);
  }

  NSData *data = [NSData dataWithBytes:chwData.data() length:chwData.size() * sizeof(float)];
  NSString *base64 = [data base64EncodedStringWithOptions:0];

  NSDictionary *result = @{
    @"data": base64,
    @"originalSize": @{@"width": @(origWidth), @"height": @(origHeight)}
  };
  callback(@[[NSNull null], result]);
}

RCT_EXPORT_METHOD(postprocessHeatmap:(NSString *)heatmapBase64
                  originalWidth:(nonnull NSNumber *)width
                  originalHeight:(nonnull NSNumber *)height
                  callback:(RCTResponseSenderBlock)callback)
{
  NSData *heatmapData = [[NSData alloc] initWithBase64EncodedString:heatmapBase64 options:0];
  if (!heatmapData) {
    callback(@[@"Invalid heatmap", [NSNull null]]);
    return;
  }
  int H = 128, W = 128, C = 4; // Assume 4 channels, 128x128
  const float *heatmapPtr = (const float *)heatmapData.bytes;

  NSMutableArray *polygon = [NSMutableArray array];

  for (int c = 0; c < C; ++c) {
    cv::Mat mat(H, W, CV_32F, (void*)(heatmapPtr + c * H * W));
    cv::Mat resized;
    cv::resize(mat, resized, cv::Size([width intValue], [height intValue]), 0, 0, cv::INTER_LINEAR);

    cv::Mat thresh;
    cv::threshold(resized, thresh, 0.3, 1.0, cv::THRESH_BINARY);

    cv::Mat binary;
    thresh.convertTo(binary, CV_8U, 255);

    std::vector<std::vector<cv::Point>> contours;
    cv::findContours(binary, contours, cv::RETR_EXTERNAL, cv::CHAIN_APPROX_SIMPLE);

    double maxArea = 0;
    int maxIdx = -1;
    for (int i = 0; i < contours.size(); ++i) {
      double area = cv::contourArea(contours[i]);
      if (area > maxArea) {
        maxArea = area;
        maxIdx = i;
      }
    }
    if (maxIdx >= 0) {
      cv::Moments m = cv::moments(contours[maxIdx]);
      if (m.m00 != 0) {
        float cx = m.m10 / m.m00;
        float cy = m.m01 / m.m00;
        [polygon addObject:@[@(cx), @(cy)]];
      }
    }
  }
  callback(@[[NSNull null], polygon]);
}

RCT_EXPORT_METHOD(transformImage:(NSString *)imageAsBase64
                  corners:(NSArray *)corners
                  callback:(RCTResponseSenderBlock)callback)
{
  // Decode image
  UIImage* image = [self decodeAndNormalizeBase64Image:imageAsBase64];
  if (!image || ![corners isKindOfClass:[NSArray class]] || [corners count] != 4) {
    callback(@[@"Invalid input", [NSNull null]]);
    return;
  }

  cv::Mat src;
  UIImageToMat(image, src);

  // Prepare source points from corners
  std::vector<cv::Point2f> srcPts;
  for (int i = 0; i < 4; ++i) {
    NSArray *pt = corners[i];
    if (![pt isKindOfClass:[NSArray class]] || [pt count] != 2) {
      callback(@[@"Invalid corner format", [NSNull null]]);
      return;
    }
    float x = [pt[0] floatValue];
    float y = [pt[1] floatValue];
    srcPts.push_back(cv::Point2f(x, y));
  }

  // Compute width and height
  auto distance = [](cv::Point2f a, cv::Point2f b) {
    return std::sqrt((a.x - b.x)*(a.x - b.x) + (a.y - b.y)*(a.y - b.y));
  };
  float heightLeft = distance(srcPts[0], srcPts[3]);
  float heightRight = distance(srcPts[1], srcPts[2]);
  float height = std::min(heightLeft, heightRight);
  float ratio = 16.0f / 9.0f;
  float width = height * ratio;

  std::vector<cv::Point2f> dstPts = {
    cv::Point2f(0, 0),
    cv::Point2f(width, 0),
    cv::Point2f(width, height),
    cv::Point2f(0, height)
  };

  cv::Mat M = cv::getPerspectiveTransform(srcPts, dstPts);
  cv::Mat dst;
  cv::warpPerspective(src, dst, M, cv::Size((int)width, (int)height), cv::INTER_LINEAR, cv::BORDER_CONSTANT);

  // Convert BGR to RGB before encoding
  cv::Mat dst_rgb;
  cv::cvtColor(dst, dst_rgb, cv::COLOR_BGR2RGB);

  // Encode result to PNG base64
  std::vector<uchar> buf;
  cv::imencode(".png", dst_rgb, buf);
  NSData *imgData = [NSData dataWithBytes:buf.data() length:buf.size()];
  NSString *base64 = [imgData base64EncodedStringWithOptions:0];

  NSDictionary *result = @{
    @"data": base64,
    @"width": @((int)width),
    @"height": @((int)height)
  };
  callback(@[[NSNull null], result]);
}

RCT_EXPORT_METHOD(readQRCode:(NSString *)imageAsBase64
                  callback:(RCTResponseSenderBlock)callback)
{
  UIImage* image = [self decodeBase64ImageForQr:imageAsBase64];
  if (!image) {
    callback(@[@"Invalid image", [NSNull null]]);
    return;
  }

  cv::Mat src;
  UIImageToMat(image, src);

  cv::Mat gray;
  cv::cvtColor(src, gray, cv::COLOR_RGBA2GRAY);

  // Create QR code detector
  cv::QRCodeDetector qrDetector;

  // Detect and decode QR codes
  std::vector<cv::Point2f> points;
  std::string decodedText = qrDetector.detectAndDecode(gray, points);

  NSMutableDictionary *result = [NSMutableDictionary dictionary];

  if (!decodedText.empty()) {
    result[@"text"] = [NSString stringWithUTF8String:decodedText.c_str()];
    result[@"found"] = @YES;

    // Extract corner points if available
    if (points.size() == 4) {
      NSMutableArray *corners = [NSMutableArray array];
      for (const auto& point : points) {
        [corners addObject:@[@(point.x), @(point.y)]];
      }
      result[@"corners"] = corners;
    }
  } else {
    result[@"found"] = @NO;
    result[@"text"] = @"";
  }

  callback(@[[NSNull null], result]);
}

- (UIImage *)decodeBase64ImageForQr:(NSString *)strEncodeData {
  NSData *data = [[NSData alloc]initWithBase64EncodedString:strEncodeData options:NSDataBase64DecodingIgnoreUnknownCharacters];
  UIImage *image = [UIImage imageWithData:data];
  if (!image) return nil;

  return [self normalizeImageOrientation:image withImageData:data];
}

- (UIImage *)normalizeImageOrientation:(UIImage *)image withImageData:(NSData *)imageData {
  // Handle orientation correction similar to Android version
  if (image.imageOrientation == UIImageOrientationUp) return image;

  UIGraphicsBeginImageContextWithOptions(image.size, NO, image.scale);
  [image drawInRect:CGRectMake(0, 0, image.size.width, image.size.height)];
  UIImage *normalizedImage = UIGraphicsGetImageFromCurrentImageContext();
  UIGraphicsEndImageContext();
  return normalizedImage;
}

- (UIImage *)decodeAndNormalizeBase64Image:(NSString *)strEncodeData {
  NSData *data = [[NSData alloc]initWithBase64EncodedString:strEncodeData options:NSDataBase64DecodingIgnoreUnknownCharacters];
  UIImage *image = [UIImage imageWithData:data];
  if (!image) return nil;

  return [self normalizeImageOrientation:image withImageData:data];
}

@end
