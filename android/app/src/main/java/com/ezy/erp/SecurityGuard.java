package com.ezy.erp;

import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.os.Build;
import android.os.Debug;
import android.util.Log;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.TimeUnit;

public class SecurityGuard {
    private static final String TAG = "SecurityGuard";
    private static SecurityGuard instance;

    private static final Set<String> ROOT_BINARIES = new HashSet<>(Arrays.asList(
        "/su", "/su/bin/su", "/system/bin/su", "/system/xbin/su",
        "/system/sd/xbin/su", "/data/local/xbin/su", "/data/local/bin/su",
        "/system/bin/.ext/su", "/sbin/su"
    ));

    private static final Set<String> ROOT_PACKAGES = new HashSet<>(Arrays.asList(
        "com.noshufou.android.su", "com.thirdparty.superuser",
        "eu.chainfire.supersu", "com.koushikdutta.superuser",
        "com.topjohnwu.magisk", "com.anggrayudi.android.magisk",
        "com.stickshift.helper", "com.kingoapp.rootgenius",
        "com.kingo.root", "com.king.user", "com.kingroot.RootMaster",
        "com.kingroot.kinguser", "com.kingoroot.rootgenius",
        "com.superuser.kinguser", "com.sview.superuser"
    ));

    private static final Set<String> EMULATOR_FILES = new HashSet<>(Arrays.asList(
        "/system/bin/genymotion", "/system/lib/libdvm.so",
        "/system/lib/libhoudini.so", "/system/lib/libnox.so"
    ));

    private static final String[] EMULATOR_PROPS = {
        "ro.kernel.qemu", "ro.product.cpu.abi2", "ro.build.fingerprint"
    };

    private static final String[] EMULATOR_PROP_VALUES = {
        "generic", "sdk", "google_sdk", "Android SDK built for x86",
        "android-sdk", "Android Studio", "genymotion", "nox"
    };

    private final Context context;
    private boolean initialized = false;
    private SecurityState currentState;

    public static class SecurityState {
        public final boolean rootDetected;
        public final boolean debuggerAttached;
        public final boolean emulatorDetected;
        public final boolean tamperDetected;
        public final boolean signatureValid;
        public final boolean developerOptionsEnabled;
        public final int score;
        public final boolean trusted;
        public final String[] warnings;

        SecurityState(boolean rootDetected, boolean debuggerAttached, boolean emulatorDetected,
                      boolean tamperDetected, boolean signatureValid,
                      boolean developerOptionsEnabled, String[] warnings) {
            this.rootDetected = rootDetected;
            this.debuggerAttached = debuggerAttached;
            this.emulatorDetected = emulatorDetected;
            this.tamperDetected = tamperDetected;
            this.signatureValid = signatureValid;
            this.developerOptionsEnabled = developerOptionsEnabled;

            int score = 100;
            if (rootDetected) score -= 30;
            if (debuggerAttached) score -= 25;
            if (emulatorDetected) score -= 20;
            if (tamperDetected) score -= 15;
            if (!signatureValid) score -= 10;
            if (developerOptionsEnabled) score -= 5;
            this.score = Math.max(0, score);

            this.trusted = !rootDetected && !tamperDetected && score >= 60;
            this.warnings = warnings != null ? warnings : new String[0];
        }
    }

    public static SecurityGuard getInstance(Context context) {
        if (instance == null) {
            instance = new SecurityGuard(context.getApplicationContext());
        }
        return instance;
    }

    private SecurityGuard(Context context) {
        this.context = context;
    }

    public SecurityState assessSecurity() {
        if (initialized) return currentState;

        try {
            boolean rootDetected = checkRoot();
            boolean debuggerAttached = checkDebugger();
            boolean emulatorDetected = checkEmulator();
            boolean tamperDetected = checkTamper();
            boolean signatureValid = checkSignature();
            boolean developerOptionsEnabled = checkDeveloperOptions();

            java.util.List<String> warnings = new java.util.ArrayList<>();
            if (rootDetected) warnings.add("جهاز مخترق (روت)");
            if (debuggerAttached) warnings.add("مصحح متصل");
            if (emulatorDetected) warnings.add("بيئة محاكاة");
            if (tamperDetected) warnings.add("تم العبث بالتطبيق");
            if (!signatureValid) warnings.add("توقيع التطبيق غير صالح");
            if (developerOptionsEnabled) warnings.add("خيارات المطور مفعلة");

            currentState = new SecurityState(
                rootDetected, debuggerAttached, emulatorDetected,
                tamperDetected, signatureValid, developerOptionsEnabled,
                warnings.toArray(new String[0])
            );
        } catch (Exception e) {
            Log.e(TAG, "Security assessment crashed", e);
            currentState = new SecurityState(false, false, false, false, true, false, new String[]{
                "فشل تقييم الأمان: " + e.getMessage()
            });
        }

        initialized = true;
        return currentState;
    }

    public boolean isDebuggerAttached() {
        return Debug.isDebuggerConnected() || Debug.waitingForDebugger();
    }

    private boolean checkRoot() {
        for (String path : ROOT_BINARIES) {
            if (new File(path).exists()) return true;
        }

        try {
            Process process = Runtime.getRuntime().exec(new String[]{"/system/xbin/which", "su"});
            if (process.waitFor(2, TimeUnit.SECONDS)) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
                if (reader.readLine() != null) return true;
            }
            process.destroy();
        } catch (Exception ignored) {}

        try {
            Process process = Runtime.getRuntime().exec("su -c id");
            if (process.waitFor(2, TimeUnit.SECONDS)) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
                String line = reader.readLine();
                if (line != null && line.contains("uid=0")) return true;
            }
            process.destroy();
        } catch (Exception ignored) {}

        PackageManager pm = context.getPackageManager();
        for (String pkg : ROOT_PACKAGES) {
            try {
                pm.getPackageInfo(pkg, 0);
                return true;
            } catch (PackageManager.NameNotFoundException ignored) {}
        }

        return false;
    }

    private boolean checkDebugger() {
        return Debug.isDebuggerConnected() || Debug.waitingForDebugger();
    }

    private boolean checkEmulator() {
        if (Build.FINGERPRINT != null) {
            if (Build.FINGERPRINT.contains("generic") ||
                Build.FINGERPRINT.contains("emulator") ||
                Build.FINGERPRINT.contains("sdk")) return true;
        }

        if (Build.MODEL != null) {
            if (Build.MODEL.contains("Emulator") ||
                Build.MODEL.contains("Android SDK") ||
                Build.MODEL.contains("Genymotion")) return true;
        }

        if (Build.MANUFACTURER != null) {
            if (Build.MANUFACTURER.contains("Genymotion") ||
                Build.MANUFACTURER.contains("unknown")) return true;
        }

        if (Build.BRAND != null && Build.BRAND.startsWith("generic")) return true;
        if (Build.DEVICE != null && Build.DEVICE.startsWith("generic")) return true;
        if (Build.PRODUCT != null && (Build.PRODUCT.contains("sdk") ||
            Build.PRODUCT.contains("emulator"))) return true;
        if (Build.HARDWARE != null && (Build.HARDWARE.contains("goldfish") ||
            Build.HARDWARE.contains("ranchu") ||
            Build.HARDWARE.contains("vbox"))) return true;

        String radioVersion = "";
        try {
            radioVersion = Build.getRadioVersion();
        } catch (Exception ignored) {}
        if (radioVersion == null || radioVersion.isEmpty()) return true;

        for (String path : EMULATOR_FILES) {
            if (new File(path).exists()) return true;
        }

            try {
                Class<?> devicePolicyManager = Class.forName("android.app.admin.DevicePolicyManager");
                if (devicePolicyManager != null) {
                    for (String method : Arrays.asList("getDeviceOwner", "isDeviceOwnerApp")) {
                    boolean found = false;
                    for (java.lang.reflect.Method m : devicePolicyManager.getMethods()) {
                        if (m.getName().equals(method)) found = true;
                    }
                    if (!found) return true;
                }
            }
        } catch (Exception ignored) {}

        return false;
    }

    private boolean checkTamper() {
        try {
            PackageManager pm = context.getPackageManager();
            String pkg = context.getPackageName();
            Signature sig;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                PackageInfo info = pm.getPackageInfo(pkg, PackageManager.GET_SIGNING_CERTIFICATES);
                sig = info.signingInfo.getApkContentsSigners()[0];
            } else {
                PackageInfo info = pm.getPackageInfo(pkg, PackageManager.GET_SIGNATURES);
                sig = info.signatures[0];
            }
            String sigStr = sig.toCharsString();
            return sigStr == null || sigStr.isEmpty();
        } catch (Exception e) {
            return true;
        }
    }

    private boolean checkSignature() {
        try {
            PackageManager pm = context.getPackageManager();
            String pkg = context.getPackageName();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                pm.getPackageInfo(pkg, PackageManager.GET_SIGNING_CERTIFICATES);
            } else {
                pm.getPackageInfo(pkg, PackageManager.GET_SIGNATURES);
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private boolean checkDeveloperOptions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {
            try {
                int devMode = android.provider.Settings.Secure.getInt(
                    context.getContentResolver(),
                    android.provider.Settings.Secure.DEVELOPMENT_SETTINGS_ENABLED,
                    0
                );
                return devMode == 1;
            } catch (Exception ignored) {}
        }
        return false;
    }
}
