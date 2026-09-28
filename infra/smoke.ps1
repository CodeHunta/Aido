# One-command health check. Usage: powershell -File infra/smoke.ps1 [-Base http://localhost:3000]
param([string]$Base = "http://localhost:3000")
$fail = 0
function Check($name, $url, $expect) {
  try {
    $r = Invoke-RestMethod -Uri "$Base$url" -TimeoutSec 25
    if ($expect -and -not (& $expect $r)) { throw "unexpected body" }
    Write-Output "PASS $name"
  } catch {
    $script:fail++
    Write-Output "FAIL $name : $($_.Exception.Message)"
  }
}
function Page($name, $url) {
  try {
    $r = Invoke-WebRequest -Uri "$Base$url" -TimeoutSec 25 -UseBasicParsing
    if ($r.StatusCode -ne 200) { throw "HTTP $($r.StatusCode)" }
    Write-Output "PASS $name"
  } catch {
    $script:fail++
    Write-Output "FAIL $name : $($_.Exception.Message)"
  }
}
Check "health" "/api/health" { param($j) $j.ok }
Check "stocks" "/api/v1/stocks?user=demo-moderate" { param($j) $j.ok -and $j.data.Count -ge 40 }
Check "stock detail" "/api/v1/stocks/GTCO?user=demo-moderate" { param($j) $j.ok -and $j.data.ticker -eq "GTCO" }
Check "thesis" "/api/v1/stocks/GTCO/thesis" { param($j) $j.ok -and $j.data.why.Count -ge 3 }
Check "compare" "/api/v1/compare?tickers=GTCO,DANGCEM" { param($j) $j.ok -and $j.data.Count -eq 2 }
Check "portfolio" "/api/v1/portfolio?user=demo-moderate" { param($j) $j.ok }
Check "portfolio analysis" "/api/v1/portfolio/analysis?user=demo-moderate" { param($j) $j.ok -and $j.data.valueKobo -gt 0 }
Check "watchlist" "/api/v1/watchlist?user=demo-moderate" { param($j) $j.ok }
Check "picks" "/api/v1/picks/current?user=demo-moderate" { param($j) $j.ok -and $j.data.market }
Check "alerts" "/api/v1/alerts?user=demo-moderate" { param($j) $j.ok }
Check "plan" "/api/v1/paystack" { param($j) $j.ok }
Page "home" "/"
Page "discover" "/discover"
Page "stock page" "/stocks/GTCO"
Page "compare page" "/compare?tickers=GTCO,DANGCEM"
Page "portfolio page" "/portfolio"
Page "watchlist page" "/watchlist"
Page "picks page" "/picks"
Page "signup" "/signup"
Page "login" "/login"
Page "premium" "/premium"
Page "methodology" "/methodology"
if ($fail -gt 0) { Write-Output "$fail CHECKS FAILED"; exit 1 }
Write-Output "ALL CHECKS PASSED"
