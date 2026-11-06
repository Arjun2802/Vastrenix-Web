package com.vastrenix.app;

import android.net.Uri;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;

/**
 * Talks to the Vastrenix payment server for in-app Razorpay payments.
 *
 * Only two fixed endpoints are ever called (create-order and verify), only over https, only on the
 * payment-server address the admin configured, and always with the signed-in user's Firebase ID token.
 * The Razorpay key secret never reaches the device: the server prices the order and verifies the payment.
 */
final class InAppPayments {
    static final Pattern TOKEN = Pattern.compile("^[A-Za-z0-9._-]{20,4096}$");
    static final Pattern CYCLE = Pattern.compile("^(monthly|quarterly|annual)$");
    static final Pattern ORDER_ID = Pattern.compile("^order_[A-Za-z0-9]{6,30}$");
    static final Pattern PAYMENT_ID = Pattern.compile("^pay_[A-Za-z0-9]{6,30}$");
    static final Pattern KEY_ID = Pattern.compile("^rzp_(test|live)_[A-Za-z0-9]{8,}$");
    private static final int MAX_RESPONSE = 64 * 1024;

    private InAppPayments() { }

    /** Returns "https://host[:port][/path]" without a trailing slash, or null if the address isn't safe to call. */
    static String safeApiBase(String raw) {
        if (raw == null) return null;
        Uri u = Uri.parse(raw.trim());
        if (!"https".equals(u.getScheme()) || u.getHost() == null || u.getHost().isEmpty()) return null;
        if (u.getUserInfo() != null || u.getQuery() != null || u.getFragment() != null) return null;
        if (!u.getHost().matches("^[A-Za-z0-9.-]+$")) return null;
        String path = u.getPath() == null ? "" : u.getPath().replaceAll("/+$", "");
        if (!path.matches("^[A-Za-z0-9._/-]*$")) return null;
        return "https://" + u.getHost() + (u.getPort() > 0 ? ":" + u.getPort() : "") + path;
    }

    static final class Result {
        final int status;
        final JSONObject body;
        Result(int status, JSONObject body) { this.status = status; this.body = body; }
        boolean ok() { return status >= 200 && status < 300; }
        String error(String fallback) { return body != null && body.optString("error", "").length() > 0 ? body.optString("error") : fallback; }
    }

    /** POSTs JSON to apiBase + path with "Authorization: Bearer <token>". Never follows redirects. */
    static Result post(String apiBase, String path, String token, JSONObject body) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(apiBase + path).openConnection();
        try {
            c.setInstanceFollowRedirects(false);
            c.setConnectTimeout(15000);
            c.setReadTimeout(25000);
            c.setRequestMethod("POST");
            c.setDoOutput(true);
            c.setRequestProperty("Content-Type", "application/json");
            c.setRequestProperty("Accept", "application/json");
            c.setRequestProperty("Authorization", "Bearer " + token);
            byte[] out = body.toString().getBytes(StandardCharsets.UTF_8);
            c.setFixedLengthStreamingMode(out.length);
            try (OutputStream os = c.getOutputStream()) { os.write(out); }
            int status = c.getResponseCode();
            InputStream in = status >= 400 ? c.getErrorStream() : c.getInputStream();
            JSONObject json = new JSONObject();
            if (in != null) {
                try (InputStream is = in; ByteArrayOutputStream buf = new ByteArrayOutputStream()) {
                    byte[] b = new byte[4096];
                    int n, total = 0;
                    while ((n = is.read(b)) != -1) {
                        total += n;
                        if (total > MAX_RESPONSE) throw new IllegalStateException("response too large");
                        buf.write(b, 0, n);
                    }
                    String s = buf.toString("UTF-8").trim();
                    if (s.startsWith("{")) json = new JSONObject(s);
                }
            }
            return new Result(status, json);
        } finally {
            c.disconnect();
        }
    }
}
