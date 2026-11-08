# Runs inside the recorded terminal window: the unit tests, then the planted breaks.
$host.UI.RawUI.WindowTitle = 'Floorcount tests'
Set-Location (Join-Path $PSScriptRoot "..\tests\unit")
function prompt { "PS floorcount\tests\unit> " }
Clear-Host
Start-Sleep -Seconds 2
Write-Host -NoNewline "PS floorcount\tests\unit> "; Start-Sleep -Milliseconds 600; Write-Host "npm test"
npm test
Start-Sleep -Seconds 2
Write-Host ""
Write-Host -NoNewline "PS floorcount\tests\unit> "; Start-Sleep -Milliseconds 600; Write-Host "npm run breaks"
npm run breaks
Start-Sleep -Seconds 40
