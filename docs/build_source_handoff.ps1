$root='C:\Users\Takhi\Desktop\Desktop-Organized\Hackathon\CodeSprint'
$out=Join-Path $root 'docs\KachraLab_Full_Source_Handoff.md'
$files=@('package.json','tsconfig.json','next.config.mjs','vercel.json','.gitignore','README.md','next-env.d.ts','app/layout.tsx','app/page.tsx','app/globals.css','app/api/engine/route.ts','app/cases/page.tsx','app/human/page.tsx','app/impact/page.tsx','app/lab/page.tsx','app/map/page.tsx','app/simulator/page.tsx','app/vision/page.tsx','lib/engine.ts','components/Console.tsx','components/HumanLoop.tsx','components/Lab.tsx','components/RealMap.tsx')
$sb=New-Object System.Text.StringBuilder
[void]$sb.AppendLine('# KachraLab Full Source Handoff')
[void]$sb.AppendLine('Copy this file into any AI. It contains the complete source snapshot and tech stack.')
[void]$sb.AppendLine('## Tech stack')
[void]$sb.AppendLine('Next.js 16 App Router, React, TypeScript, Leaflet + OpenStreetMap, Vercel serverless API route, LocalStorage, Web Crypto SHA-256, Canvas. No database or external AI credentials.')
[void]$sb.AppendLine('## Source files')
foreach($f in $files){
  $p=Join-Path $root $f
  if(Test-Path $p){
    if($f -match '\.(tsx|ts)$'){$lang='tsx'}
    elseif($f -match '\.css$'){$lang='css'}
    elseif($f -match '\.json$'){$lang='json'}
    elseif($f -match '\.mjs$'){$lang='js'}
    else{$lang='text'}
    [void]$sb.AppendLine('')
    [void]$sb.AppendLine("### $f")
    [void]$sb.AppendLine('```'+$lang)
    [void]$sb.AppendLine((Get-Content $p -Raw))
    [void]$sb.AppendLine('```')
  }
}
Set-Content -Path $out -Value $sb.ToString() -Encoding UTF8
Copy-Item $out 'C:\Users\Takhi\Desktop\KachraLab_Full_Source_Handoff.md'
"CHARS=$((Get-Content $out -Raw).Length)"
