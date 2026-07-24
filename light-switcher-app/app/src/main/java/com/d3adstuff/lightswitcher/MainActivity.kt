package com.d3adstuff.lightswitcher

import android.Manifest
import android.content.pm.PackageManager
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.os.Bundle
import android.view.WindowManager
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.d3adstuff.lightswitcher.databinding.ActivityMainBinding

/**
 * A single-screen "light switcher": one big control that turns the device
 * flashlight (torch) on and off. If the device has no flash the app still
 * works as a visual switch and reports that the hardware light is unavailable.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var cameraManager: CameraManager

    /** Id of the first camera that has a flash unit, or null if none exists. */
    private var flashCameraId: String? = null

    /** Whether the user wants the light on. Kept in sync with the real torch. */
    private var isOn = false

    private val requestCameraPermission =
        registerForActivityResult(
            androidx.activity.result.contract.ActivityResultContracts.RequestPermission()
        ) { granted ->
            if (granted) {
                setTorch(true)
            } else {
                // No permission: fall back to a screen-only light so the app still does something.
                applyState(true)
            }
        }

    /** Keeps the UI in step even if the torch is changed by another app or the system. */
    private val torchCallback = object : CameraManager.TorchCallback() {
        override fun onTorchModeChanged(cameraId: String, enabled: Boolean) {
            if (cameraId == flashCameraId) {
                isOn = enabled
                runOnUiThread { applyState(enabled) }
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        cameraManager = getSystemService(CAMERA_SERVICE) as CameraManager
        flashCameraId = findFlashCameraId()

        binding.toggleButton.setOnClickListener { toggle() }
        binding.bulb.setOnClickListener { toggle() }

        if (flashCameraId == null) {
            binding.hint.text = getString(R.string.no_flash_hint)
        }

        applyState(false)
    }

    override fun onStart() {
        super.onStart()
        cameraManager.registerTorchCallback(torchCallback, null)
    }

    override fun onStop() {
        super.onStop()
        cameraManager.unregisterTorchCallback(torchCallback)
        // Be a good citizen: never leave the torch burning in the background.
        if (isOn) setTorch(false)
    }

    private fun toggle() {
        val target = !isOn
        if (target && flashCameraId != null &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
            != PackageManager.PERMISSION_GRANTED
        ) {
            requestCameraPermission.launch(Manifest.permission.CAMERA)
            return
        }
        setTorch(target)
    }

    private fun setTorch(on: Boolean) {
        val id = flashCameraId
        if (id != null) {
            try {
                cameraManager.setTorchMode(id, on)
                // UI is updated by the torch callback; still update immediately for snappiness.
            } catch (e: Exception) {
                binding.hint.text = getString(R.string.torch_error)
            }
        }
        isOn = on
        applyState(on)
    }

    /** Updates every visual element to reflect the current on/off state. */
    private fun applyState(on: Boolean) {
        isOn = on
        binding.bulb.setImageResource(if (on) R.drawable.ic_bulb_on else R.drawable.ic_bulb_off)
        binding.root.setBackgroundResource(if (on) R.color.bg_on else R.color.bg_off)
        binding.statusText.setText(if (on) R.string.status_on else R.string.status_off)
        binding.toggleButton.setText(if (on) R.string.turn_off else R.string.turn_on)

        // Keep the screen awake while the light is on so it doesn't dim mid-use.
        if (on) {
            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        } else {
            window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
    }

    private fun findFlashCameraId(): String? {
        return try {
            cameraManager.cameraIdList.firstOrNull { id ->
                cameraManager.getCameraCharacteristics(id)
                    .get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true
            }
        } catch (e: Exception) {
            null
        }
    }
}
