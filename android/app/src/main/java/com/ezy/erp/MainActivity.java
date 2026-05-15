package com.ezy.erp;

import android.os.Bundle;
import android.util.Log;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        try {
            super.onCreate(savedInstanceState);

            SecurityGuard guard = SecurityGuard.getInstance(getApplicationContext());
            SecurityGuard.SecurityState state = guard.assessSecurity();

            if (!state.trusted) {
                Log.w(TAG, "Security assessment failed: score=" + state.score);
                for (String warning : state.warnings) {
                    Log.w(TAG, "Security warning: " + warning);
                }
            }
        } catch (Throwable t) {
            Log.e(TAG, "Error during initialization", t);
        }

        try {
            if ("production".equals(BuildConfig.BUILD_ENVIRONMENT)) {
                getWindow().setFlags(
                    WindowManager.LayoutParams.FLAG_SECURE,
                    WindowManager.LayoutParams.FLAG_SECURE
                );
            }
        } catch (Throwable t) {
            Log.e(TAG, "Error setting FLAG_SECURE", t);
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        SecurityGuard guard = SecurityGuard.getInstance(getApplicationContext());
        if (guard.isDebuggerAttached()) {
            Log.e(TAG, "Debugger detected during onResume");
        }
    }
}
