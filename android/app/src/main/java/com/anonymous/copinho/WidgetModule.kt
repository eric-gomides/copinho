package com.anonymous.copinho
import android.content.Context; import android.content.Intent
import com.facebook.react.bridge.*
class WidgetModule(private val ctx: ReactApplicationContext) : ReactContextBaseJavaModule(ctx) {
    override fun getName() = "CopinhoWidgetModule"
    @ReactMethod fun updateWidget(cur: Double, goal: Double, promise: Promise) { try { ctx.getSharedPreferences(CopinhoWidget.PREFS, Context.MODE_PRIVATE).edit().putFloat("currentMl", cur.toFloat()).putFloat("goalMl", goal.toFloat()).apply(); ctx.sendBroadcast(Intent(ctx, CopinhoWidget::class.java).apply { action = CopinhoWidget.ACTION_UPDATE }); promise.resolve(true) } catch (e: Exception) { promise.resolve(false) } }
}
