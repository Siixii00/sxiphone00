# PowerShell script to replace localStorage operations with sx-helper functions

$file = "E:\new\sxiphone00\apps\chat\chat.js"
$content = Get-Content $file -Raw

# Pattern replacements
$replacements = @(
    # localStorage.getItem('xxx') -> await sxGetItem('xxx')
    @{
        Pattern = 'localStorage\.getItem\([''"]([^''"]+)[''"]\)'
        Replacement = 'await sxGetItem(''$1'')'
    },
    # localStorage.setItem('xxx', value) -> await sxSetItem('xxx', value)
    @{
        Pattern = 'localStorage\.setItem\([''"]([^''"]+)[''"],\s*([^)]+)\)'
        Replacement = 'await sxSetItem(''$1'', $2)'
    },
    # localStorage.removeItem('xxx') -> await sxRemoveItem('xxx')
    @{
        Pattern = 'localStorage\.removeItem\([''"]([^''"]+)[''"]\)'
        Replacement = 'await sxRemoveItem(''$1'')'
    },
    # JSON.parse(localStorage.getItem('xxx')) -> await sxGetJSON('xxx')
    @{
        Pattern = 'JSON\.parse\(localStorage\.getItem\([''"]([^''"]+)[''"]\)\)'
        Replacement = 'await sxGetJSON(''$1'')'
    },
    # localStorage.setItem('xxx', JSON.stringify(value)) -> await sxSetJSON('xxx', value)
    @{
        Pattern = 'localStorage\.setItem\([''"]([^''"]+)[''"],\s*JSON\.stringify\(([^)]+)\)\)'
        Replacement = 'await sxSetJSON(''$1'', $2)'
    }
)

foreach ($replacement in $replacements) {
    $content = $content -replace $replacement.Pattern, $replacement.Replacement
}

# Save the modified content
$content | Set-Content $file -Encoding UTF8

Write-Host "Replacements completed successfully"