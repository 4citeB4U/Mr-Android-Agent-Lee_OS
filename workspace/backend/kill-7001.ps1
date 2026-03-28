$port = 7001
$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1
if ($process) {
    echo "Killing process $process on port $port"
    Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
    sleep 2
} else {
    echo "Port $port is free"
}
