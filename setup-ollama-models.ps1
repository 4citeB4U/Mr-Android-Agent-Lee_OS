# Setup Ollama models for Agent Lee 2026 optimization
# Run this script AFTER Ollama is installed and restarted

Write-Host "🚀 Agent Lee 2026 Ollama Model Setup" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Check if ollama is installed
$ollamaCheck = Get-Command ollama -ErrorAction SilentlyContinue
if (-not $ollamaCheck) {
    Write-Host "❌ Ollama not found in PATH. Please restart PowerShell after installation completes." -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Ollama found at: $($ollamaCheck.Source)" -ForegroundColor Green

# Pull vision model
Write-Host "`n📷 Pulling Vision Model (llama2-vision - 11B)..." -ForegroundColor Cyan
ollama pull llama2-vision
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Vision model ready!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Vision model pull failed, will use leeway fallback" -ForegroundColor Yellow
}

# Pull embedding model  
Write-Host "`n📚 Pulling Embedding Model (nomic-embed-text - 768d)..." -ForegroundColor Cyan
ollama pull nomic-embed-text
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Embedding model ready!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Embedding model pull failed" -ForegroundColor Yellow
}

# List available models
Write-Host "`n📋 Available Ollama Models:" -ForegroundColor Cyan
ollama list

Write-Host "`n✨ Setup complete! Update your .env.local:" -ForegroundColor Green
Write-Host "VITE_VISION_MODEL=llama2-vision" -ForegroundColor White
Write-Host "VITE_EMBEDDING_MODEL=nomic-embed-text" -ForegroundColor White
Write-Host "VITE_OLLAMA_URL=http://localhost:11434" -ForegroundColor White

Write-Host "`n🎯 Next steps:" -ForegroundColor Green
Write-Host "1. Update your .env.local with the above variables" -ForegroundColor White
Write-Host "2. Run: npm run dev" -ForegroundColor White
Write-Host "3. Agent Lee will now use local vision & embeddings!" -ForegroundColor White

