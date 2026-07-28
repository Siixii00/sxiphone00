$file = "E:\new\sxiphone00\apps\chat\dating-invitation.js"
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

Write-Host "Processing dating-invitation.js..."

# Replace localStorage operations
$content = $content -replace "localStorage\.getItem\('([^']+)'\)", 'await sxGetItem(''$1'')'
$content = $content -replace "localStorage\.setItem\('([^']+)',\s*JSON\.stringify\(([^)]+)\)\)", 'await sxSetJSON(''$1'', $2)'
$content = $content -replace "localStorage\.setItem\('([^']+)',\s*([^)]+)\)", 'await sxSetItem(''$1'', $2)'

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
Write-Host "Replacements completed!"

# Verify
$newContent = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
$remaining = ([regex]::Matches($newContent, "localStorage\.(get|set|remove)Item")).Count
Write-Host "Remaining localStorage operations: $remaining"