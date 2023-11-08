@echo off
setlocal enabledelayedexpansion

REM Set the path to the folder containing the files
set "folder_path=C:\Users\NotHammer\Desktop\AppxManifest"

cd "%folder_path%"

set /a count=1
for %%F in (*.xml) do (
    ren "%%F" "!count!.xml"
    set /a count+=1
)
