@echo off

:: Run client
start cmd /k "cd /d %~dp0client && npm run dev"

:: Run server
start cmd /k "cd /d %~dp0server && npm run dev"

exit