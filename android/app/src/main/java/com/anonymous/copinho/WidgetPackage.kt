package com.anonymous.copinho
import com.facebook.react.ReactPackage; import com.facebook.react.bridge.*; import com.facebook.react.uimanager.ViewManager
class WidgetPackage : ReactPackage { override fun createNativeModules(ctx: ReactApplicationContext): List<NativeModule> = listOf(WidgetModule(ctx)); override fun createViewManagers(ctx: ReactApplicationContext): List<ViewManager<*, *>> = emptyList() }
