# NPM Setup Guide

## Issue
npm is not recognized in PowerShell. This means Node.js/npm is either:
1. Not installed
2. Not added to your system PATH

## Solutions

### Option 1: Install Node.js (Recommended)
1. Download Node.js from: https://nodejs.org/
2. Install the LTS version (includes npm)
3. During installation, make sure to check "Add to PATH"
4. Restart your terminal/PowerShell
5. Verify: `node --version` and `npm --version`

### Option 2: Use Full Path to npm
If Node.js is installed but not in PATH, find it and use the full path:

```powershell
# Common locations:
C:\Program Files\nodejs\npm.cmd
C:\Program Files (x86)\nodejs\npm.cmd
$env:APPDATA\npm\npm.cmd
```

Then run:
```powershell
& "C:\Program Files\nodejs\npm.cmd" run dev
```

### Option 3: Add Node.js to PATH Manually
1. Find where Node.js is installed (usually `C:\Program Files\nodejs`)
2. Open System Properties → Environment Variables
3. Edit "Path" under System variables
4. Add: `C:\Program Files\nodejs`
5. Restart PowerShell

### Option 4: Use nvm-windows (If you have it)
```powershell
nvm use <version>
npm run dev
```

## Quick Check Commands

Run these to diagnose:
```powershell
# Check if node exists
Get-Command node -ErrorAction SilentlyContinue

# Check PATH for node
$env:PATH -split ';' | Select-String -Pattern "node"

# Check common locations
Test-Path "C:\Program Files\nodejs\npm.cmd"
Test-Path "$env:APPDATA\npm\npm.cmd"
```

## After Setup
Once npm is working, run:
```powershell
npm run dev
```

Your project is fully repaired and ready to run!

