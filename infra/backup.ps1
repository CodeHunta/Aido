# Nightly Postgres backup (-Fc is already compressed) → upload to R2 bucket aido-backups.
# Run: pnpm db:backup  (or schedule via Windows Task Scheduler)
$ErrorActionPreference = "Stop"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
New-Item -ItemType Directory -Path "backups" -Force | Out-Null
$out = "backups/aido-$stamp.dump"
& docker exec infra-postgres-1 pg_dump -U aido -d aido -Fc -f "/tmp/aido-$stamp.dump"
& docker cp "infra-postgres-1:/tmp/aido-$stamp.dump" $out
& docker exec infra-postgres-1 rm "/tmp/aido-$stamp.dump"
Write-Output "Backup written to $out - upload to R2 bucket aido-backups"
