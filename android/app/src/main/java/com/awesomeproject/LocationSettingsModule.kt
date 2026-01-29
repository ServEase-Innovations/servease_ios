package com.serveaso

import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import android.location.LocationManager
import android.app.Activity
import android.content.Context

class LocationSettingsModule(reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "LocationSettings"
    }

    @ReactMethod
    fun getLocationMode(promise: Promise) {
        try {
            val mode = Settings.Secure.getInt(
                reactApplicationContext.contentResolver,
                Settings.Secure.LOCATION_MODE
            )
            
            val modeStr = when (mode) {
                Settings.Secure.LOCATION_MODE_HIGH_ACCURACY -> "high_accuracy"
                Settings.Secure.LOCATION_MODE_SENSORS_ONLY -> "device_only"
                Settings.Secure.LOCATION_MODE_BATTERY_SAVING -> "battery_saving"
                Settings.Secure.LOCATION_MODE_OFF -> "off"
                else -> "unknown"
            }
            
            promise.resolve(modeStr)
        } catch (e: Settings.SettingNotFoundException) {
            promise.reject("ERROR", "Unable to get location mode")
        }
    }

    @ReactMethod
    fun openLocationSettings() {
        val intent = Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun showLocationSettingsDialog() {
        val intent = Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun checkLocationServices(promise: Promise) {
        val locationManager = reactApplicationContext.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        val isGpsEnabled = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)
        val isNetworkEnabled = locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
          promise.resolve(isGpsEnabled || isNetworkEnabled)
    }
}