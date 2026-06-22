$ErrorActionPreference = "Stop"

$binDir = "$PSScriptRoot\..\bin"
if (-not (Test-Path -Path $binDir)) {
    New-Item -ItemType Directory -Path $binDir | Out-Null
}

Write-Host "Downloading yt-dlp.exe..."
Invoke-WebRequest -Uri "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe" -OutFile "$binDir\yt-dlp.exe"

Write-Host "Downloading ffmpeg (yt-dlp build)..."
$ffmpegZip = "$binDir\ffmpeg.zip"
Invoke-WebRequest -Uri "https://github.com/yt-dlp/FFmpeg-Builds/releases/latest/download/ffmpeg-master-latest-win64-gpl.zip" -OutFile $ffmpegZip

Write-Host "Extracting ffmpeg..."
$ffmpegExt = "$binDir\ffmpeg_ext"
if (Test-Path -Path $ffmpegExt) { Remove-Item -Recurse -Force $ffmpegExt }
Expand-Archive -Path $ffmpegZip -DestinationPath $ffmpegExt -Force

Write-Host "Copying executables..."
Copy-Item -Path "$ffmpegExt\ffmpeg-master-latest-win64-gpl\bin\ffmpeg.exe" -Destination "$binDir\ffmpeg.exe"
Copy-Item -Path "$ffmpegExt\ffmpeg-master-latest-win64-gpl\bin\ffprobe.exe" -Destination "$binDir\ffprobe.exe"

Write-Host "Cleaning up..."
Remove-Item -Path $ffmpegZip -Force
Remove-Item -Recurse -Force $ffmpegExt

Write-Host "Done! yt-dlp and ffmpeg are ready in the bin/ directory."
