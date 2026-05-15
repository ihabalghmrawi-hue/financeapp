param(
    [Parameter(Mandatory)]
    [ValidateSet('major','minor','patch','premajor','preminor','prepatch','prerelease')]
    [string]$Increment = 'patch',
    [string]$VersionFile = (Join-Path $PSScriptRoot '..' 'version.json' | Resolve-Path -ErrorAction SilentlyContinue)
)

if (-not $VersionFile -or -not (Test-Path $VersionFile)) {
    $VersionFile = Join-Path $PSScriptRoot '..' 'version.json'
}

$default = @{
    version = '1.0.0'
    build   = 1
    stage   = 'stable'
}

$versionData = if (Test-Path $VersionFile) {
    Get-Content $VersionFile -Raw | ConvertFrom-Json
} else {
    $default
}

$current = [System.Version]::new($versionData.version)
$buildNum = [int]$versionData.build
$stage = $versionData.stage

switch ($Increment) {
    'major' {
        $newVersion = [System.Version]::new($current.Major + 1, 0, 0)
        $buildNum = 1
        $stage = 'stable'
        break
    }
    'minor' {
        $newVersion = [System.Version]::new($current.Major, $current.Minor + 1, 0)
        $buildNum = 1
        $stage = 'stable'
        break
    }
    'patch' {
        $newVersion = [System.Version]::new($current.Major, $current.Minor, $current.Build + 1)
        $buildNum = $buildNum + 1
        $stage = 'stable'
        break
    }
    'premajor' {
        $newVersion = [System.Version]::new($current.Major + 1, 0, 0)
        $buildNum = 1
        $stage = 'alpha'
        break
    }
    'preminor' {
        $newVersion = [System.Version]::new($current.Major, $current.Minor + 1, 0)
        $buildNum = 1
        $stage = 'alpha'
        break
    }
    'prepatch' {
        $newVersion = [System.Version]::new($current.Major, $current.Minor, $current.Build + 1)
        $buildNum = $buildNum + 1
        $stage = 'beta'
        break
    }
    'prerelease' {
        $newVersion = [System.Version]::new($current.Major, $current.Minor, $current.Build)
        $buildNum = $buildNum + 1
        $stage = 'rc'
        break
    }
}

$versionStr = "$($newVersion.Major).$($newVersion.Minor).$($newVersion.Build)"
$versionSuffix = if ($stage -ne 'stable') { "-$stage.$buildNum" } else { '' }

$output = @{
    version = $versionStr
    build   = $buildNum
    stage   = $stage
    full    = "$versionStr$versionSuffix"
    versionCode = $buildNum
    versionName = "$versionStr$versionSuffix"
}

$output | ConvertTo-Json | Set-Content $VersionFile -Encoding UTF8

Write-Host "Version: $($output.full)"
Write-Host "Build:   $buildNum"
Write-Host "Stage:   $stage"

return $output
