# Nightly Postgres backup → gzip → Cloudflare R2 (bucket aido-backups).
# Run: pnpm db:backup  (or schedule via Windows Task Scheduler)
$ErrorActionPreference = "Stop"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$out = "backups/aido-$stamp.dump.gz"
New-Item -ItemType Directory -Path "backups" -Force | Out-Null
$env:PGPASSWORD = "aido"
& docker exec aido-postgres-1 pg_dump -U aido -d aido -Fc | & gzip > $out
Write-Output "Backup written to $out — upload to R2 bucket aido-backups"
