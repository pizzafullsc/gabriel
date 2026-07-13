$ErrorActionPreference = 'SilentlyContinue'
$root = Split-Path -Parent $PSScriptRoot
$portFile = Join-Path $PSScriptRoot 'port.txt'
$hostFile = Join-Path $PSScriptRoot 'host.txt'
$port = 8000

function Get-LanIp {
    try {
        $interfaces = [System.Net.NetworkInformation.NetworkInterface]::GetAllNetworkInterfaces() |
            Where-Object {
                $_.OperationalStatus -eq [System.Net.NetworkInformation.OperationalStatus]::Up -and
                $_.NetworkInterfaceType -ne [System.Net.NetworkInformation.NetworkInterfaceType]::Loopback
            }

        foreach ($iface in $interfaces) {
            foreach ($address in $iface.GetIPProperties().UnicastAddresses) {
                if ($address.Address.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork) {
                    $candidate = $address.Address.ToString()
                    if ($candidate -notlike '127.*' -and $candidate -notlike '169.254.*') {
                        return $candidate
                    }
                }
            }
        }
    } catch {
    }

    return '127.0.0.1'
}

while ($true) {
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $port)
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

$host = Get-LanIp
Set-Content -Path $portFile -Value $port
Set-Content -Path $hostFile -Value $host

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $port)
$listener.Start()

while ($true) {
    try {
        $client = $listener.AcceptTcpClient()
        $stream = $client.GetStream()
        $buffer = New-Object byte[] 4096
        $read = $stream.Read($buffer, 0, $buffer.Length)
        $request = [System.Text.Encoding]::ASCII.GetString($buffer, 0, $read)

        if ($request -match '^(GET|HEAD)\s+(\S+)') {
            $method = $matches[1]
            $rawPath = $matches[2]
            $path = ([System.Uri]::UnescapeDataString($rawPath.Split('?')[0])).TrimEnd('/')
            if ([string]::IsNullOrWhiteSpace($path) -or $path -eq '/') {
                $path = '/launcher.html'
            }

            $relative = $path.TrimStart('/')
            $file = Join-Path $root $relative
            $rootFull = [System.IO.Path]::GetFullPath($root)
            $fileFull = [System.IO.Path]::GetFullPath($file)

            if (-not $fileFull.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
                $fileFull = Join-Path $rootFull 'launcher.html'
            }

            if (Test-Path $fileFull -PathType Leaf) {
                $bytes = [System.IO.File]::ReadAllBytes($fileFull)
                $ext = [System.IO.Path]::GetExtension($fileFull)
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

                $statusLine = "HTTP/1.1 200 OK`r`n"
                $headers = @(
                    "Content-Type: $mime",
                    "Content-Length: $bytes.Length",
                    "Connection: close",
                    "Server: PizzaFull"
                )
                $headerBytes = [System.Text.Encoding]::ASCII.GetBytes(($statusLine + ($headers -join "`r`n") + "`r`n`r`n"))
                $stream.Write($headerBytes, 0, $headerBytes.Length)
                if ($method -eq 'GET') {
                    $stream.Write($bytes, 0, $bytes.Length)
                }
            } else {
                $body = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
                $statusLine = "HTTP/1.1 404 Not Found`r`n"
                $headers = @(
                    'Content-Type: text/plain; charset=utf-8',
                    "Content-Length: $($body.Length)",
                    'Connection: close',
                    'Server: PizzaFull'
                )
                $headerBytes = [System.Text.Encoding]::ASCII.GetBytes(($statusLine + ($headers -join "`r`n") + "`r`n`r`n"))
                $stream.Write($headerBytes, 0, $headerBytes.Length)
                $stream.Write($body, 0, $body.Length)
            }
        }

        $client.Close()
    } catch {
        break
    }
}

$listener.Stop()
