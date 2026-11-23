$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=== 1. Kiem tra dich vu MySQL80 (port 3306 - quan_ly_phong) ===" -ForegroundColor Cyan
$svc = Get-Service -Name "MySQL80" -ErrorAction SilentlyContinue
if ($null -ne $svc -and $svc.Status -ne "Running") {
    Write-Host "Dang khoi dong MySQL80..." -ForegroundColor Yellow
    Start-Service -Name "MySQL80"
}
Write-Host "MySQL80 (localhost:3306/quan_ly_phong) da san sang!" -ForegroundColor Green

Write-Host "=== 2. Khoi dong Backend (port 9090) ===" -ForegroundColor Cyan
$jdkPath = "C:\Users\Administrator\.jdks\ms-21.0.10"
$backendCmd = "`$env:JAVA_HOME='$jdkPath'; `$env:PATH='$jdkPath\bin;' + `$env:PATH; Set-Location '$root\Backend-qlyPhong'; .\mvnw.cmd spring-boot:run"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

Write-Host "=== 3. Khoi dong Frontend (port 5174) ===" -ForegroundColor Cyan
$frontendCmd = "Set-Location '$root\Frontend-QlyPhong'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host ""
Write-Host "Da mo 2 cua so Backend va Frontend (dung chung DB quan_ly_phong tai localhost:3306)!" -ForegroundColor Green
Write-Host "  - Frontend : http://localhost:5174"
Write-Host "  - Backend  : http://localhost:9090"
Write-Host "  - Swagger  : http://localhost:9090/swagger-ui/index.html"
Write-Host "  - Database : localhost:3306 / quan_ly_phong (MySQL Workbench)"
Write-Host "  - Admin    : admin@example.com / 12345"
