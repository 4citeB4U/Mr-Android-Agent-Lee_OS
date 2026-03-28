package com.leeway.agentlee

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class AgentLeeApp : Application() {
    override fun onCreate() {
        super.onCreate()
        // Initialization code here if needed
    }
}
