package com.leeway.agentlee.di

import android.content.Context
import androidx.room.Room
import com.google.gson.Gson
import com.leeway.agentlee.domain.audit.AgentLeeDatabase
import com.leeway.agentlee.domain.audit.AuditLogDao
import com.leeway.agentlee.domain.audit.RoomToolAuditLogger
import com.leeway.agentlee.domain.bus.EventBus
import com.leeway.agentlee.domain.bus.IEventBus
import com.leeway.agentlee.domain.bus.IStateManager
import com.leeway.agentlee.domain.bus.StateManager
import com.leeway.agentlee.domain.conversation.FakeLlmEngine
import com.leeway.agentlee.domain.conversation.IConversationEngine
import com.leeway.agentlee.domain.runtime.AgentRuntimeImpl
import com.leeway.agentlee.domain.runtime.DemoToolFactory
import com.leeway.agentlee.domain.runtime.IAgentRuntime
import com.leeway.agentlee.domain.runtime.ToolCallOrchestrator
import com.leeway.agentlee.domain.safety.AndroidAppPresenceEvidenceProvider
import com.leeway.agentlee.domain.safety.AuthorizedToolDispatcher
import com.leeway.agentlee.domain.safety.DefaultDeviceStateEvidenceProvider
import com.leeway.agentlee.domain.safety.DefaultRateLimitEvidenceProvider
import com.leeway.agentlee.domain.safety.DefaultToolExecutionGate
import com.leeway.agentlee.domain.safety.DefaultToolPolicyEngine
import com.leeway.agentlee.domain.safety.DefaultToolPreflight
import com.leeway.agentlee.domain.safety.MutablePermissionEvidenceProvider
import com.leeway.agentlee.domain.safety.NoopApprovalEvidenceProvider
import com.leeway.agentlee.domain.safety.StaticToolDescriptorResolver
import com.leeway.agentlee.domain.safety.ToolAuditLogger
import com.leeway.agentlee.domain.safety.ToolDescriptorResolver
import com.leeway.agentlee.domain.safety.ToolExecutionGate
import com.leeway.agentlee.domain.safety.createGateEnforcedDispatcher
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AgentModule {
    
    @Singleton
    @Provides
    fun provideEventBus(): IEventBus = EventBus()
    
    @Singleton
    @Provides
    fun provideStateManager(eventBus: IEventBus): IStateManager = StateManager(eventBus)
    
    @Singleton
    @Provides
    fun provideConversationEngine(): IConversationEngine = FakeLlmEngine()

    @Singleton
    @Provides
    fun provideGson(): Gson = Gson()

    @Singleton
    @Provides
    fun provideDatabase(@ApplicationContext context: Context): AgentLeeDatabase {
        return Room.databaseBuilder(context, AgentLeeDatabase::class.java, "agent-lee.db").build()
    }

    @Singleton
    @Provides
    fun provideAuditLogDao(database: AgentLeeDatabase): AuditLogDao = database.auditLogDao()

    @Singleton
    @Provides
    fun provideDescriptorResolver(): ToolDescriptorResolver = StaticToolDescriptorResolver(DemoToolFactory.descriptors())

    @Singleton
    @Provides
    fun providePermissionEvidenceProvider(): MutablePermissionEvidenceProvider = MutablePermissionEvidenceProvider()

    @Singleton
    @Provides
    fun provideAuditLogger(dao: AuditLogDao, gson: Gson): ToolAuditLogger = RoomToolAuditLogger(dao, gson)

    @Singleton
    @Provides
    fun provideToolExecutionGate(
        resolver: ToolDescriptorResolver,
        permissionProvider: MutablePermissionEvidenceProvider,
        appPresenceEvidenceProvider: AndroidAppPresenceEvidenceProvider,
        rateLimitEvidenceProvider: DefaultRateLimitEvidenceProvider,
        deviceStateEvidenceProvider: DefaultDeviceStateEvidenceProvider
    ): ToolExecutionGate {
        val preflight = DefaultToolPreflight(
            resolver = resolver,
            permissionProvider = permissionProvider,
            appPresenceProvider = appPresenceEvidenceProvider,
            rateLimitProvider = rateLimitEvidenceProvider,
            deviceStateProvider = deviceStateEvidenceProvider,
            argumentValidator = com.leeway.agentlee.domain.safety.MinimalJsonSchemaValidator()
        )
        return DefaultToolExecutionGate(
            preflight = preflight,
            policyEngine = DefaultToolPolicyEngine(),
            resolver = resolver,
            approvalProvider = NoopApprovalEvidenceProvider()
        )
    }

    @Singleton
    @Provides
    fun provideAuthorizedToolDispatcher(
        auditLogger: ToolAuditLogger,
        gson: Gson
    ): AuthorizedToolDispatcher {
        return createGateEnforcedDispatcher(
            gate = object : ToolExecutionGate {
                override suspend fun evaluate(
                    call: com.leeway.agentlee.domain.model.ToolCall,
                    additionalEvidence: List<com.leeway.agentlee.domain.model.EvidenceItem>
                ) = throw UnsupportedOperationException("Runtime uses explicit gate evaluation before dispatch")

                override suspend fun authorizeOrExplain(call: com.leeway.agentlee.domain.model.ToolCall) =
                    throw UnsupportedOperationException("Runtime uses explicit gate evaluation before dispatch")
            },
            auditLogger = auditLogger
        ) { call, proof ->
            com.leeway.agentlee.domain.model.ToolResult(
                callId = call.id,
                ok = true,
                data = gson.toJsonTree(mapOf("tool" to call.name, "proofItems" to proof.items.size)).asJsonObject,
                executionTimeMs = 1,
                proofBundle = proof
            )
        }
    }

    @Singleton
    @Provides
    fun provideToolCallOrchestrator(
        eventBus: IEventBus,
        gate: ToolExecutionGate,
        dispatcher: AuthorizedToolDispatcher
    ): ToolCallOrchestrator = ToolCallOrchestrator(eventBus, gate, dispatcher)
    
    @Singleton
    @Provides
    fun provideAgentRuntime(
        eventBus: IEventBus,
        conversationEngine: IConversationEngine,
        toolCallOrchestrator: ToolCallOrchestrator,
        permissionEvidenceProvider: MutablePermissionEvidenceProvider
    ): IAgentRuntime = AgentRuntimeImpl(eventBus, conversationEngine, toolCallOrchestrator, permissionEvidenceProvider)
}
