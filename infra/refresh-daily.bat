@echo off
REM Aido daily refresh: live NGX prices -> ratings -> weekly picks, local + cloud.
REM Runs via Windows Task Scheduler ("AidoDailyRefresh", daily 17:00).
REM Logs to infra\refresh.log (local-only, gitignored).
setlocal
set JAVA_HOME=C:\Users\USER\AppData\Local\Java\jdk17
set PATH=%JAVA_HOME%\bin;%PATH%
cd /d C:\Users\USER\Documents\Aido
echo [%date% %time%] starting refresh>> infra\refresh.log
set DATABASE_URL=postgres://aido:aido@localhost:5432/aido
set DATABASE_SSL=
echo --- local --->> infra\refresh.log
call pnpm.cmd --filter @aido/worker ngx>> infra\refresh.log 2>&1
call pnpm.cmd --filter @aido/worker score>> infra\refresh.log 2>&1
call pnpm.cmd --filter @aido/worker weekly>> infra\refresh.log 2>&1
if not exist infra\.cloud-url goto nocloud
echo --- cloud --->> infra\refresh.log
set /p DATABASE_URL=<infra\.cloud-url
set DATABASE_SSL=require
call pnpm.cmd --filter @aido/worker ngx>> infra\refresh.log 2>&1
call pnpm.cmd --filter @aido/worker score>> infra\refresh.log 2>&1
call pnpm.cmd --filter @aido/worker weekly>> infra\refresh.log 2>&1
goto done
:nocloud
echo --- cloud skipped (no infra/.cloud-url) --->> infra\refresh.log
:done
echo [%date% %time%] refresh done>> infra\refresh.log
