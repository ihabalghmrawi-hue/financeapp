package com.ezy.erp;

import android.app.Activity;
import android.app.Application;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;

public class SecureFlagLifecycleHandler implements Application.ActivityLifecycleCallbacks {
    @Override
    public void onActivityCreated(Activity activity, Bundle savedInstanceState) {
        setSecureFlag(activity);
    }

    @Override
    public void onActivityStarted(Activity activity) {
        setSecureFlag(activity);
    }

    @Override
    public void onActivityResumed(Activity activity) {
        setSecureFlag(activity);
    }

    @Override
    public void onActivityPaused(Activity activity) {}

    @Override
    public void onActivityStopped(Activity activity) {}

    @Override
    public void onActivitySaveInstanceState(Activity activity, Bundle outState) {}

    @Override
    public void onActivityDestroyed(Activity activity) {}

    private void setSecureFlag(Activity activity) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            try {
                if (!BuildConfig.DEBUG && "production".equals(BuildConfig.BUILD_ENVIRONMENT)) {
                    activity.getWindow().setFlags(
                        WindowManager.LayoutParams.FLAG_SECURE,
                        WindowManager.LayoutParams.FLAG_SECURE
                    );
                }
            } catch (Exception ignored) {}
        }
    }
}
