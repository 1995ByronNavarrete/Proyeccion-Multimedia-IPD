param(
    [string]$Version = "",
    [string]$CommitMessage = ""
)

# ─── Config ───
$owner = "1995ByronNavarrete"
$repo = "Proyeccion-Multimedia-IPD"

# ─── Get current version ───
$pkg = Get-Content "package.json" | ConvertFrom-Json
$currentVersion = $pkg.version
if (-not $Version) { $Version = $currentVersion }

# ─── Get changes ───
$status = git status --porcelain
$filesChanged = @()
$added = @()
$modified = @()
$deleted = @()

foreach ($line in $status) {
    $flag = $line.Substring(0, 2).Trim()
    $file = $line.Substring(3)
    $filesChanged += $file
    if ($flag -eq 'A' -or $flag -eq '??') { $added += $file }
    elseif ($flag -eq 'D') { $deleted += $file }
    elseif ($flag -eq 'M' -or $flag -eq 'R') { $modified += $file }
}

if ($filesChanged.Count -eq 0) {
    Write-Host "No hay cambios para commitear." -ForegroundColor Yellow
    exit
}

# ─── Build summary ───
$summaryLines = @()
$summaryLines += "## Release v$Version"
$summaryLines += ""

if ($added.Count -gt 0) {
    $summaryLines += "### ✨ Nuevos archivos"
    foreach ($f in $added) { $summaryLines += "- $f" }
    $summaryLines += ""
}
if ($modified.Count -gt 0) {
    $summaryLines += "### 🔧 Archivos modificados"
    foreach ($f in $modified) { $summaryLines += "- $f" }
    $summaryLines += ""
}
if ($deleted.Count -gt 0) {
    $summaryLines += "### ❌ Archivos eliminados"
    foreach ($f in $deleted) { $summaryLines += "- $f" }
    $summaryLines += ""
}

# ─── Get recent log for context ───
$recentLog = git log --oneline -10
$summaryLines += "### 📋 Commits recientes"
$summaryLines += $recentLog
$summaryLines += ""

# ─── Build a commit message if not provided ───
if (-not $CommitMessage) {
    $CommitMessage = "Release v$Version"
    if ($modified.Count -le 5 -and $modified.Count -gt 0) {
        $CommitMessage += ": $($modified -join ', ')"
    }
}

# ─── Commit ───
Write-Host "`n📦 Commit: $CommitMessage" -ForegroundColor Cyan
git add -A
git commit -m $CommitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al commitear" -ForegroundColor Red
    exit 1
}

# ─── Bump version if needed ───
$pkg = Get-Content "package.json" | ConvertFrom-Json
if ($pkg.version -ne $Version) {
    Write-Host "⚠️  package.json tiene version $($pkg.version), se usara esa para el tag" -ForegroundColor Yellow
    $Version = $pkg.version
}

# ─── Tag ───
$tag = "v$Version"
git tag -f $tag
Write-Host "🏷️  Tag: $tag" -ForegroundColor Cyan

# ─── Push ───
Write-Host "`n⬆️  Subiendo commits y tag..." -ForegroundColor Cyan
git push origin master
git push origin $tag --force

# ─── Build and release ───
Write-Host "`n🔨 Compilando y publicando release..." -ForegroundColor Cyan
npm run release

# ─── Output summary ───
Write-Host "`n" -NoNewline
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║          ✅ RELEASE COMPLETADO              ║" -ForegroundColor Green
Write-Host "╠══════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║  Versión: $($Version.PadRight(35))║" -ForegroundColor Green
Write-Host "║  Tag:     $($tag.PadRight(35))║" -ForegroundColor Green
Write-Host "╠══════════════════════════════════════════════╣" -ForegroundColor Green
foreach ($line in $summaryLines) {
    $clean = $line -replace '[^\x20-\x7E\u00A0-\u00FF]', ''
    if ($clean.Length -gt 45) { $clean = $clean.Substring(0, 42) + "..." }
    Write-Host "║  $($clean.PadRight(44))║" -ForegroundColor Green
}
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Green

# ─── Save summary to file ───
$summaryFile = "release-summary-v$Version.md"
$summaryLines -join "`n" | Out-File -FilePath $summaryFile -Encoding UTF8
Write-Host "`n📝 Resumen guardado en: $summaryFile" -ForegroundColor Cyan
Write-Host "🌐 Release URL: https://github.com/$owner/$repo/releases/tag/$tag" -ForegroundColor Cyan
