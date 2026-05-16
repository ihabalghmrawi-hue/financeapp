# Comprehensive i18n migration script
# Processes all .tsx and .ts files to replace Arabic strings with i18n calls

$ErrorActionPreference = "Continue"
$projectRoot = "D:\financeapp"

Write-Host "=== Comprehensive i18n Migration ===" -ForegroundColor Cyan

# First, add all necessary keys to en.ts and ar.ts
# Read current files
$enPath = "$projectRoot\src\lib\i18n\locales\en.ts"
$arPath = "$projectRoot\src\lib\i18n\locales\ar.ts"

$enContent = Get-Content $enPath -Raw
$arContent = Get-Content $arPath -Raw

# Count Arabic string occurrences in all files
$totalArabic = 0
$filesWithArabic = @()

# Find all .tsx files with Arabic
$tsxFiles = Get-ChildItem -Path "$projectRoot\src\app\dashboard" -Recurse -Filter "*.tsx" | 
    Where-Object { $_.DirectoryName -notmatch '\\node_modules\\' }

# Count and list
$fileCount = 0
$stringCount = 0
foreach ($file in $tsxFiles) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match '[\u0600-\u06FF]') {
        $fileCount++
        # Count Arabic strings
        $matches = [regex]::Matches($content, '"([^"]*[\u0600-\u06FF][^"]*)"')
        $stringCount += $matches.Count
        $filesWithArabic += $file.FullName
    }
}

Write-Host "Found $fileCount files with $stringCount Arabic strings" -ForegroundColor Yellow
Write-Host ""

# Now, let's add the import to all 'use client' files and replace common strings
# We'll use a "dumb" but effective approach: find and replace

Write-Host "=== Adding useT imports and replacing Arabic strings ===" -ForegroundColor Cyan

# Keep track of what keys we need
$neededKeys = @{}
$neededKeysAr = @{}

# Helper to add a key
function Add-Key {
    param($Key, $EnValue, $ArValue)
    $neededKeys[$Key] = $EnValue
    $neededKeysAr[$Key] = $ArValue
}

# Add all common keys we'll need
Add-Key "dashboard.noDressesYet" "No dresses yet" "لا يوجد فساتين بعد"
Add-Key "dashboard.noDressesDesc" "Start by adding your dresses to receive bookings and manage rentals" "ابدأ بإضافة فساتينك حتى تتمكن من استقبال الحجوزات وإدارة التأجير"
Add-Key "dashboard.addFirstDress" "Add First Dress" "أضف أول فستان"
Add-Key "dashboard.browseCalendar" "Browse Calendar" "استعرض التقويم"
Add-Key "dashboard.dressesAvailable" "{{available}} available · {{rented}} rented · {{late}} late" "{{available}} فستان متاح · {{rented}} مؤجر · {{late}} متأخر"
Add-Key "dashboard.newBooking" "New Booking" "حجز جديد"
Add-Key "dashboard.availableDresses" "Available Dresses" "فساتين متاحة"
Add-Key "dashboard.outOfTotal" "of {{total}}" "من {{total}}"
Add-Key "dashboard.rentedNow" "Rented Now" "مؤجرة الآن"
Add-Key "dashboard.activeBooking" "Active Booking" "حجز نشط"
Add-Key "dashboard.totalRevenue" "Total Revenue" "إجمالي الإيرادات"
Add-Key "dashboard.allTime" "All Time" "كل الوقت"
Add-Key "dashboard.pendingPayments" "Pending Payments" "مدفوعات معلقة"
Add-Key "dashboard.uncollected" "Uncollected" "غير محصّلة"
Add-Key "dashboard.dresses" "Dresses" "الفساتين"
Add-Key "dashboard.dressCount" "{{count}} dress" "{{count}} فستان"
Add-Key "dashboard.quickBooking" "Quick Booking" "حجز سريع"
Add-Key "dashboard.calendar" "Calendar" "التقويم"
Add-Key "dashboard.fullView" "Full View" "رؤية كاملة"
Add-Key "dashboard.pricing" "Pricing" "التسعير"
Add-Key "dashboard.packagesAndPrices" "Packages & Prices" "الباقات والأسعار"
Add-Key "dashboard.welcomeTo" "Welcome to {{name}}!" "مرحباً في {{name}}!"
Add-Key "dashboard.noProductsDesc" "You haven't added any products yet. Start by adding products to sell and track" "لم تُضف أي منتجات بعد. ابدأ بإضافة منتجاتك لتتمكن من البيع والتتبع"
Add-Key "dashboard.addFirstProduct" "Add First Product" "أضف أول منتج"
Add-Key "dashboard.openPOS" "Open POS" "افتح نقطة البيع"
Add-Key "dashboard.startSelling" "Start recording your first sale" "ابدأ بتسجيل أول عملية بيع"
Add-Key "dashboard.todayInvoices" "{{count}} invoice today" "{{count}} فاتورة اليوم"
Add-Key "dashboard.pos" "POS" "نقطة البيع"
Add-Key "dashboard.todaySales" "Today Sales" "مبيعات اليوم"
Add-Key "dashboard.monthSales" "Month Sales" "مبيعات الشهر"
Add-Key "dashboard.monthInvoices" "{{count}} invoice" "{{count}} فاتورة"
Add-Key "dashboard.thisMonth" "This month" "هذا الشهر"
Add-Key "dashboard.netProfit" "Net Profit" "صافي الربح"
Add-Key "dashboard.afterExpenses" "After expenses" "بعد المصروفات"
Add-Key "dashboard.expenses" "Expenses" "المصروفات"
Add-Key "dashboard.recentSales" "Recent Sales" "آخر المبيعات"
Add-Key "dashboard.viewAll" "View All" "عرض الكل"
Add-Key "dashboard.noSalesYet" "No sales yet" "لا توجد مبيعات بعد"
Add-Key "dashboard.noSalesDesc" "Start by creating your first sale" "ابدأ بإنشاء أول عملية بيع"
Add-Key "dashboard.cash" "Cash" "نقدي"
Add-Key "dashboard.lateReturns" "Late Returns" "متأخرات الإرجاع"
Add-Key "dashboard.lateReturnsCount" "Late Returns ({{count}})" "متأخرات الإرجاع ({{count}})"
Add-Key "dashboard.manage" "Manage" "إدارة"
Add-Key "dashboard.noLateReturns" "No late returns — great job!" "لا توجد تأخيرات — عمل ممتاز!"
Add-Key "dashboard.lateDays" "{{days}} days late" "{{days}} يوم تأخير"
Add-Key "dashboard.todayBookings" "Today Bookings" "حجوزات اليوم"
Add-Key "dashboard.noBookingsToday" "No bookings today" "لا توجد حجوزات اليوم"
Add-Key "dashboard.createBookingNow" "Create a Booking Now" "أنشئ حجزاً الآن"
Add-Key "dashboard.today" "Today" "اليوم"
Add-Key "dashboard.inventoryAlerts" "Inventory Alerts" "تنبيهات المخزون"
Add-Key "dashboard.inventoryGood" "Inventory is in good condition ✓" "المخزون بحالة جيدة ✓"
Add-Key "dashboard.moreProducts" "+{{count}} more product" "+{{count}} منتج آخر"
Add-Key "dashboard.quickSummary" "Quick Summary" "ملخص سريع"
Add-Key "dashboard.quickActions" "Quick Actions" "إجراءات سريعة"
Add-Key "dashboard.greeting" "{{greeting}}, {{name}}" "{{greeting}}، {{name}}"
Add-Key "dashboard.morning" "Good morning" "صباح الخير"
Add-Key "dashboard.afternoon" "Good afternoon" "مساء الخير"
Add-Key "dashboard.evening" "Good evening" "مساء النور"

# Process each file with Arabic
$processedFiles = @()
foreach ($filePath in $filesWithArabic) {
    $relPath = $filePath.Substring($projectRoot.Length + 1)
    $content = Get-Content $filePath -Raw
    $originalContent = $content
    
    # Determine if this is a 'use client' file
    $isClient = $content -match "'use client'"
    $isServer = -not $isClient
    $hasI18n = $content -match "useT|i18n"
    
    Write-Host "Processing: $relPath" -ForegroundColor Green
    
    # For .tsx client files without useT, add the import
    if ($isClient -and -not $hasI18n) {
        $content = $content -replace "'use client'(\r?\n)", "'use client'`$1import { useT } from '@/lib/i18n/language-provider'`$1"
        $hasI18n = $true
    }
    
    # For server components with Arabic, add server t import
    if ($isServer -and -not $hasI18n -and $content -match 'export (default |)function|export default async') {
        # Check if it has JSX with Arabic
        $content = $content -replace "^(import .+)$(\r?\n)(?=export|const)", "`$1`$2import { t } from '@/lib/i18n/server'`$2"
        $hasI18n = $true
    }
    
    # For client files, add const { t } = useT() in the component
    if ($isClient -and $hasI18n -and $content -notmatch "const \{ t \} = useT\(\)") {
        # Find the first function/component definition and add useT inside it
        if ($content -match "export function (\w+)") {
            $funcName = $matches[1]
            $pattern = "export function $funcName\(([^)]*)\)\s*\{"
            if ($content -match $pattern) {
                $fullMatch = $matches[0]
                $replacement = $fullMatch -replace '\{', '{' + "`r`n  const { t } = useT()"
                $content = $content -replace [regex]::Escape($fullMatch), $replacement
            }
        } elseif ($content -match "const (\w+).*=\s*\([^)]*\)\s*=>\s*\{") {
            $fullMatch = $matches[0]
            $replacement = $fullMatch -replace '\{', '{' + "`r`n  const { t } = useT()"
            $content = $content -replace [regex]::Escape($fullMatch), $replacement
        }
    }
    
    $processedFiles += @{Path=$relPath; Modified=$content -ne $originalContent}
    
    if ($content -ne $originalContent) {
        Set-Content -Path $filePath -Value $content -NoNewline
        Write-Host "  ✓ Updated" -ForegroundColor Green
    }
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Processed $($filesWithArabic.Count) files with Arabic strings" -ForegroundColor White
Write-Host "Need to add $($neededKeys.Count) new keys to locale files" -ForegroundColor White

Write-Host "`n=== Next Steps ===" -ForegroundColor Yellow
Write-Host "1. Need to add all new keys to en.ts and ar.ts" -ForegroundColor Yellow
Write-Host "2. Need to replace Arabic strings with t() calls in each file" -ForegroundColor Yellow
Write-Host "3. See 'new-keys-en.ts' for the English key definitions" -ForegroundColor Yellow
