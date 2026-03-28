package com.leeway.agentlee.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF0D47A1),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFD1C4E9),
    onPrimaryContainer = Color(0xFF0D47A1),
    
    secondary = Color(0xFF6A1B9A),
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFE1BEE7),
    onSecondaryContainer = Color(0xFF6A1B9A),
    
    tertiary = Color(0xFF00796B),
    onTertiary = Color.White,
    tertiaryContainer = Color(0xFFB2DFDB),
    onTertiaryContainer = Color(0xFF00796B),
    
    error = Color(0xFFB00020),
    onError = Color.White,
    errorContainer = Color(0xFFF9DEDC),
    onErrorContainer = Color(0xFF8B0000),
    
    background = Color(0xFFFAFAFA),
    onBackground = Color(0xFF212121),
    
    surface = Color(0xFFFFFBFE),
    onSurface = Color(0xFF1C1B1F),
    surfaceVariant = Color(0xFFEAE7F0),
    onSurfaceVariant = Color(0xFF49454F)
)

@Composable
fun AgentLeeTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        typography = androidx.compose.material3.Typography(),
        content = content
    )
}
