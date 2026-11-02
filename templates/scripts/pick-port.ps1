# Output first free TCP port on loopback in 5173..5192
$p = 5173
while ($p -lt 5193) {
    try {
        $l = [System.Net.Sockets.TcpListener]::new([ipaddress]::Loopback, $p)
        $l.ExclusiveAddressUse = $true
        $l.Start()
        $l.Stop()
        Write-Output $p
        exit 0
    } catch {
        $p++
    }
}
Write-Output 5173
