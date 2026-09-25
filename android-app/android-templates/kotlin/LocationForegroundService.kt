package com.orcalabs.pharmahrms.services

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.location.Location
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.*

/**
 * Orca Labs Pharma HRMS — Location Foreground Service (Kotlin)
 *
 * Required by Android 10+ to track GPS in the background.
 * Shows a persistent notification while field tracking is active.
 *
 * Triggered by: FieldDutyModule "Start Duty" button
 * Broadcasts coordinates back to the Capacitor WebView via LocalBroadcastManager.
 *
 * Declared in AndroidManifest.xml as:
 *   <service android:name=".services.LocationForegroundService"
 *            android:foregroundServiceType="location" />
 */
class LocationForegroundService : Service() {

    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback

    companion object {
        const val CHANNEL_ID = "orca_location_tracking"
        const val NOTIFICATION_ID = 1001
        const val ACTION_START = "com.orcalabs.pharmahrms.START_LOCATION"
        const val ACTION_STOP = "com.orcalabs.pharmahrms.STOP_LOCATION"
        const val BROADCAST_ACTION = "com.orcalabs.pharmahrms.LOCATION_UPDATE"
    }

    override fun onCreate() {
        super.onCreate()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        createNotificationChannel()

        locationCallback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                result.lastLocation?.let { broadcastLocation(it) }
            }
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                startForeground(NOTIFICATION_ID, buildNotification())
                startLocationUpdates()
            }
            ACTION_STOP -> {
                stopLocationUpdates()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
        }
        return START_STICKY
    }

    private fun startLocationUpdates() {
        val request = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY,
            10_000L // 10-second interval (matches VITE_LIVE_BROADCAST_INTERVAL_MS)
        ).setMinUpdateIntervalMillis(5_000L).build()

        try {
            fusedLocationClient.requestLocationUpdates(
                request, locationCallback, Looper.getMainLooper()
            )
        } catch (e: SecurityException) {
            // Location permission not granted
        }
    }

    private fun stopLocationUpdates() {
        fusedLocationClient.removeLocationUpdates(locationCallback)
    }

    private fun broadcastLocation(location: Location) {
        val intent = Intent(BROADCAST_ACTION).apply {
            putExtra("lat", location.latitude)
            putExtra("lng", location.longitude)
            putExtra("accuracy", location.accuracy)
            putExtra("timestamp", location.time)
        }
        sendBroadcast(intent)
    }

    private fun buildNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Orca HRMS — Field Tracking Active")
            .setContentText("Your location is being recorded for duty")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Field Location Tracking",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Active while field duty is running"
        }
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
