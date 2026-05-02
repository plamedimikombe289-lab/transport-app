@echo off
SET NODE_PATH=C:\Program Files\Microsoft Visual Studio\18\Community\MSBuild\Microsoft\VisualStudio\NodeJs
SET PATH=%NODE_PATH%;%PATH%

echo Demarrage du backend...
cd /d "%~dp0backend"

where nodemon >nul 2>&1
if %errorlevel%==0 (
  nodemon src/server.js
) else (
  node src/server.js
)
pause
