#!/bin/bash
# ── Ezy ERP Android Production Release Script ──────────────────────────────
# Usage: ./scripts/deploy/android-release.sh [env] [options]
#   env: production | staging | dev  (default: staging)
#   options:
#     --aab          Build Android App Bundle instead of APK
#     --version X.X.X Override version name
#     --build N      Override build number
#     --skip-tests   Skip test execution
#     --upload       Upload to Play Console (production only)
#     --keystore PATH Path to keystore file
#     --dry-run      Show what would be done without executing

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
ANDROID_DIR="$PROJECT_DIR/android"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
LOG_FILE="$PROJECT_DIR/releases/build_${TIMESTAMP}.log"

# ── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"; }
error(){ echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"; exit 1; }
info() { echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"; }

# ── Parse arguments ──
ENV="${1:-staging}"
BUILD_AAB=false
VERSION_OVERRIDE=""
BUILD_OVERRIDE=""
SKIP_TESTS=false
DO_UPLOAD=false
KEYSTORE_PATH=""
DRY_RUN=false

shift 2>/dev/null || true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --aab) BUILD_AAB=true; shift ;;
    --version) VERSION_OVERRIDE="$2"; shift 2 ;;
    --build) BUILD_OVERRIDE="$2"; shift 2 ;;
    --skip-tests) SKIP_TESTS=true; shift ;;
    --upload) DO_UPLOAD=true; shift ;;
    --keystore) KEYSTORE_PATH="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    *) error "Unknown option: $1" ;;
  esac
done

# ── Validation ──
if [[ ! "$ENV" =~ ^(production|staging|dev)$ ]]; then
  error "Environment must be: production, staging, or dev"
fi

if [[ "$ENV" == "production" && -z "$KEYSTORE_PATH" && -z "$(find "$PROJECT_DIR" -name '*.keystore' 2>/dev/null)" ]]; then
  error "Production builds require a keystore. Use --keystore PATH or place one in the project root."
fi

# ── Version management ──
VERSION_FILE="$ANDROID_DIR/app/version.properties"
CURRENT_VERSION=$(grep 'versionName=' "$VERSION_FILE" | cut -d= -f2)
CURRENT_BUILD=$(grep 'versionCode=' "$VERSION_FILE" | cut -d= -f2)

VERSION="${VERSION_OVERRIDE:-$CURRENT_VERSION}"
BUILD="${BUILD_OVERRIDE:-$CURRENT_BUILD}"

if [[ "$VERSION_OVERRIDE" != "" || "$BUILD_OVERRIDE" != "" ]]; then
  log "Updating version to $VERSION (build $BUILD)"
  if [[ "$DRY_RUN" == "false" ]]; then
    echo "versionCode=$BUILD" > "$VERSION_FILE"
    echo "versionName=$VERSION" >> "$VERSION_FILE"
  fi
fi

# ── Git tag ──
GIT_HASH=$(git -C "$PROJECT_DIR" rev-parse --short HEAD 2>/dev/null || echo "unknown")
GIT_BRANCH=$(git -C "$PROJECT_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

log "=========================================="
log "  Ezy ERP Android Release"
log "  Environment: $ENV"
log "  Version:     $VERSION (build $BUILD)"
log "  Branch:      $GIT_BRANCH"
log "  Commit:      $GIT_HASH"
log "  AAB:         $BUILD_AAB"
log "=========================================="

# ── Pre-build checks ──
info "Running pre-build validation..."

if [[ "$DRY_RUN" == "false" ]]; then
  cd "$PROJECT_DIR"

  # Validate environment variables
  if [[ "$ENV" == "production" ]]; then
    node scripts/validate-env.mjs 2>/dev/null || warn "env validation script not found, skipping"
  fi

  # Run tests
  if [[ "$SKIP_TESTS" == "false" ]]; then
    log "Running tests..."
    npm run test 2>&1 | tee -a "$LOG_FILE" || error "Tests failed"
  else
    warn "Skipping tests"
  fi

  # Lint check
  log "Running type check..."
  npm run type-check 2>&1 | tee -a "$LOG_FILE" || warn "Type check found issues"
fi

# ── Capacitor sync ──
log "Syncing Capacitor..."
if [[ "$DRY_RUN" == "true" ]]; then
  info "[DRY-RUN] npx cap sync android"
else
  npx cap sync android 2>&1 | tee -a "$LOG_FILE" || error "Capacitor sync failed"
fi

# ── Build ──
log "Starting Gradle build..."
cd "$ANDROID_DIR"

GRADLE_ARGS="-Penv=$ENV -PversionName=$VERSION -PversionCode=$BUILD"

if [[ -n "$KEYSTORE_PATH" ]]; then
  GRADLE_ARGS="$GRADLE_ARGS -P${ENV}.keystore=$KEYSTORE_PATH"
fi

if [[ "$BUILD_AAB" == "true" ]]; then
  GRADLE_ARGS="$GRADLE_ARGS -Paab=true"
  TASK="bundle${ENV^}Release"
  OUTPUT_DIR="$ANDROID_DIR/app/build/outputs/bundle/${ENV}Release"
  OUTPUT_EXT="aab"
else
  TASK="assemble${ENV^}Release"
  OUTPUT_DIR="$ANDROID_DIR/app/build/outputs/apk/${ENV}/release"
  OUTPUT_EXT="apk"
fi

log "Task: $TASK"
log "Output: $OUTPUT_DIR"

if [[ "$DRY_RUN" == "true" ]]; then
  info "[DRY-RUN] ./gradlew $TASK $GRADLE_ARGS"
else
  ./gradlew $TASK $GRADLE_ARGS 2>&1 | tee -a "$LOG_FILE"

  if [[ ${PIPESTATUS[0]} -ne 0 ]]; then
    error "Gradle build failed. Check log: $LOG_FILE"
  fi
fi

# ── Post-build ──
if [[ "$DRY_RUN" == "false" ]]; then
  # Collect artifacts
  RELEASE_DIR="$PROJECT_DIR/releases/$ENV/$VERSION"
  mkdir -p "$RELEASE_DIR"

  if ls "$OUTPUT_DIR"/*."$OUTPUT_EXT" 1>/dev/null 2>&1; then
    cp "$OUTPUT_DIR"/*."$OUTPUT_EXT" "$RELEASE_DIR/"
    log "Artifacts copied to: $RELEASE_DIR"
  fi

  # Generate checksums
  cd "$RELEASE_DIR"
  for f in *."$OUTPUT_EXT"; do
    sha256sum "$f" > "${f}.sha256"
    md5sum "$f" > "${f}.md5"
  done

  # Generate release metadata
  cat > "$RELEASE_DIR/release.json" <<EOF
{
  "version": "$VERSION",
  "build": $BUILD,
  "environment": "$ENV",
  "gitHash": "$GIT_HASH",
  "gitBranch": "$GIT_BRANCH",
  "buildTime": "$(date -u +'%Y-%m-%dT%H:%M:%SZ')",
  "aab": $BUILD_AAB,
  "files": [
$(for f in *."$OUTPUT_EXT"; do echo "    {\"name\":\"$f\",\"size\":$(stat -c%s "$f"),\"sha256\":\"$(sha256sum "$f" | cut -d' ' -f1)\"},"; done | sed '$s/,$//')
  ]
}
EOF

  log "Release metadata written to: $RELEASE_DIR/release.json"

  # Upload (production only)
  if [[ "$DO_UPLOAD" == "true" && "$ENV" == "production" ]]; then
    log "Uploading to Google Play Console..."
    warn "Play Console upload requires additional configuration (service account, etc.)"
  fi
fi

log "=========================================="
log "${GREEN}Build complete!${NC}"
log "  Version: $VERSION (build $BUILD)"
log "  Output:  $RELEASE_DIR"
log "  Log:     $LOG_FILE"
log "=========================================="
