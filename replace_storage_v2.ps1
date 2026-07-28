$file = "E:\new\sxiphone00\apps\chat\chat.js"
$backup = "E:\new\sxiphone00\apps\chat\chat.js.manual_backup"

# Create backup
Copy-Item $file $backup -Force
Write-Host "Backup created at: $backup"

# Read content
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

Write-Host "Original file length: $($content.Length)"

# Count matches before replacement
$getItemMatches = ([regex]::Matches($content, "localStorage\.getItem\(['`"']([^'`"']+)['`"']\)")).Count
$setItemMatches = ([regex]::Matches($content, "localStorage\.setItem\(['`"']([^'`"']+)['`"'],\s*([^)]+)\)")).Count
$removeItemMatches = ([regex]::Matches($content, "localStorage\.removeItem\(['`"']([^'`"']+)['`"']\)")).Count

Write-Host "Before replacement:"
Write-Host "  localStorage.getItem: $getItemMatches"
Write-Host "  localStorage.setItem: $setItemMatches"
Write-Host "  localStorage.removeItem: $removeItemMatches"

# Perform replacements
# 1. JSON.parse(localStorage.getItem('xxx')) -> await sxGetJSON('xxx')
$content = $content -replace "JSON\.parse\(localStorage\.getItem\(['`"']([^'`"']+)['`"']\)\)", 'await sxGetJSON(''$1'')'

# 2. localStorage.setItem('xxx', JSON.stringify(value)) -> await sxSetJSON('xxx', value)
$content = $content -replace "localStorage\.setItem\(['`"']([^'`"']+)['`"'],\s*JSON\.stringify\(([^)]+)\)\)", 'await sxSetJSON(''$1'', $2)'

# 3. localStorage.getItem('xxx') -> await sxGetItem('xxx')
$content = $content -replace "localStorage\.getItem\(['`"']([^'`"']+)['`"']\)", 'await sxGetItem(''$1'')'

# 4. localStorage.setItem('xxx', value) -> await sxSetItem('xxx', value)
# This needs to be careful not to match already replaced patterns
$content = $content -replace "localStorage\.setItem\(['`"']([^'`"']+)['`"'],\s*([^)]+)\)", 'await sxSetItem(''$1'', $2)'

# 5. localStorage.removeItem('xxx') -> await sxRemoveItem('xxx')
$content = $content -replace "localStorage\.removeItem\(['`"']([^'`"']+)['`"']\)", 'await sxRemoveItem(''$1'')'

# Write content back
[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)

Write-Host "Replacements completed!"
Write-Host "New file length: $($content.Length)"

# Verify replacements
$newContent = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
$remainingGetItem = ([regex]::Matches($newContent, "localStorage\.getItem")).Count
$remainingSetItem = ([regex]::Matches($newContent, "localStorage\.setItem")).Count
$remainingRemoveItem = ([regex]::Matches($newContent, "localStorage\.removeItem")).Count

Write-Host "After replacement:"
Write-Host "  localStorage.getItem remaining: $remainingGetItem"
Write-Host "  localStorage.setItem remaining: $remainingSetItem"
Write-Host "  localStorage.removeItem remaining: $remainingRemoveItem"