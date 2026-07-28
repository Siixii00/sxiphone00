$file = "E:\new\sxiphone00\apps\chat\chat.js"
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

Write-Host "Processing remaining localStorage operations..."

# Handle JSON.parse(localStorage.getItem(KEY)) where KEY is a constant
$content = $content -replace 'JSON\.parse\(localStorage\.getItem\(([^)]+)\)\)', 'await sxGetJSON($1)'

# Handle localStorage.setItem(KEY, JSON.stringify(value))
$content = $content -replace 'localStorage\.setItem\(([^,]+),\s*JSON\.stringify\(([^)]+)\)\)', 'await sxSetJSON($1, $2)'

# Handle localStorage.setItem with variable key
$content = $content -replace 'localStorage\.setItem\(([^,]+),\s*([^)]+)\)', 'await sxSetItem($1, $2)'

# Handle localStorage.getItem with variable key
$content = $content -replace 'localStorage\.getItem\(([^)]+)\)', 'await sxGetItem($1)'

# Handle localStorage.removeItem with variable key
$content = $content -replace 'localStorage\.removeItem\(([^)]+)\)', 'await sxRemoveItem($1)'

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
Write-Host "Replacements completed!"

# Verify
$newContent = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
$remaining = ([regex]::Matches($newContent, "localStorage\.(get|set|remove)Item")).Count
Write-Host "Remaining localStorage operations: $remaining"