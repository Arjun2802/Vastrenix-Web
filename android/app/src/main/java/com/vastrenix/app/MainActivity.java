package com.vastrenix.app;

import android.annotation.SuppressLint;
import android.content.ActivityNotFoundException;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;
import android.view.ViewGroup;
import android.webkit.PermissionRequest;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import androidx.activity.ComponentActivity;
import androidx.activity.EdgeToEdge;
import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.FileProvider;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Pattern;

/**
 * Hosts the Vastrenix web app.
 *
 * Security model
 *  - The bundled app is served from https://appassets.androidplatform.net via WebViewAssetLoader, so it runs on a
 *    real https origin. file:// access, content:// access and universal file access are all disabled.
 *  - The native bridge is a WebMessageListener that only accepts messages from that origin and only from the main
 *    frame. It can save/share a file the app generated, open an allow-listed external link, and tint system bars.
 *    It cannot make network requests or read files.
 *  - Any navigation away from the app origin is handed to another app (browser, WhatsApp, UPI app) — never loaded
 *    inside this WebView.
 */
public class MainActivity extends ComponentActivity {
    private static final String TAG = "Vastrenix";
    static final String APP_HOST = "appassets.androidplatform.net";
    static final String APP_ORIGIN = "https://" + APP_HOST;
    private static final String START_URL = APP_ORIGIN + "/assets/web/index.html";
    private static final int MAX_FILE_BYTES = 25 * 1024 * 1024;
    private static final Pattern SAFE_NAME = Pattern.compile("[^A-Za-z0-9._-]");

    private FrameLayout root;
    private WebView webView;
    private WebViewAssetLoader assetLoader;
    private ValueCallback<Uri[]> fileCallback;
    private Uri pendingCameraUri;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final ExecutorService io = Executors.newSingleThreadExecutor();

    private final ActivityResultLauncher<Intent> pickFile = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(), result -> {
                Uri[] uris = null;
                if (result.getResultCode() == RESULT_OK) {
                    Intent data = result.getData();
                    uris = WebChromeClient.FileChooserParams.parseResult(result.getResultCode(), data);
                    if ((uris == null || uris.length == 0) && pendingCameraUri != null && cameraFileHasContent()) {
                        uris = new Uri[]{pendingCameraUri};
                    }
                }
                if (fileCallback != null) fileCallback.onReceiveValue(uris);
                fileCallback = null;
                pendingCameraUri = null;
            });

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);

        root = new FrameLayout(this);
        root.setBackgroundColor(getColor(R.color.window_bg));
        setContentView(root);
        // Keep the web content inside the safe area (status bar, navigation bar, cutout and keyboard).
        ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
            Insets i = insets.getInsets(WindowInsetsCompat.Type.systemBars()
                    | WindowInsetsCompat.Type.displayCutout() | WindowInsetsCompat.Type.ime());
            v.setPadding(i.left, i.top, i.right, i.bottom);
            return WindowInsetsCompat.CONSUMED;
        });

        assetLoader = new WebViewAssetLoader.Builder()
                .setDomain(APP_HOST)
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        createWebView();
        // restoreState returns null when nothing usable was saved; fall back to the start page instead of a blank screen.
        if (savedInstanceState == null || webView.restoreState(savedInstanceState) == null) webView.loadUrl(START_URL);

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView == null) { finish(); return; }
                webView.evaluateJavascript(
                        "(function(){try{return typeof handleAndroidBack==='function'&&handleAndroidBack()===true}catch(e){return false}})()",
                        handled -> { if (!"true".equals(handled)) moveTaskToBack(true); });
            }
        });
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void createWebView() {
        webView = new WebView(this);
        webView.setBackgroundColor(Color.TRANSPARENT);
        webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        root.addView(webView, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setSupportMultipleWindows(false);
        s.setJavaScriptCanOpenWindowsAutomatically(false);
        s.setGeolocationEnabled(false);
        s.setSupportZoom(false);
        s.setMediaPlaybackRequiresUserGesture(true);
        s.setSafeBrowsingEnabled(true);
        if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
            // The app ships its own dark theme; don't let the WebView invert colours.
            androidx.webkit.WebSettingsCompat.setAlgorithmicDarkeningAllowed(s, false);
        }

        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            WebViewCompat.addWebMessageListener(webView, "VastrenixNative", Collections.singleton(APP_ORIGIN),
                    (view, message, sourceOrigin, isMainFrame, replyProxy) -> {
                        if (!isMainFrame || !APP_ORIGIN.equals(sourceOrigin.toString())) return;
                        String data = message.getData();
                        if (data != null) handleBridgeMessage(data);
                    });
        }

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if ("https".equals(u.getScheme()) && APP_HOST.equals(u.getHost())) return false;
                openExternal(u);
                return true;
            }

            @Override
            public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                // The renderer crashed or was killed to reclaim memory: rebuild the WebView instead of crashing.
                Log.w(TAG, "WebView renderer gone (crash=" + detail.didCrash() + "), recreating");
                root.removeView(webView);
                webView.destroy();
                webView = null;
                createWebView();
                webView.loadUrl(START_URL);
                return true;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                try {
                    pickFile.launch(buildChooser(params));
                    return true;
                } catch (ActivityNotFoundException e) {
                    fileCallback = null;
                    return false;
                }
            }

            @Override
            public void onPermissionRequest(PermissionRequest request) {
                request.deny(); // the app never needs camera/mic/MIDI inside the WebView
            }
        });

        webView.setDownloadListener((url, ua, cd, mime, len) -> {
            // Files are produced in JS and handed over through the bridge; plain https downloads open externally.
            Uri u = Uri.parse(url);
            if ("https".equals(u.getScheme())) openExternal(u);
        });
    }

    // ------------------------------------------------------------------ bridge
    private void handleBridgeMessage(String raw) {
        try {
            JSONObject m = new JSONObject(raw);
            switch (m.optString("cmd")) {
                case "saveFile":
                    saveFile(m.optString("name"), m.optString("mime"), m.optString("data"), m.optBoolean("share", true));
                    break;
                case "open":
                    openExternal(Uri.parse(m.optString("url")));
                    break;
                case "ui":
                    applySystemBars(m.optBoolean("dark", false), m.optString("bg", ""));
                    break;
                default:
                    Log.w(TAG, "Unknown bridge command");
            }
        } catch (Exception e) {
            Log.w(TAG, "Bad bridge message", e);
        }
    }

    private void applySystemBars(boolean dark, String bg) {
        main.post(() -> {
            if (bg.matches("^#[0-9A-Fa-f]{6}$")) root.setBackgroundColor(Color.parseColor(bg));
            WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
            c.setAppearanceLightStatusBars(!dark);
            c.setAppearanceLightNavigationBars(!dark);
        });
    }

    private static String safeFileName(String name, String mime) {
        String n = SAFE_NAME.matcher(name == null ? "" : name).replaceAll("_");
        if (n.length() > 80) n = n.substring(n.length() - 80);
        String ext = extensionFor(mime);
        if (n.isEmpty() || n.startsWith(".")) n = "vastrenix" + n;
        if (!n.toLowerCase(Locale.ROOT).endsWith("." + ext)) n = n + "." + ext;
        return n;
    }

    @Nullable
    private static String allowedMime(String mime) {
        switch (mime == null ? "" : mime) {
            case "application/pdf":
            case "text/csv":
            case "application/json":
            case "text/plain":
            case "image/png":
            case "image/jpeg":
                return mime;
            default:
                return null;
        }
    }

    private static String extensionFor(String mime) {
        switch (mime) {
            case "application/pdf": return "pdf";
            case "text/csv": return "csv";
            case "application/json": return "json";
            case "image/png": return "png";
            case "image/jpeg": return "jpg";
            default: return "txt";
        }
    }

    private void saveFile(String name, String mimeIn, String base64, boolean share) {
        String mime = allowedMime(mimeIn);
        if (mime == null || base64 == null || base64.isEmpty() || base64.length() > MAX_FILE_BYTES * 4 / 3 + 8) {
            toast(getString(R.string.save_failed));
            return;
        }
        final String fileName = safeFileName(name, mime);
        io.execute(() -> {
            try {
                byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
                File dir = new File(getCacheDir(), "shared");
                if (!dir.exists() && !dir.mkdirs()) throw new IOException("cache dir");
                File f = new File(dir, fileName);
                try (FileOutputStream out = new FileOutputStream(f)) { out.write(bytes); }
                Uri shareUri = FileProvider.getUriForFile(this, getPackageName() + ".files", f);

                if (!share && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && saveToDownloads(fileName, mime, bytes)) {
                    toast(getString(R.string.saved_to_downloads, fileName));
                    return;
                }
                main.post(() -> {
                    Intent send = new Intent(Intent.ACTION_SEND)
                            .setType(mime)
                            .putExtra(Intent.EXTRA_STREAM, shareUri)
                            .putExtra(Intent.EXTRA_SUBJECT, fileName)
                            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    Intent chooser = Intent.createChooser(send, getString(R.string.share_file));
                    try { startActivity(chooser); } catch (ActivityNotFoundException e) { toast(getString(R.string.no_app_for_link)); }
                });
            } catch (Exception e) {
                Log.w(TAG, "saveFile failed", e);
                toast(getString(R.string.save_failed));
            }
        });
    }

    private boolean saveToDownloads(String fileName, String mime, byte[] bytes) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return false;
        ContentResolver cr = getContentResolver();
        ContentValues v = new ContentValues();
        v.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
        v.put(MediaStore.Downloads.MIME_TYPE, mime);
        v.put(MediaStore.Downloads.IS_PENDING, 1);
        Uri item = cr.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
        if (item == null) return false;
        try (OutputStream out = cr.openOutputStream(item)) {
            if (out == null) return false;
            out.write(bytes);
        } catch (IOException e) {
            cr.delete(item, null, null);
            return false;
        }
        v.clear();
        v.put(MediaStore.Downloads.IS_PENDING, 0);
        cr.update(item, v, null, null);
        return true;
    }

    // ------------------------------------------------------------------ links
    /** Only these schemes may leave the app. Everything else (intent:, file:, javascript:, content:, http:) is dropped. */
    private void openExternal(@NonNull Uri u) {
        String scheme = u.getScheme() == null ? "" : u.getScheme().toLowerCase(Locale.ROOT);
        Intent i;
        switch (scheme) {
            case "https":
            case "upi":
            case "whatsapp":
                i = new Intent(Intent.ACTION_VIEW, u);
                break;
            case "tel":
                i = new Intent(Intent.ACTION_DIAL, u);
                break;
            case "mailto":
                i = new Intent(Intent.ACTION_SENDTO, u);
                break;
            default:
                Log.w(TAG, "Blocked navigation with scheme: " + scheme);
                return;
        }
        if (Intent.ACTION_VIEW.equals(i.getAction())) i.addCategory(Intent.CATEGORY_BROWSABLE);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try { startActivity(i); } catch (ActivityNotFoundException e) { toast(getString(R.string.no_app_for_link)); }
    }

    // ------------------------------------------------------------------ photos
    private Intent buildChooser(WebChromeClient.FileChooserParams params) {
        Intent pick = new Intent(Intent.ACTION_GET_CONTENT).addCategory(Intent.CATEGORY_OPENABLE).setType("image/*");
        String[] accept = params.getAcceptTypes();
        if (accept != null && accept.length > 0 && accept[0] != null && !accept[0].isEmpty() && !accept[0].startsWith("image")) {
            pick.setType("*/*");
        }
        ArrayList<Intent> extras = new ArrayList<>();
        Intent camera = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        if (camera.resolveActivity(getPackageManager()) != null) {
            try {
                File dir = new File(getCacheDir(), "photos");
                if (!dir.exists() && !dir.mkdirs()) throw new IOException("photos dir");
                File photo = new File(dir, "photo_" + System.currentTimeMillis() + ".jpg");
                pendingCameraUri = FileProvider.getUriForFile(this, getPackageName() + ".files", photo);
                camera.putExtra(MediaStore.EXTRA_OUTPUT, pendingCameraUri);
                camera.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                extras.add(camera);
            } catch (Exception e) {
                pendingCameraUri = null;
            }
        }
        Intent chooser = Intent.createChooser(pick, getString(R.string.choose_photo));
        if (!extras.isEmpty()) chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, extras.toArray(new Intent[0]));
        return chooser;
    }

    private boolean cameraFileHasContent() {
        if (pendingCameraUri == null || pendingCameraUri.getLastPathSegment() == null) return false;
        File f = new File(new File(getCacheDir(), "photos"), pendingCameraUri.getLastPathSegment());
        return f.exists() && f.length() > 0;
    }

    // ------------------------------------------------------------------ lifecycle
    private void toast(String msg) { main.post(() -> Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()); }

    @Override
    protected void onSaveInstanceState(@NonNull Bundle outState) {
        super.onSaveInstanceState(outState);
        if (webView != null) webView.saveState(outState);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
    }

    @Override
    protected void onPause() {
        if (webView != null) webView.onPause();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        io.shutdown();
        if (webView != null) {
            root.removeView(webView);
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
