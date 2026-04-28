$ErrorActionPreference = 'Stop'

$apps = @(
  @{id='pomodoro';       label='番茄鐘';   icon='fa-clock';        color='#f25f5c'},
  @{id='weather';        label='天氣';     icon='fa-cloud-sun';    color='#4facfe'},
  @{id='twitter';        label='推特';     icon='fa-twitter';      color='#1da1f2'},
  @{id='facebook';       label='臉書';     icon='fa-facebook-f';   color='#1877f2'},
  @{id='chrome';         label='Chrome';   icon='fa-chrome';       color='#fbbc05'},
  @{id='bilibili';       label='bilibili'; icon='fa-video';        color='#00a1d6'},
  @{id='youtube';        label='YouTube';  icon='fa-youtube';      color='#ff0000'},
  @{id='exchange-diary'; label='交換日記';  icon='fa-book';         color='#9c27b0'},
  @{id='lofter';         label='lofter';   icon='fa-pen';          color='#4e9a51'},
  @{id='drift-bottle';   label='漂流瓶';   icon='fa-anchor';       color='#2d9cdb'},
  @{id='match-3';        label='消消樂';   icon='fa-th-large';     color='#ff8a3d'},
  @{id='bubbles';        label='bubbles';  icon='fa-comments';     color='#6c63ff'},
  @{id='weverse';        label='weverse';  icon='fa-users';        color='#20c997'},
  @{id='daily-recipe';   label='每日食譜'; icon='fa-utensils';     color='#ffb347'},
  @{id='music';          label='音樂';     icon='fa-music';        color='#ff5f9f'},
  @{id='delivery';       label='外送';     icon='fa-motorcycle';   color='#ff7043'},
  @{id='taobao';         label='淘寶';     icon='fa-shopping-bag'; color='#ff6a00'},
  @{id='dating';         label='約會';     icon='fa-heart';        color='#e91e63'},
  @{id='guzi-guide';     label='谷子圖鑒'; icon='fa-seedling';     color='#7cb342'},
  @{id='smart-painter';  label='照相館';   icon='fa-paint-brush';  color='#8e44ad'},
  @{id='instagram';      label='Instagram';icon='fa-instagram';    color='#c13584'},
  @{id='timetree';       label='timetree'; icon='fa-calendar-alt'; color='#2ecc71'},
  @{id='pub';            label='酒館';     icon='fa-beer';         color='#c49b45'},
  @{id='kakaopay';       label='kakaopay'; icon='fa-wallet';       color='#f7d300'},
  @{id='widget';         label='widget';   icon='fa-th';           color='#5561ff'},
  @{id='twitch';         label='twitch';   icon='fa-twitch';       color='#9146ff'}
)

foreach ($app in $apps) {
    $dir = Join-Path -Path "apps" -ChildPath $app.id
    New-Item -ItemType Directory -Force -Path $dir | Out-Null

    $html = @"
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>$($app.label)</title>
  <link rel="stylesheet" href="$($app.id).css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
  <div class="placeholder">
    <div class="icon"><i class="fas $($app.icon)"></i></div>
    <h1>$($app.label)</h1>
    <p>開發中，敬請期待</p>
    <button onclick="window.parent?.postMessage({type:'closeApp'}, '*')">返回首頁</button>
  </div>
  <script src="$($app.id).js"></script>
</body>
</html>
"@
    Set-Content -Path (Join-Path $dir "$($app.id).html") -Value $html -Encoding UTF8

    $css = @"
:root { color-scheme: light dark; }
body {
  margin: 0;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: radial-gradient(circle at 20% 20%, rgba(255,255,255,.12), transparent 40%),
              linear-gradient(135deg, #0f1115, #181c24);
  color: #f5f7fb;
}
.placeholder {
  text-align: center;
  padding: 32px 24px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.35);
  backdrop-filter: blur(12px);
  width: min(90vw, 360px);
}
.placeholder .icon {
  width: 72px;
  height: 72px;
  margin: 0 auto 14px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $($app.color);
  color: #fff;
  font-size: 32px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.28);
}
.placeholder h1 {
  font-size: 22px;
  margin: 0 0 8px;
  letter-spacing: 0.2px;
}
.placeholder p {
  font-size: 14px;
  margin: 0 0 18px;
  opacity: 0.9;
}
.placeholder button {
  border: none;
  border-radius: 12px;
  padding: 12px 16px;
  background: #4f8bff;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(79,139,255,0.35);
}
.placeholder button:hover { background: #3d7bf0; }
"@
    Set-Content -Path (Join-Path $dir "$($app.id).css") -Value $css -Encoding UTF8

    $js = "console.log('Loaded app: $($app.id)');"
    Set-Content -Path (Join-Path $dir "$($app.id).js") -Value $js -Encoding UTF8
}

Write-Host "Generated placeholder apps: $($apps.Count)" -ForegroundColor Green
