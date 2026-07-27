package com.d3adstuff.lightswitcher

import android.content.ComponentName
import android.content.Context
import com.nothing.ketchum.Glyph
import com.nothing.ketchum.GlyphMatrixManager

/**
 * Lights up the Glyph Matrix on the back of a Nothing Phone (3) in step with the
 * flashlight. Everything is wrapped defensively: on any device without a Glyph
 * Matrix (or without a new enough system) every call is a silent no-op, so the
 * rest of the app is unaffected.
 */
class GlyphController(context: Context) {

    private val appContext = context.applicationContext
    private var manager: GlyphMatrixManager? = null
    private var registered = false

    /** Latest requested state, applied as soon as the service is registered. */
    private var desiredOn = false

    /** Binds to the Glyph service and registers the Phone (3) matrix. */
    fun connect() {
        try {
            val gm = GlyphMatrixManager.getInstance(appContext) ?: return
            manager = gm
            gm.init(object : GlyphMatrixManager.Callback {
                override fun onServiceConnected(name: ComponentName?) {
                    try {
                        registered = gm.register(Glyph.DEVICE_23112)
                        apply(desiredOn)
                    } catch (t: Throwable) {
                        // Not a Glyph Matrix device — ignore.
                    }
                }

                override fun onServiceDisconnected(name: ComponentName?) {
                    registered = false
                }
            })
        } catch (t: Throwable) {
            // No Glyph service on this device — ignore.
        }
    }

    /** Requests the matrix on or off; applied now if connected, otherwise on connect. */
    fun setOn(on: Boolean) {
        desiredOn = on
        if (registered) apply(on)
    }

    private fun apply(on: Boolean) {
        val gm = manager ?: return
        try {
            if (on) {
                // Fill the whole 25×25 matrix at full brightness.
                val side = Glyph.DEVICE_23112_MATRIX_LENGTH
                gm.setAppMatrixFrame(IntArray(side * side) { FULL_BRIGHTNESS })
            } else {
                gm.closeAppMatrix()
            }
        } catch (t: Throwable) {
            // e.g. GlyphException on an unsupported system version — ignore.
        }
    }

    /** Turns the matrix off and unbinds the service. */
    fun release() {
        try {
            if (registered) {
                try {
                    manager?.closeAppMatrix()
                } catch (t: Throwable) {
                    // ignore
                }
            }
            manager?.unInit()
        } catch (t: Throwable) {
            // ignore
        } finally {
            manager = null
            registered = false
        }
    }

    private companion object {
        const val FULL_BRIGHTNESS = 255
    }
}
