@echo off
chcp 65001 >nul
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$exts = @('.mp3','.m4a','.wav','.ogg'); ^
   $seen = @{}; $items = New-Object System.Collections.Generic.List[string]; ^
   $dirs = @('.', '..\tree\music'); ^
   foreach ($d in $dirs) { ^
     if (Test-Path $d) { ^
       Get-ChildItem -LiteralPath $d -File | Where-Object { $exts -contains $_.Extension.ToLowerInvariant() } | Sort-Object Name | ForEach-Object { ^
         $k = 'file:' + $_.Name.ToLowerInvariant(); ^
         if (-not $seen.ContainsKey($k)) { ^
           $seen[$k] = $true; ^
           $t = [System.IO.Path]::GetFileNameWithoutExtension($_.Name).Replace('\','\\').Replace('\"','\\\"'); ^
           $f = $_.Name.Replace('\','\\').Replace('\"','\\\"'); ^
           $items.Add('  { title: \"' + $t + '\", file: \"' + $f + '\" }'); ^
         } ^
       } ^
     } ^
   } ^
   foreach ($yf in @('.\youtube.txt', '..\tree\music\youtube.txt')) { ^
     if (Test-Path $yf) { ^
       Get-Content -LiteralPath $yf -Encoding UTF8 | ForEach-Object { ^
         $line = $_.Trim(); ^
         if ($line.Length -gt 0 -and -not $line.StartsWith('#')) { ^
           $ytTitle = ''; $ytUrl = ''; $ytDur = ''; ^
           if ($line.Contains('|')) { ^
             $parts = $line.Split('|', 3); ^
             $ytTitle = $parts[0].Trim(); ^
             $ytUrl = $parts[1].Trim(); ^
             if ($parts.Length -ge 3) { $ytDur = $parts[2].Trim(); } ^
           } else { ^
             $ytUrl = $line; ^
           } ^
           if ($ytUrl.Length -gt 0 -and -not $seen.ContainsKey('yt:' + $ytUrl)) { ^
             $seen['yt:' + $ytUrl] = $true; ^
             $et = $ytTitle.Replace('\','\\').Replace('\"','\\\"'); ^
             $eu = $ytUrl.Replace('\','\\').Replace('\"','\\\"'); ^
             $ed = $ytDur.Replace('\','\\').Replace('\"','\\\"'); ^
             if ($et.Length -gt 0 -and $ed.Length -gt 0) { ^
               $items.Add('  { title: \"' + $et + '\", youtube: \"' + $eu + '\", duration: \"' + $ed + '\" }'); ^
             } elseif ($et.Length -gt 0) { ^
               $items.Add('  { title: \"' + $et + '\", youtube: \"' + $eu + '\" }'); ^
             } elseif ($ed.Length -gt 0) { ^
               $items.Add('  { youtube: \"' + $eu + '\", duration: \"' + $ed + '\" }'); ^
             } else { ^
               $items.Add('  { youtube: \"' + $eu + '\" }'); ^
             } ^
           } ^
         } ^
       } ^
     } ^
   } ^
   $lines = New-Object System.Collections.Generic.List[string]; ^
   $lines.Add('// ============================================================================'); ^
   $lines.Add('// قائمة الموسيقى المخصصة - Auto-generated (' + $items.Count + ' track(s))'); ^
   $lines.Add('// Double-click update-music.bat anytime after updating music/ or youtube.txt'); ^
   $lines.Add('// ============================================================================'); ^
   $lines.Add('window.CUSTOM_MUSIC_PLAYLIST = ['); ^
   if ($items.Count -gt 0) { $lines.Add(($items -join \",`n\")) } else { ^
     $lines.Add('  // { title: \"اسم المقطوعة\", file: \"my-song.mp3\", duration: \"3:45\" },'); ^
     $lines.Add('  // { title: \"اسم المقطوعة\", youtube: \"https://www.youtube.com/watch?v=VIDEO_ID\", duration: \"4:10\" }'); ^
   } ^
   $lines.Add('];'); ^
   $utf8NoBom = New-Object System.Text.UTF8Encoding($false); ^
   [System.IO.File]::WriteAllLines((Join-Path (Get-Location) 'playlist.js'), $lines, $utf8NoBom); ^
   Write-Host ('[OK] Updated music/playlist.js with ' + $items.Count + ' track(s)!') -ForegroundColor Green"
timeout /t 2 >nul
