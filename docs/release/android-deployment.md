# Ezy ERP — Android Release & Deployment Guide

## Overview

This document describes the production release pipeline for the Ezy ERP Android application. The pipeline supports three
environments (dev, staging, production) with automated versioning, signing, and CI/CD integration.

## Environments

| Environment | Release App ID        | Debug App ID                | App Name    | API URL                          | Signing     |
| ----------- | --------------------- | --------------------------- | ----------- | -------------------------------- | ----------- |
| Production  | `com.ezy.erp`         | `com.ezy.erp.debug`         | Ezy ERP     | `https://api.ezyerp.com`         | Release Key |
| Staging     | `com.ezy.erp.staging` | `com.ezy.erp.staging.debug` | Ezy Staging | `https://staging-api.ezyerp.com` | Staging Key |
| Dev         | `com.ezy.erp.dev`     | `com.ezy.erp.dev.debug`     | Ezy Dev     | `http://localhost:3000`          | Dev Key     |

## Prerequisites

### Required Tools

- Android Studio Hedgehog (2023.1.1+) or later
- JDK 17 (Android Studio bundled or Zulu distribution)
- Node.js 20+
- Android SDK 36 with build-tools 36.0.0+
- Gradle 9.4.1 (wrapped)

### Environment Variables

```bash
# Each flavor reads its own keystore from environment variables
# (via scripts/deploy/signing-config.gradle)

# Production
export EZY_PRODUCTION_KEYSTORE_PATH=/path/to/production.keystore
export EZY_PRODUCTION_KEYSTORE_PASSWORD=<password>
export EZY_PRODUCTION_KEY_ALIAS=production
export EZY_PRODUCTION_KEY_PASSWORD=<password>

# Staging
export EZY_STAGING_KEYSTORE_PATH=/path/to/staging.keystore
export EZY_STAGING_KEYSTORE_PASSWORD=<password>
export EZY_STAGING_KEY_ALIAS=staging
export EZY_STAGING_KEY_PASSWORD=<password>

# Dev
export EZY_DEV_KEYSTORE_PATH=/path/to/dev.keystore
export EZY_DEV_KEYSTORE_PASSWORD=android
export EZY_DEV_KEY_ALIAS=dev
export EZY_DEV_KEY_PASSWORD=android
```

## Build Commands

### Development Build

```bash
# Debug APK
cd android && ./gradlew assembleDevDebug

# Release APK (debug-signed)
cd android && ./gradlew assembleDevRelease
```

### Staging Build

```bash
# Debug
cd android && ./gradlew assembleStagingDebug

# Release (local keystore or pass properties)
cd android && ./gradlew assembleStagingRelease \
  -Pstaging.keystore=/path/to/staging.keystore \
  -Pstaging.keystore.password=<pass> \
  -Pstaging.key.alias=staging \
  -Pstaging.key.password=<pass>
```

### Production Build

```bash
# Full release APK
cd android && ./gradlew assembleProductionRelease \
  -Pproduction.keystore=/path/to/production.keystore \
  -Pproduction.keystore.password=<pass> \
  -Pproduction.key.alias=production \
  -Pproduction.key.password=<pass>

# Android App Bundle (for Play Store)
cd android && ./gradlew bundleProductionRelease \
  -Pproduction.keystore=/path/to/production.keystore \
  -Pproduction.keystore.password=<pass> \
  -Pproduction.key.alias=production \
  -Pproduction.key.password=<pass>
```

> **Note:** Unlike the old `-Pkeystore.path` syntax (which applied a single keystore to all release variants), each
> flavor now uses its own `-P{flavor}.keystore` property. This allows different signing keys per environment. Per-flavor
> signing configs are declared directly in each `productFlavor` block in `build.gradle`, eliminating the need for the
> deprecated `variantFilter` workaround removed in AGP 9.x.

### Using the Release Script

```bash
# Staging APK (uses default staging.keystore at android/staging.keystore)
./scripts/deploy/android-release.sh staging

# Staging AAB with custom keystore
./scripts/deploy/android-release.sh staging --aab --keystore /path/to/staging.keystore

# Production AAB with upload
./scripts/deploy/android-release.sh production --aab --keystore /path/to/production.keystore

# Dry run
./scripts/deploy/android-release.sh production --dry-run
```

The `--keystore` flag sets the per-flavor property (`-P{env}.keystore=...`) automatically.

## Versioning

### Semantic Versioning

The project follows [SemVer 2.0](https://semver.org/):

- **MAJOR**: Breaking API/UI changes
- **MINOR**: New features (backward-compatible)
- **PATCH**: Bug fixes

### Version File

Version is stored in `android/app/version.properties`:

```properties
versionCode=1
versionName=1.0.0
```

- `versionCode` — monotonically increasing integer
- `versionName` — SemVer string

### Git Tags

Production releases are tagged:

```bash
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3
```

## Signing

### Keystore Management

**Important:** Keystore files and passwords must never be committed to version control.

#### Generating a Keystore

```bash
keytool -genkey -v -keystore production.keystore \
  -alias production \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storetype PKCS12
```

#### Keystore Locations

| Environment | Location                      | Git |
| ----------- | ----------------------------- | --- |
| Debug       | `~/.android/debug.keystore`   | No  |
| Dev         | `android/dev.keystore`        | No  |
| Staging     | `android/staging.keystore`    | No  |
| Production  | `android/production.keystore` | No  |

### CI/CD Signing

Each environment uses its own keystore, passed via environment variables:

```bash
# CI decodes base64 keystore to the flavor-specific path
echo "$KEYSTORE_BASE64" | base64 -d > "${ENV}.keystore"
```

The `signing-config.gradle` script reads environment variables and sets Gradle project properties:

- `EZY_DEV_KEYSTORE_PATH` → `dev.keystore`
- `EZY_STAGING_KEYSTORE_PATH` → `staging.keystore`
- `EZY_PRODUCTION_KEYSTORE_PATH` → `production.keystore`

This is referenced automatically when `scripts/deploy/signing-config.gradle` exists. No `-Pkeystore.path` parameter is
needed in CI — just set the environment variables.

## CI/CD Pipeline

### GitHub Actions

The pipeline is defined in `.github/workflows/android-release.yml`:

1. **Validate**: Parse version, validate tag, check changelog
2. **Test**: TypeScript type-check, lint, unit tests
3. **Build**: Capacitor sync, Gradle build (APK or AAB), signing
4. **Release**: Upload artifacts, create GitHub Release draft
5. **Notify**: Send success/failure notifications

#### Triggering CI

- **Automatic**: Pushing a tag `v*.*.*` triggers production release
- **Manual**: `workflow_dispatch` with environment selection

## Release Checklist

### Pre-Release

- [ ] All PRs merged to `main`
- [ ] Version bumped in `android/app/version.properties`
- [ ] CHANGELOG updated
- [ ] Git tag created (`v1.2.3`)
- [ ] CI pipeline passing on `main`
- [ ] Smoke tests passed on staging
- [ ] Performance benchmarks reviewed
- [ ] Security audit passed

### Build

- [ ] Run `npm run check:all`
- [ ] Run `npx cap sync android`
- [ ] Build AAB: `./gradlew bundleProductionRelease`
- [ ] Build APK: `./gradlew assembleProductionRelease`
- [ ] Verify APK/AAB signs correctly
- [ ] Verify `jarsigner -verify` passes

### Post-Build

- [ ] SHA-256 checksums generated
- [ ] Release metadata JSON created
- [ ] Artifacts uploaded to secure storage
- [ ] GitHub Release draft created
- [ ] Internal testers notified

### Play Store Upload

- [ ] Upload AAB to Play Console
- [ ] Internal track: deploy to testers
- [ ] Closed track: deploy to beta group
- [ ] Production track: staged rollout (25%, 50%, 100%)
- [ ] Store listing updated (screenshots, description, changelog)

### Post-Release

- [ ] Monitoring dashboards verified
- [ ] Crash analytics baseline confirmed
- [ ] Sync health metrics nominal
- [ ] Push notification delivery confirmed
- [ ] Rollback plan documented

## ProGuard / R8

### Configuration

Rules in `android/app/proguard-rules.pro` cover:

- Capacitor bridge and plugins
- Firebase/ML Kit/GMS libraries
- Biometric auth
- AndroidX Security
- WebView JavaScript interface
- Gson serialization
- OkHttp

### Optimization

```properties
-optimizationpasses 5
-optimizations !class/merging/vertical*, !class/merging/horizontal*
-repackageclasses 'com.ezy.erp.core'
```

## Network Security

### Production

- Cleartext disallowed
- Certificate pinning with SHA-256 hashes
- System trust store only
- Domain-restricted access

### Staging/Dev

- Cleartext allowed for localhost and LAN
- User certificate store enabled

## App Security

### Native Layer

- ErpApplication: runtime app signature verification, StrictMode, notification channels, FLAG_SECURE
- SecurityGuard: root detection, debugger detection, emulator detection, tamper checks
- SecureFlagLifecycleHandler: FLAG_SECURE on all activities

### JavaScript Layer

- AntiDebugService: devtools detection, debugger timing checks, console hooking
- TamperDetectionService: global overwrite detection, localStorage integrity, SW integrity, iframe injection
- ScreenshotProtectionService: visibility change, clipboard clearing, print suppression
- DeviceTrustService: root, emulator, debug mode, screen lock, mock location

## Observability

### Crash Analytics

- Global error/rejection handlers
- Breadcrumb trail (last 50 events)
- Sentry integration (optional, DSN from env)

### Performance

- Startup phases tracked (launch → services → render → API ready)
- LCP and paint metrics via PerformanceObserver
- Telemetry with configurable sample rate

### Sync Health

- Per-sync tracking (duration, status, item count)
- Health score based on success rate and pending items
- Periodic telemetry flush

### Push Delivery

- Full funnel: received → displayed → tapped → dismissed
- Delivery delay tracking
- Category-based aggregation

## Rollback Strategy

### Version Rollback

If a release causes issues:

1. Identify the last stable version from `releases/` directory
2. Deploy previous AAB to Play Console
3. If using staged rollout, reduce to 0% immediately
4. Notify users via push notification

### Feature Flag Rollback

Critical features are behind remote-config feature flags:

```typescript
featureFlagService.isEnabled('offline_mode')
```

Toggle off remotely without app update.

## Disaster Recovery

### Keystore Loss

If the keystore is lost:

1. Generate new keystore
2. Contact Google Play Support for key replacement
3. Existing installs will NOT receive updates (different signature)
4. Users must reinstall — significant disruption

**Mitigation**: Store keystore in:

- Hardware security module (HSM)
- Encrypted cloud backup
- Company safe (physical)

## Appendices

### A. Useful Commands

```bash
# Check APK signature
jarsigner -verify -verbose -certs app-release.apk

# Check AAB signature
jarsigner -verify -verbose -certs app-release.aab

# Get certificate fingerprint
keytool -list -v -keystore production.keystore -alias production

# Decode AAB for inspection
unzip app-release.aab -d app-release/

# Build with specific JAVA_HOME
JAVA_HOME=/path/to/jdk ./gradlew assembleProductionRelease
```

### B. File Reference

| File                                                   | Purpose                                       |
| ------------------------------------------------------ | --------------------------------------------- |
| `android/app/build.gradle`                             | Build config, flavors, signing, output naming |
| `android/app/proguard-rules.pro`                       | ProGuard/R8 optimization rules                |
| `android/app/version.properties`                       | Version code and name                         |
| `android/app/src/main/AndroidManifest.xml`             | App manifest with deep links, permissions     |
| `android/app/src/main/ErpApplication.java`             | Application-level initialization              |
| `android/app/src/main/SecurityGuard.java`              | Native security checks                        |
| `android/app/src/main/SecureFlagLifecycleHandler.java` | Screenshot protection                         |
| `src/lib/mobile/production/environments.ts`            | Environment configuration                     |
| `src/lib/mobile/production/version.ts`                 | Version management                            |
| `src/lib/mobile/production/build-info.ts`              | Build info service                            |
| `src/lib/mobile/production/secrets.ts`                 | API secret isolation                          |
| `.github/workflows/android-release.yml`                | CI/CD pipeline                                |
| `scripts/deploy/android-release.sh`                    | Release automation script                     |
| `scripts/deploy/signing-config.gradle`                 | Environment-variable signing config loader    |
| `docs/release/android-deployment.md`                   | This document                                 |

### C. Environment Config Quick Reference

| Config          | Production     | Staging                | Dev            |
| --------------- | -------------- | ---------------------- | -------------- |
| API URL         | api.ezyerp.com | staging-api.ezyerp.com | localhost:3000 |
| Crash Reporting | Yes            | No                     | No             |
| Telemetry       | Yes (10%)      | Yes (100%)             | No             |
| Logging         | No             | Yes                    | Yes            |
| Strict Mode     | No             | No                     | Yes            |
| Cert Pinning    | Yes            | Yes                    | No             |
| App Links Host  | app.ezyerp.com | staging.app.ezyerp.com | localhost      |
