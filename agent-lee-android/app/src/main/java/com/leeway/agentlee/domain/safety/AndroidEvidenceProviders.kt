package com.leeway.agentlee.domain.safety

import android.content.Context
import androidx.room.Room
import dagger.hilt.android.qualifiers.ApplicationContext
import java.util.concurrent.ConcurrentHashMap
import javax.inject.Inject

class MutablePermissionEvidenceProvider @Inject constructor() : PermissionEvidenceProvider {
    private val permissions = ConcurrentHashMap<String, Boolean>()

    override fun hasPermission(permission: String): Boolean = permissions[permission] == true

    fun update(permission: String, granted: Boolean) {
        permissions[permission] = granted
    }
}

class AndroidAppPresenceEvidenceProvider @Inject constructor(
    @ApplicationContext private val context: Context
) : AppPresenceEvidenceProvider {
    override fun isInstalled(packageOrAppName: String): Boolean {
        return try {
            context.packageManager.getPackageInfo(packageOrAppName, 0)
            true
        } catch (_: Exception) {
            false
        }
    }
}

class DefaultRateLimitEvidenceProvider @Inject constructor() : RateLimitEvidenceProvider {
    override fun isAllowed(call: com.leeway.agentlee.domain.model.ToolCall): Boolean = true
}

class DefaultDeviceStateEvidenceProvider @Inject constructor() : DeviceStateEvidenceProvider {
    override fun isReady(): Boolean = true
}
