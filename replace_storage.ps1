$file = "E:\new\sxiphone00\apps\chat\chat.js"
$backup = "E:\new\sxiphone00\apps\chat\chat.js.backup"
Copy-Item $file $backup -Force

$content = Get-Content $file -Raw

# Replace localStorage.getItem('xxx') -> await sxGetItem('xxx')
$content = $content -replace "localStorage\.getItem\(['`"']([^'`"']+)['`"']\)", 'await sxGetItem(''$1'')'

# Replace localStorage.setItem('xxx', JSON.stringify(value)) -> await sxSetJSON('xxx', value)
$content = $content -replace "localStorage\.setItem\(['`"']([^'`"']+)['`"'],\s*JSON\.stringify\(([^)]+)\)\)", 'await sxSetJSON(''$1'', $2)'

# Replace localStorage.setItem('xxx', value) -> await sxSetItem('xxx', value)
$content = $content -replace "localStorage\.setItem\(['`"']([^'`"']+)['`"'],\s*([^)]+)\)", 'await sxSetItem(''$1'', $2)'

# Replace JSON.parse(localStorage.getItem('xxx')) -> await sxGetJSON('xxx')
$content = $content -replace "JSON\.parse\(localStorage\.getItem\(['`"']([^'`"']+)['`"']\)\)", 'await sxGetJSON(''$1'')'

# Replace localStorage.removeItem('xxx') -> await sxRemoveItem('xxx')
$content = $content -replace "localStorage\.removeItem\(['`"']([^'`"']+)['`"']\)", 'await sxRemoveItem(''$1'')'

$content | Set-Content $file -Encoding UTF8

Write-Host "Replacements completed successfully!"