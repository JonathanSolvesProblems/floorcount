# Records a Windows Terminal window running the test suite:  powershell -File tmp/record_terminal.ps1
# Temporarily sets the terminal font to 22 so the text reads at 1080p, and restores the settings after.
# The window is sized to fit the screen and only its own rectangle is captured.
$ErrorActionPreference = 'Stop'
$settings = "$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json"
$backup = "tmp\wt-settings-backup.json"
Copy-Item $settings $backup -Force
Add-Type -TypeDefinition @"
using System; using System.Runtime.InteropServices;
public struct RECT { public int Left, Top, Right, Bottom; }
public class Win { [DllImport("user32.dll")] public static extern IntPtr FindWindow(string cls, string title);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h); }
"@
try {
    py -3 -c "import json,sys; p=sys.argv[1]; d=json.load(open(p,encoding='utf-8')); d.setdefault('profiles',{}).setdefault('defaults',{}); d['profiles']['defaults']['font']={'face':'Cascadia Mono','size':22}; d['profiles']['defaults']['padding']='24'; json.dump(d,open(p,'w',encoding='utf-8'),indent=4)" $settings
    Start-Sleep -Seconds 1
    $proj = (Get-Location).Path   # run from the project root
    Start-Process wt.exe -ArgumentList "-w", "floorcount", "--pos", "0,0", "--size", "112,22", "-p", "Windows PowerShell", "powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "$proj\tmp\term_run.ps1"
    Start-Sleep -Seconds 3
    $h = [IntPtr]::Zero
    foreach ($i in 1..30) { $p = Get-Process WindowsTerminal -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -eq 'Floorcount tests' } | Select-Object -First 1; if ($p) { $h = $p.MainWindowHandle; break }; Start-Sleep -Milliseconds 300 }
    if ($h -eq [IntPtr]::Zero) { throw "terminal window not found" }
    [Win]::SetForegroundWindow($h) | Out-Null
    $r = New-Object RECT; [Win]::GetWindowRect($h, [ref]$r) | Out-Null
    $phys = (Get-CimInstance Win32_VideoController | Where-Object CurrentHorizontalResolution | Select-Object -First 1).CurrentHorizontalResolution; $scale = $phys / 1536.0; "scale $scale"
    $x = [math]::Max(0, [math]::Round($r.Left * $scale)); $y = [math]::Max(0, [math]::Round($r.Top * $scale))
    $w = [math]::Floor(([math]::Min([math]::Round($r.Right * $scale), 1920) - $x) / 2) * 2; $hh = [math]::Floor(([math]::Min([math]::Round($r.Bottom * $scale), 1080) - $y) / 2) * 2
    "window $x,$y ${w}x$hh"
    $out = "$proj\broll\terminal-tests-take6.mp4"
    ffmpeg -y -v error -f gdigrab -framerate 30 -offset_x $x -offset_y $y -video_size "${w}x$hh" -draw_mouse 0 -i desktop -t 42 -c:v libx264 -preset veryfast -crf 16 -pix_fmt yuv420p $out
    Get-Process WindowsTerminal -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -match 'Floorcount' } | Stop-Process -Force -ErrorAction SilentlyContinue
    "recorded $out"
} finally {
    Copy-Item $backup $settings -Force
    "settings restored"
}


