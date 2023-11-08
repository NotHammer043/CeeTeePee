@echo off
setlocal enabledelayedexpansion

for %%i in (1.xml 2.xml 3.xml 4.xml 5.xml 6.xml 7.xml 8.xml 9.xml 10.xml 11.xml 12.xml 13.xml 14.xml 15.xml 16.xml 17.xml 18.xml 19.xml 20.xml 21.xml 22.xml 23.xml 24.xml 25.xml 26.xml 27.xml 28.xml 29.xml 30.xml 31.xml 32.xml 33.xml 34.xml 35.xml 36.xml 37.xml 38.xml 39.xml 40.xml 41.xml 42.xml 43.xml 44.xml 45.xml 46.xml 47.xml 48.xml 49.xml 50.xml 51.xml 52.xml 53.xml 54.xml 55.xml 56.xml 57.xml 58.xml 59.xml 60.xml 61.xml 62.xml 63.xml 64.xml 65.xml 66.xml 67.xml 68.xml 69.xml 70.xml 71.xml 72.xml 73.xml 74.xml 75.xml 76.xml 77.xml 78.xml 79.xml 80.xml 81.xml 82.xml 83.xml 84.xml 85.xml 86.xml 87.xml 88.xml 89.xml 90.xml 91.xml 92.xml 93.xml 94.xml 95.xml 96.xml 97.xml 98.xml 99.xml 100.xml) do (
    set "file=%%i"
    set "filename=!file:~0,-4!"
    call :edit_xml !filename!
)

exit /b

:edit_xml
set "filename=%1"
setlocal disabledelayedexpansion

(
    for /f "usebackq delims=" %%j in ("%filename%.xml") do (
        set "line=%%j"
        setlocal enabledelayedexpansion
        set "line=!line:ROBLOXCORPORATION.ROBLOX1=ROBLOXCORPORATION.ROBLOX%filename%!"
        set "line=!line:Roblox 1=Roblox %filename%!"
        echo(!line!
        endlocal
    )
) > "%filename%_temp.xml"

move /y "%filename%_temp.xml" "%filename%.xml" >nul

exit /b
