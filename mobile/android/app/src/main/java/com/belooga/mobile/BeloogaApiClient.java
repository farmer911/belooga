package com.belooga.mobile;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.ProtocolException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Native Android HTTP Client & SharedPreferences JWT Vault for Belooga Edge Gateway (:8080).
 * Connects Android Emulator (10.0.2.2:8080) to live FastAPI /v1/* endpoints off the main UI thread.
 */
public final class BeloogaApiClient {
    public static final String BASE_URL = "http://10.0.2.2:8080";
    public static final String VAULT_PREFS = "belooga_secure_vault";
    public static final String KEY_ACCESS_TOKEN = "access_token";
    public static final String KEY_REFRESH_TOKEN = "refresh_token";

    private static final ExecutorService EXECUTOR = Executors.newFixedThreadPool(4);
    private static final Handler MAIN_HANDLER = new Handler(Looper.getMainLooper());

    public interface ApiCallback {
        void onResult(int statusCode, String responseBody);
    }

    private BeloogaApiClient() {}

    public static SharedPreferences getVault(Context ctx) {
        return ctx.getSharedPreferences(VAULT_PREFS, Context.MODE_PRIVATE);
    }

    public static String getAccessToken(Context ctx) {
        return getVault(ctx).getString(KEY_ACCESS_TOKEN, null);
    }

    public static String getRefreshToken(Context ctx) {
        return getVault(ctx).getString(KEY_REFRESH_TOKEN, null);
    }

    public static void saveTokenPair(Context ctx, String accessToken, String refreshToken) {
        getVault(ctx)
                .edit()
                .putString(KEY_ACCESS_TOKEN, accessToken)
                .putString(KEY_REFRESH_TOKEN, refreshToken)
                .apply();
    }

    public static void get(Context ctx, String path, ApiCallback callback) {
        request(ctx, "GET", path, null, callback);
    }

    public static void post(Context ctx, String path, String jsonBody, ApiCallback callback) {
        request(ctx, "POST", path, jsonBody, callback);
    }

    public static void put(Context ctx, String path, String jsonBody, ApiCallback callback) {
        request(ctx, "PUT", path, jsonBody, callback);
    }

    public static void patch(Context ctx, String path, String jsonBody, ApiCallback callback) {
        request(ctx, "PATCH", path, jsonBody, callback);
    }

    public static void delete(Context ctx, String path, ApiCallback callback) {
        request(ctx, "DELETE", path, null, callback);
    }

    public static void rotateSessionToken(final Context ctx, final ApiCallback callback) {
        String refresh = getRefreshToken(ctx);
        String payload = "{\"refresh_token\":\"" + (refresh != null ? refresh : "") + "\"}";
        post(ctx, "/v1/auth/refresh/", payload, new ApiCallback() {
            @Override
            public void onResult(int statusCode, String responseBody) {
                if (statusCode >= 200 && statusCode < 300 && responseBody != null) {
                    saveTokenPair(ctx, responseBody, refresh != null ? refresh : "");
                }
                if (callback != null) {
                    callback.onResult(statusCode, responseBody);
                }
            }
        });
    }

    public static void request(
            final Context ctx,
            final String method,
            final String path,
            final String jsonBody,
            final ApiCallback callback
    ) {
        final Context appCtx = ctx.getApplicationContext() != null ? ctx.getApplicationContext() : ctx;
        final String token = getAccessToken(appCtx);

        EXECUTOR.execute(new Runnable() {
            @Override
            public void run() {
                int status = -1;
                String body = "";
                HttpURLConnection conn = null;
                try {
                    String fullUrl = path.startsWith("http") ? path : (BASE_URL + path);
                    conn = (HttpURLConnection) new URL(fullUrl).openConnection();
                    conn.setConnectTimeout(3500);
                    conn.setReadTimeout(3500);
                    conn.setRequestProperty("Accept", "application/json");
                    conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
                    if (token != null && !token.isEmpty()) {
                        conn.setRequestProperty("Authorization", "Bearer " + token);
                    }

                    try {
                        conn.setRequestMethod(method);
                    } catch (ProtocolException pe) {
                        conn.setRequestMethod("POST");
                        conn.setRequestProperty("X-HTTP-Method-Override", method);
                    }

                    if (jsonBody != null && ("POST".equals(method) || "PUT".equals(method) || "PATCH".equals(method))) {
                        conn.setDoOutput(true);
                        byte[] bytes = jsonBody.getBytes(StandardCharsets.UTF_8);
                        OutputStream os = conn.getOutputStream();
                        os.write(bytes);
                        os.flush();
                        os.close();
                    }

                    status = conn.getResponseCode();
                    InputStream is = (status >= 200 && status < 400) ? conn.getInputStream() : conn.getErrorStream();
                    if (is != null) {
                        BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
                        StringBuilder sb = new StringBuilder();
                        String line;
                        while ((line = reader.readLine()) != null) {
                            sb.append(line);
                        }
                        reader.close();
                        body = sb.toString();
                    }
                } catch (Exception ex) {
                    status = 0;
                    body = "{\"error\":\"" + ex.getClass().getSimpleName() + "\"}";
                } finally {
                    if (conn != null) {
                        conn.disconnect();
                    }
                }

                final int finalStatus = status;
                final String finalBody = body;
                if (callback != null) {
                    MAIN_HANDLER.post(new Runnable() {
                        @Override
                        public void run() {
                            callback.onResult(finalStatus, finalBody);
                        }
                    });
                }
            }
        });
    }
}
