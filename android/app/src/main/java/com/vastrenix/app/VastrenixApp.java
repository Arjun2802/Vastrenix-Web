package com.vastrenix.app;

import android.app.Application;
import android.content.pm.ApplicationInfo;
import android.webkit.WebView;

public class VastrenixApp extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        // Remote WebView debugging only in debuggable (debug) builds.
        WebView.setWebContentsDebuggingEnabled((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0);
    }
}
