package com.leeway.agentlee.presentation

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.lifecycle.lifecycleScope
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.leeway.agentlee.domain.runtime.IAgentRuntime
import com.leeway.agentlee.ui.theme.AgentLeeTheme
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    @Inject
    lateinit var runtime: IAgentRuntime
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        lifecycleScope.launch {
            runtime.initialize()
            runtime.start()
        }
        
        setContent {
            AgentLeeTheme {
                val navController = rememberNavController()
                NavHost(navController = navController, startDestination = "main") {
                    composable("main") {
                        AgentLeeScreen(
                            runtime = runtime,
                            onNavigateToAudit = { navController.navigate("audit") }
                        )
                    }
                    composable("audit") {
                        AuditHistoryScreen(onBack = { navController.popBackStack() })
                    }
                }
            }
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        lifecycleScope.launch {
            runtime.stop()
        }
    }
}

