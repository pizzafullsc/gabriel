$ErrorActionPreference = 'SilentlyContinue'
$root = Split-Path -Parent $PSScriptRoot
$portFile = Join-Path $PSScriptRoot 'port.txt'
$port = 8000

while ($true) {
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
        $listener.Start()
        $listener.Stop()
        break
    } catch {
        $port++
        if ($port -gt 8100) {
            break
        }
    }
}

if ($port -gt 8100) {
    exit 1
}

Set-Content -Path $portFile -Value $port

$http = [System.Net.HttpListener]::new()
$prefix = "http://127.0.0.1:$port/"
$http.Prefixes.Add($prefix)
$http.Start()

while ($http.IsListening) {
    try {
        $context = $http.GetContext()
        $path = $context.Request.Url.AbsolutePath
        if ($path -eq '/' -or $path -eq '/launcher.html') {
            $file = Join-Path $root 'launcher.html'
        } elseif ($path -eq '/cocina.html') {
            $file = Join-Path $root 'cocina.html'
        } elseif ($path -eq '/index.html') {
            $file = Join-Path $root 'index.html'
        } else {
            $relative = $path.TrimStart('/')
            $file = Join-Path $root $relative
        }

        if (Test-Path $file -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($file)
            $ext = [System.IO.Path]::GetExtension($file)
            $mime = switch ($ext) {
                '.html' { 'text/html; charset=utf-8' }
                '.css' { 'text/css; charset=utf-8' }
                '.js' { 'application/javascript; charset=utf-8' }
                '.json' { 'application/json; charset=utf-8' }
                '.png' { 'image/png' }
                '.jpg' { 'image/jpeg' }
                '.jpeg' { 'image/jpeg' }
                '.svg' { 'image/svg+xml' }
                '.ico' { 'image/x-icon' }
                default { 'application/octet-stream' }
            }
            $context.Response.ContentType = $mime
            $context.Response.ContentLength64 = $bytes.Length
            $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
            $context.Response.OutputStream.Close()
        } else {
            $context.Response.StatusCode = 404
            $context.Response.Close()
        }
    } catch {
        break
    }
}

$http.Stop()
