# VisionChord Local HTTP Server (Zero Dependency, Built-in .NET)
$port = 8080
$prefix = "http://localhost:$port/"
$folder = Split-Path -Parent $MyInvocation.MyCommand.Path

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "   VisionChord Server Berjalan!" -ForegroundColor Green
    Write-Host "   Buka di Browser: $prefix" -ForegroundColor Yellow
    Write-Host "   Tekan Ctrl+C untuk menghentikan server" -ForegroundColor Gray
    Write-Host "==========================================" -ForegroundColor Cyan

    # Auto open default browser
    Start-Process $prefix

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($urlPath)) {
            $urlPath = "index.html"
        }

        $localFilePath = Join-Path $folder $urlPath

        if (Test-Path $localFilePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($localFilePath).ToLower()
            $contentType = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".json" { "application/json; charset=utf-8" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                ".svg"  { "image/svg+xml" }
                default { "application/octet-stream" }
            }

            $bytes = [System.IO.File]::ReadAllBytes($localFilePath)
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($msg, 0, $msg.Length)
        }
        $response.Close()
    }
} catch {
    Write-Host "Server Error: $_" -ForegroundColor Red
} finally {
    $listener.Stop()
    $listener.Close()
}
