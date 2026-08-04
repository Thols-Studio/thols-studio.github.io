@echo off
REM ============================================================
REM  Mermaid Editor — browser opener
REM
REM  HOW TO USE:
REM   1. Start the server yourself with Python, e.g.:
REM        python -m http.server 8765
REM      (run it from the repo root folder)
REM   2. If your port is different, edit the PORT line below.
REM   3. Double-click this .bat to open the editor in your browser.
REM
REM  This file does NOT start a server — it only opens the page.
REM  Close the Python server window when you're done.
REM ============================================================

REM ========== EDIT THIS IF YOUR PORT IS DIFFERENT ==========
set PORT=8765
REM ========================================================

REM ========== PICK WHICH EDITOR TO OPEN ===================
REM   v11  = Mermaid 11 editor (needs the running server)
REM   v10  = older Mermaid 10 editor
set PAGE=v11
REM ========================================================

setlocal enabledelayedexpansion

if /I "%PAGE%"=="v11" (
  set URL=http://localhost:%PORT%/mermaidv11/mermaid-editor-v11.html
) else (
  set URL=http://localhost:%PORT%/mermaid/mermaid-editor.html
)

echo.
echo  Opening: !URL!
echo  ^(Make sure your Python server is running on port %PORT%^)
echo.

start "" "!URL!"

endlocal
