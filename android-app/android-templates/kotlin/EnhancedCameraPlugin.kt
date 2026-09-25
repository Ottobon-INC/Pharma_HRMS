package com.orcalabs.pharmahrms.plugins

import android.Manifest
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission

/**
 * Orca Labs Pharma HRMS — Enhanced Camera Plugin (Kotlin)
 *
 * Bridges high-fidelity camera capture to the React WebView layer.
 * Uses CameraX (Jetpack) for:
 *   - CheckInModule: front-facing selfie capture
 *   - CallPhotoCaptureView: rear-camera visit photo
 *
 * Registered in MainActivity.kt via registerPlugin()
 */
@CapacitorPlugin(
    name = "EnhancedCamera",
    permissions = [
        Permission(
            strings = [Manifest.permission.CAMERA],
            alias = "camera"
        )
    ]
)
class EnhancedCameraPlugin : Plugin() {

    /**
     * Captures a photo and returns it as Base64 to the React layer.
     *
     * Call from React:
     *   const result = await EnhancedCamera.capturePhoto({ facing: 'front', quality: 85 });
     *   // result.base64 — JPEG base64 string
     */
    @PluginMethod
    fun capturePhoto(call: PluginCall) {
        val facing = call.getString("facing", "front") // "front" | "rear"
        val quality = call.getInt("quality", 85)

        // Permission check
        if (!hasRequiredPermissions()) {
            requestAllPermissions(call, "cameraPermissionCallback")
            return
        }

        // TODO: Integrate CameraX ImageCapture here
        // val imageCapture = ImageCapture.Builder()
        //   .setJpegQuality(quality ?: 85)
        //   .build()
        //
        // On capture success:
        // val result = JSObject()
        // result.put("base64", base64String)
        // result.put("mimeType", "image/jpeg")
        // call.resolve(result)

        // Placeholder — replace with CameraX implementation
        call.reject("CameraX implementation pending — see android-templates/kotlin/EnhancedCameraPlugin.kt")
    }

    @PluginMethod
    fun checkPermission(call: PluginCall) {
        val result = JSObject()
        result.put("granted", hasRequiredPermissions())
        call.resolve(result)
    }
}
