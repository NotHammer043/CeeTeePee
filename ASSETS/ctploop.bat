@echo off
cls
cd ./../ASSETS
echo Please wait...
:a
node ./g.js
timeout /t 1 >nul
goto a