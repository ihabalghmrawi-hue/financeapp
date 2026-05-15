package com.ezy.erp;

import android.app.Application;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.os.Build;
import android.os.StrictMode;
import android.util.Log;

import java.security.MessageDigest;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

public class ErpApplication extends Application {
    private static final String TAG = "ErpApplication";
    private static final Set<String> EXPECTED_SIGNATURES = new HashSet<>(Arrays.asList(
        "SHA256:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
    ));

    private static ErpApplication instance;

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;

        Thread.UncaughtExceptionHandler defaultHandler = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler((thread, throwable) -> {
            Log.e(TAG, "Uncaught exception on: " + thread.getName(), throwable);
            if (defaultHandler != null) {
                defaultHandler.uncaughtException(thread, throwable);
            }
        });

        if (isProductionBuild()) {
            enableStrictMode();
            verifyAppSignature();
            createNotificationChannels();
            enableScreenshotProtection();
        }
    }

    public static ErpApplication getInstance() {
        return instance;
    }

    private boolean isProductionBuild() {
        return !BuildConfig.DEBUG && "production".equals(BuildConfig.BUILD_ENVIRONMENT);
    }

    private void enableStrictMode() {
        StrictMode.setThreadPolicy(new StrictMode.ThreadPolicy.Builder()
            .detectAll()
            .penaltyLog()
            .penaltyDeath()
            .build());
        StrictMode.setVmPolicy(new StrictMode.VmPolicy.Builder()
            .detectAll()
            .penaltyLog()
            .build());
    }

    private void verifyAppSignature() {
        try {
            PackageManager pm = getPackageManager();
            String packageName = getPackageName();
            Signature[] signatures;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                PackageInfo info = pm.getPackageInfo(packageName, PackageManager.GET_SIGNING_CERTIFICATES);
                signatures = info.signingInfo.getApkContentsSigners();
            } else {
                PackageInfo info = pm.getPackageInfo(packageName, PackageManager.GET_SIGNATURES);
                signatures = info.signatures;
            }
            if (signatures == null) return;
            for (Signature sig : signatures) {
                MessageDigest md = MessageDigest.getInstance("SHA-256");
                byte[] digest = md.digest(sig.toByteArray());
                StringBuilder sb = new StringBuilder();
                for (byte b : digest) {
                    sb.append(String.format("%02X", b));
                }
                String hash = "SHA256:" + sb.toString();
                if (!EXPECTED_SIGNATURES.contains(hash)) {
                    Log.w(TAG, "App signature mismatch: " + hash);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Signature verification failed", e);
        }
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = getSystemService(NotificationManager.class);

        NotificationChannel general = new NotificationChannel(
            "general", "عام",
            NotificationManager.IMPORTANCE_DEFAULT
        );
        general.setDescription("الإشعارات العامة");
        general.setShowBadge(true);
        nm.createNotificationChannel(general);

        NotificationChannel transactions = new NotificationChannel(
            "transactions", "المعاملات",
            NotificationManager.IMPORTANCE_HIGH
        );
        transactions.setDescription("إشعارات المعاملات المالية");
        transactions.setShowBadge(true);
        transactions.enableVibration(true);
        nm.createNotificationChannel(transactions);

        NotificationChannel approvals = new NotificationChannel(
            "approvals", "الموافقات",
            NotificationManager.IMPORTANCE_HIGH
        );
        approvals.setDescription("طلبات الموافقة");
        approvals.setShowBadge(true);
        approvals.enableVibration(true);
        nm.createNotificationChannel(approvals);

        NotificationChannel alerts = new NotificationChannel(
            "alerts", "تنبيهات",
            NotificationManager.IMPORTANCE_HIGH
        );
        alerts.setDescription("تنبيهات النظام");
        alerts.setShowBadge(true);

        NotificationChannel sync = new NotificationChannel(
            "sync", "المزامنة",
            NotificationManager.IMPORTANCE_LOW
        );
        sync.setDescription("حالة المزامنة");
        sync.setShowBadge(false);

        NotificationChannel updates = new NotificationChannel(
            "updates", "التحديثات",
            NotificationManager.IMPORTANCE_DEFAULT
        );
        updates.setDescription("تحديثات التطبيق");
        updates.setShowBadge(false);
        nm.createNotificationChannel(updates);

        NotificationChannel silent = new NotificationChannel(
            "silent", "صامت",
            NotificationManager.IMPORTANCE_MIN
        );
        silent.setDescription("إشعارات صامتة");
        silent.setShowBadge(false);
        nm.createNotificationChannel(silent);
    }

    private void enableScreenshotProtection() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            registerActivityLifecycleCallbacks(new SecureFlagLifecycleHandler());
        }
    }
}
