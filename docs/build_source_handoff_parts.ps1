$root='C:\Users\Takhi\Desktop\Desktop-Organized\Hackathon\CodeSprint'
$files=@('package.json','tsconfig.json','next.config.mjs','vercel.json','.gitignore','README.md','next-env.d.ts','app/layout.tsx','app/page.tsx','app/globals.css','app/api/engine/route.ts','app/cases/page.tsx','app/human/page.tsx','app/impact/page.tsx','app/lab/page.tsx','app/map/page.tsx','app/simulator/page.tsx','app/vision/page.tsx','lib/engine.ts','components/Console.tsx','components/HumanLoop.tsx','components/Lab.tsx','components/RealMap.tsx')
$sections=@()
foreach($f in $files){
  $p=Join-Path $root $f
  if(Test-Path $p){
    if($f -match '\.(tsx|ts)$'){$lang='tsx'}
    elseif($f -match '\.css$'){$lang='css'}
    elseif($f -match '\.json$'){$lang='json'}
    elseif($f -match '\.mjs$'){$lang='js'}
    else{$lang='text'}
    $s="`n### $f`n" + '```' + $lang + "`n" + (Get-Content $p -Raw) + "`n" + '```'
    $sections+=@{Text=$s; Length=$s.Length}
  }
}
$total=($sections | ForEach-Object { $_.Length } | Measure-Object -Sum).Sum
$half=$total/2
$p1=New-Object System.Text.StringBuilder
$p2=New-Object System.Text.StringBuilder
[void]$p1.AppendLine('# KachraLab Full Source Handoff - Part 1 of 2')
[void]$p1.AppendLine('Complete source snapshot. Continue with Part 2.')
[void]$p2.AppendLine('# KachraLab Full Source Handoff - Part 2 of 2')
[void]$p2.AppendLine('Continuation of complete source snapshot.')
$len1=0
foreach($sec in $sections){
  if($len1 -eq 0 -or ($len1 + $sec.Length) -le $half){[void]$p1.Append($sec.Text); $len1+=$sec.Length}
  else{[void]$p2.Append($sec.Text)}
}
$o1=Join-Path $root 'docs\KachraLab_Full_Source_Part1.md'
$o2=Join-Path $root 'docs\KachraLab_Full_Source_Part2.md'
Set-Content -Path $o1 -Value $p1.ToString() -Encoding UTF8
Set-Content -Path $o2 -Value $p2.ToString() -Encoding UTF8
Copy-Item $o1 'C:\Users\Takhi\Desktop\KachraLab_Full_Source_Part1.md'
Copy-Item $o2 'C:\Users\Takhi\Desktop\KachraLab_Full_Source_Part2.md'
$l1=(Get-Content $o1 -Raw).Length
$l2=(Get-Content $o2 -Raw).Length
"PART1=$l1 PART2=$l2"
