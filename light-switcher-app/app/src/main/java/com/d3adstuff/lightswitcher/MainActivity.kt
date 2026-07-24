package com.d3adstuff.lightswitcher

import android.Manifest
import android.animation.ArgbEvaluator
import android.animation.ValueAnimator
import android.content.pm.PackageManager
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.os.Bundle
import android.view.WindowManager
import android.view.animation.AccelerateDecelerateInterpolator
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.d3adstuff.lightswitcher.databinding.ActivityMainBinding
import kotlin.math.PI
import kotlin.math.sin

/**
 * A single-screen "light switcher": one big control that turns the device
 * flashlight (torch) on and off. The switch between the dark and bright looks
 * is animated — background, text, bulb and glow all cross-fade together.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var cameraManager: CameraManager

    /** Id of the first camera that has a flash unit, or null if none exists. */
    private var flashCameraId: String? = null

    /** Whether the user wants the light on. Kept in sync with the real torch. */
    private var isOn = false

    /** Current position of the dark→bright transition, 0 = dark, 1 = bright. */
    private var fraction = 0f
    private var transition: ValueAnimator? = null
    private val argb = ArgbEvaluator()

    // Endpoint colours, resolved once.
    private var bgOff = 0; private var bgOn = 0
    private var textOff = 0; private var textOn = 0
    private var hintOff = 0; private var hintOn = 0

    private val requestCameraPermission =
        registerForActivityResult(
            androidx.activity.result.contract.ActivityResultContracts.RequestPermission()
        ) { granted ->
            if (granted) {
                setTorch(true)
            } else {
                // No permission: fall back to a screen-only light so the app still does something.
                animateTo(true)
            }
        }

    /** Keeps the UI in step even if the torch is changed by another app or the system. */
    private val torchCallback = object : CameraManager.TorchCallback() {
        override fun onTorchModeChanged(cameraId: String, enabled: Boolean) {
            if (cameraId == flashCameraId) {
                isOn = enabled
                runOnUiThread { animateTo(enabled) }
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        bgOff = color(R.color.bg_off); bgOn = color(R.color.bg_on)
        textOff = color(R.color.text_off); textOn = color(R.color.text_on)
        hintOff = color(R.color.hint_off); hintOn = color(R.color.hint_on)

        cameraManager = getSystemService(CAMERA_SERVICE) as CameraManager
        flashCameraId = findFlashCameraId()

        binding.toggleButton.setOnClickListener { toggle() }
        binding.bulbContainer.setOnClickListener { toggle() }

        if (flashCameraId == null) {
            binding.hint.text = getString(R.string.no_flash_hint)
        }

        applyFraction(0f)
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
            } catch (e: Exception) {
                binding.hint.text = getString(R.string.torch_error)
            }
        }
        isOn = on
        animateTo(on)
    }

    /** Smoothly tweens the whole screen between the dark and bright looks. */
    private fun animateTo(on: Boolean) {
        val end = if (on) 1f else 0f
        transition?.cancel()
        transition = ValueAnimator.ofFloat(fraction, end).apply {
            duration = 520
            interpolator = AccelerateDecelerateInterpolator()
            addUpdateListener { applyFraction(it.animatedValue as Float) }
            start()
        }

        // Keep the screen awake while the light is on so it doesn't dim mid-use.
        if (on) {
            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        } else {
            window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
    }

    /** Paints every element for a given transition position (0 = dark, 1 = bright). */
    private fun applyFraction(f: Float) {
        fraction = f

        binding.root.setBackgroundColor(argb.evaluate(f, bgOff, bgOn) as Int)
        binding.statusText.setTextColor(argb.evaluate(f, textOff, textOn) as Int)
        binding.hint.setTextColor(argb.evaluate(f, hintOff, hintOn) as Int)

        binding.bulbOn.alpha = f
        binding.bulbOff.alpha = 1f - f
        binding.glow.alpha = f

        // A subtle pop: the bulb swells at the midpoint of the switch, then settles.
        val pop = 1f + 0.14f * sin(f.toDouble() * PI).toFloat()
        binding.bulbContainer.scaleX = pop
        binding.bulbContainer.scaleY = pop

        val bright = f >= 0.5f
        binding.statusText.setText(if (bright) R.string.status_on else R.string.status_off)
        binding.toggleButton.setText(if (bright) R.string.turn_off else R.string.turn_on)
    }

    private fun color(id: Int) = ContextCompat.getColor(this, id)

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
