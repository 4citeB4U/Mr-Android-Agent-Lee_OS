package com.leeway.agentlee.domain.runtime

import com.google.gson.JsonArray
import com.google.gson.JsonObject
import com.leeway.agentlee.domain.model.RiskTier
import com.leeway.agentlee.domain.model.ToolCall
import com.leeway.agentlee.domain.model.ToolCategory
import com.leeway.agentlee.domain.model.ToolDescriptor

object DemoToolFactory {
    fun openSettingsCall(): ToolCall {
        return ToolCall(
            name = "phone.openApp",
            args = JsonObject().apply { addProperty("targetApp", "com.android.settings") }
        )
    }

    fun descriptors(): Map<String, ToolDescriptor> {
        return mapOf(
            "phone.openApp" to ToolDescriptor(
                name = "phone.openApp",
                description = "Open an installed Android app by package name",
                category = ToolCategory.PHONE,
                inputSchema = JsonObject().apply {
                    add("required", JsonArray().apply { add("targetApp") })
                },
                riskTier = RiskTier.B
            ),
            "system.health" to ToolDescriptor(
                name = "system.health",
                description = "Return system health summary",
                category = ToolCategory.SYSTEM,
                inputSchema = JsonObject(),
                riskTier = RiskTier.A
            )
        )
    }
}
