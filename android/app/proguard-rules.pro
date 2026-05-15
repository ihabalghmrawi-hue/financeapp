# ── Ezy ERP Production ProGuard/R8 Rules ──────────────────────────────────

# Keep Capacitor bridge
-keep class com.getcapacitor.** { *; }
-keep class com.ezy.erp.** { *; }
-keepattributes *Annotation*
-keepattributes JavascriptInterface
-keepattributes SourceFile,LineNumberTable

# Keep Capacitor plugins
-keep class com.getcapacitor.plugin.** { *; }
-keep class com.getcapacitor.community.** { *; }
-keep class com.capacitorjs.** { *; }

# Keep ML Kit barcode scanning
-keep class com.google.mlkit.** { *; }
-dontwarn com.google.mlkit.**

# Keep Firebase messaging
-keep class com.google.firebase.messaging.** { *; }
-dontwarn com.google.firebase.messaging.**

# Keep GMS tasks
-keep class com.google.android.gms.tasks.** { *; }
-keep class com.google.android.gms.integrity.** { *; }

# Keep Biometric auth
-keep class io.jxcore.node.** { *; }
-keep class capacitorNativeBiometric.** { *; }

# Keep AndroidX security crypto
-keep class androidx.security.crypto.** { *; }

# Keep WebView JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep serializable objects
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    !static !transient <fields>;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Keep enum classes
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Remove debug logging in release
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
    public static int i(...);
}

# Keep R8 optimizations for release
-optimizationpasses 5
-optimizations !class/merging/vertical*, !class/merging/horizontal*
-allowaccessmodification
-mergeinterfacesaggressively
-overloadaggressively
-repackageclasses 'com.ezy.erp.core'
-flattenpackagehierarchy 'com.ezy.erp.core'
-dontpreverify

# Keep Gson type adapters
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# Keep OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
