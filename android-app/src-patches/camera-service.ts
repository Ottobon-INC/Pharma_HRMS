/**
 * Orca Labs Pharma HRMS — Native Camera Service
 *
 * Bridges @capacitor/camera for Android with the existing
 * web getUserMedia flow used by CheckInModule & CallPhotoCaptureView.
 *
 * Place: src/lib/services/camera-service.ts (in the PARENT web project)
 */

import { Camera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera';
import { isAndroid } from './platform';

export interface CaptureResult {
  base64: string;
  mimeType: string;
}

/**
 * Captures a FRONT-FACING selfie photo.
 * Used by: CheckInModule (attendance punch-in selfie)
 */
export async function captureSelfiPhoto(quality = 85): Promise<CaptureResult | null> {
  if (isAndroid()) {
    try {
      const photo = await Camera.getPhoto({
        quality,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        direction: CameraDirection.Front,
        saveToGallery: false,
      });
      return {
        base64: photo.base64String || '',
        mimeType: `image/${photo.format}`,
      };
    } catch (err) {
      console.error('[CameraService] Selfie capture failed:', err);
      return null;
    }
  }

  // Fallback: existing web getUserMedia (unchanged for browser/PWA)
  return webCapturePhoto('user');
}

/**
 * Captures a REAR-CAMERA photo.
 * Used by: CallPhotoCaptureView (doctor/chemist visit log)
 */
export async function captureVisitPhoto(quality = 85): Promise<CaptureResult | null> {
  if (isAndroid()) {
    try {
      const photo = await Camera.getPhoto({
        quality,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        direction: CameraDirection.Rear,
        saveToGallery: false,
      });
      return {
        base64: photo.base64String || '',
        mimeType: `image/${photo.format}`,
      };
    } catch (err) {
      console.error('[CameraService] Visit photo capture failed:', err);
      return null;
    }
  }

  return webCapturePhoto('environment');
}

/**
 * Web fallback — uses browser getUserMedia stream + canvas snapshot.
 */
async function webCapturePhoto(facingMode: 'user' | 'environment'): Promise<CaptureResult | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode },
    });
    const video = document.createElement('video');
    video.srcObject = stream;
    await video.play();

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);

    stream.getTracks().forEach(t => t.stop());
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const base64 = dataUrl.split(',')[1];
    return { base64, mimeType: 'image/jpeg' };
  } catch (err) {
    console.error('[CameraService] Web capture failed:', err);
    return null;
  }
}
