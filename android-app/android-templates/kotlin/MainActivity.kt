package com.orcalabs.pharmahrms

import android.os.Bundle
import com.getcapacitor.BridgeActivity
import com.orcalabs.pharmahrms.plugins.EnhancedCameraPlugin

/**
 * Orca Labs Pharma HRMS — Main Activity (Kotlin)
 *
 * Entry point for the Android application.
 * Extends BridgeActivity to load the Capacitor WebView bridge.
 *
 * All UI rendering happens inside the React/Vite WebView.
 * Kotlin only handles:
 *   1. Native plugin registration
 *   2. Lifecycle management
 *   3. Background services
 */
class MainActivity : BridgeActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        // Register custom native plugins BEFORE super.onCreate()
        registerPlugin(EnhancedCameraPlugin::class.java)

        super.onCreate(savedInstanceState)
    }

    override fun onResume() {
        super.onResume()
        // App returned to foreground — Capacitor handles WebView state restoration
    }

    override fun onPause() {
        super.onPause()
        // App goes to background — background location service continues
    }
}
