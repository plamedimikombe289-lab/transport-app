@echo off
SET NODE_PATH=C:\Program Files\Microsoft Visual Studio\18\Community\MSBuild\Microsoft\VisualStudio\NodeJs
SET PATH=%NODE_PATH%;%PATH%
SET HOST=localhost
SET BROWSER=none
SET CI=false

echo Demarrage du frontend...
cd /d "%~dp0frontend"
npm start
pause
