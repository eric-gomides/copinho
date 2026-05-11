package com.anonymous.copinho
import android.appwidget.AppWidgetManager; import android.appwidget.AppWidgetProvider
import android.content.ComponentName; import android.content.Context; import android.content.Intent
import android.view.View; import android.widget.RemoteViews; import kotlin.math.roundToInt
class CopinhoWidget : AppWidgetProvider() {
    override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) { for (id in ids) update(context, manager, id) }
    override fun onReceive(context: Context, intent: Intent) { super.onReceive(context, intent); if (intent.action == ACTION_UPDATE) { val mgr = AppWidgetManager.getInstance(context); mgr.getAppWidgetIds(ComponentName(context, CopinhoWidget::class.java)).forEach { update(context, mgr, it) } } }
    companion object {
        const val ACTION_UPDATE = "com.anonymous.copinho.WIDGET_UPDATE"; const val PREFS = "CopinhoWidget"
        fun update(ctx: Context, mgr: AppWidgetManager, id: Int) { val p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE); val cur = p.getFloat("currentMl", 0f); val goal = p.getFloat("goalMl", 4000f); val pct = ((cur / goal).coerceIn(0f, 1f) * 100).roundToInt(); val v = RemoteViews(ctx.packageName, R.layout.copinho_widget); v.setTextViewText(R.id.widget_amount, "%.2fL / %.1fL".format(cur / 1000f, goal / 1000f)); v.setTextViewText(R.id.widget_pct, "$pct%"); v.setViewVisibility(R.id.widget_progress_fill, View.VISIBLE); mgr.updateAppWidget(id, v) }
    }
}
