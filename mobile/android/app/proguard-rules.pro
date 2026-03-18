# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.capitune.mobile.** { *; }
-keep class expo.modules.** { *; }
-dontwarn expo.modules.**

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep JS engine
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Keep React Native components
-keep class androidx.appcompat.** { *; }
-keep class androidx.core.** { *; }

# Keep Expo modules
-keep class expo.modules.** { *; }
-keep class org.unimodules.** { *; }

# Keep networking
-keepattributes *;
-keepnames !*

# Keep UI components
-keep class android.support.v7.** { *; }
-keep class androidx.appcompat.** { *; }
-keep class com.google.android.material.** { *; }

# Keep video/audio components
-keep class expo.av.** { *; }
-keep class androidx.media.** { *; }

# Optimization: Remove unused classes
-assumenosideeffects class !android.support.**
-assumenosideeffects class !androidx.**

# Keep all enum classes
-keepclassmembers enum * {
    public static **[] values();
    public static ** value;
}

# Keep serializable classes
-keepnames class * implements java.io.Serializable
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Class;
}

# Keep parcelable classes
-keep class * implements android.os.Parcelable {
    public static final ** CREATOR;
    public ** CREATOR;
    public void writeToParcel(android.os.Parcel);
    public void readFromParcel(android.os.Parcel);
}

# Keep View constructors
-keepclassmembers class * extends android.view.View {
    public <init>(android.content.Context);
    public <init>(android.content.Context, android.util.AttributeSet);
    public <init>(android.content.Context, android.util.AttributeSet, int);
}

# Keep React Native bridge
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Add any project specific keep options here:
