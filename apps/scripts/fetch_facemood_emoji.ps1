Add-Type -AssemblyName System.Web

$categories = @(
    '%E5%B8%B8%E7%94%A8',
    '%E9%AB%98%E8%88%88',
    '%E6%86%A4%E6%80%92',
    '%E5%93%80%E6%84%81',
    '%E6%82%B2%E5%8A%87',
    '%E6%84%89%E6%82%85',
    '%E7%84%A1%E5%A5%88',
    '%E4%BA%92%E5%8B%95',
    '%E6%B2%AE%E5%96%AA',
    '%E9%81%93%E6%AD%89',
    '%E6%84%9B',
    '%E5%8B%95%E7%89%A9',
    '%E9%A9%9A%E8%A8%9D'
)

function Get-EmojiItems([string]$Html) {
    $matches = [regex]::Matches($Html, '<div class="emoji-text[^">]*">\s*([^<]+)')
    $items = @()
    foreach ($m in $matches) {
        $text = [System.Web.HttpUtility]::HtmlDecode($m.Groups[1].Value.Trim())
        if ($text) {
            $items += $text
        }
    }
    return $items
}

function Get-MaxPage([string]$Html) {
    $pageMatches = [regex]::Matches($Html, 'page=([0-9]+)')
    if ($pageMatches.Count -eq 0) { return 1 }
    $max = 1
    foreach ($pm in $pageMatches) {
        $num = [int]$pm.Groups[1].Value
        if ($num -gt $max) { $max = $num }
    }
    return $max
}

$allItems = @()

foreach ($cat in $categories) {
    $baseUrl = 'https://facemood.grtimed.com/classification/' + $cat
    $html = (Invoke-WebRequest -Uri $baseUrl -UseBasicParsing).Content
    $allItems += Get-EmojiItems -Html $html

    $maxPage = Get-MaxPage -Html $html
    if ($maxPage -gt 1) {
        for ($p = 2; $p -le $maxPage; $p++) {
            $pageHtml = (Invoke-WebRequest -Uri ($baseUrl + '?page=' + $p) -UseBasicParsing).Content
            $allItems += Get-EmojiItems -Html $pageHtml
        }
    }
}

$seen = New-Object System.Collections.Generic.HashSet[string]
$unique = @()
foreach ($item in $allItems) {
    if ($item -and $seen.Add($item)) {
        $unique += $item
    }
}

$json = $unique | ConvertTo-Json -Depth 2
Set-Content -Path 'apps/chat/emoji-data.json' -Value $json -Encoding UTF8

Write-Output ("emoji_count=" + $unique.Count)
