package com.thepianist.game;

import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.webkit.ConsoleMessage;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

/** Keeps the original file:///android_asset/ origin, package ID, and localStorage. */
public final class MainActivity extends Activity {
    private static final String TAG = "ThePianist";
    private WebView gameView;
    private boolean rendererFailed = false;
    private int recoveryAttempts = 0;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN |
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
        showGame();
    }

    private void showGame() {
        rendererFailed = false;
        try {
            WebView view = new WebView(this);
            view.setBackgroundColor(0xff10131c);
            WebSettings s = view.getSettings();
            s.setJavaScriptEnabled(true);
            s.setDomStorageEnabled(true);
            s.setAllowFileAccess(true);
            s.setAllowContentAccess(false);
            s.setAllowFileAccessFromFileURLs(false);
            s.setAllowUniversalAccessFromFileURLs(false);
            s.setMediaPlaybackRequiresUserGesture(true);
            view.setWebChromeClient(new WebChromeClient() {
                @Override public boolean onConsoleMessage(ConsoleMessage message) {
                    Log.d(TAG, message.messageLevel() + ": " + message.message()
                        + " at " + message.sourceId() + ":" + message.lineNumber());
                    return true;
                }
            });
            view.setWebViewClient(new WebViewClient() {
                @Override public boolean onRenderProcessGone(WebView webView, RenderProcessGoneDetail detail) {
                    Log.e(TAG, "WebView renderer exited. Did crash: " + detail.didCrash()
                        + "; priority: " + detail.rendererPriorityAtExit());
                    rendererFailed = true;
                    if (webView == gameView) gameView = null;
                    webView.destroy();
                    // Never allow Android to kill the host Activity just because WebView died.
                    runOnUiThread(() -> showRecovery("The graphics renderer closed unexpectedly."));
                    return true;
                }
            });
            gameView = view;
            setContentView(view);
            view.loadUrl("file:///android_asset/index.html");
        } catch (Throwable error) {
            Log.e(TAG, "Unable to initialize The Pianist", error);
            showRecovery("The game could not start on this device.");
        }
    }

    private void showRecovery(String message) {
        LinearLayout panel = new LinearLayout(this);
        panel.setOrientation(LinearLayout.VERTICAL);
        panel.setBackgroundColor(0xff10131c);
        panel.setGravity(Gravity.CENTER);
        panel.setPadding(40, 30, 40, 30);
        TextView msg = new TextView(this);
        msg.setText("THE PIANIST\n\n" + message
            + "\n\nYour saved data has not been cleared. You can retry safely.");
        msg.setTextColor(0xffefdfc2);
        msg.setTextSize(17);
        msg.setGravity(Gravity.CENTER);
        panel.addView(msg);
        Button retry = new Button(this);
        retry.setText("Retry game");
        retry.setOnClickListener(v -> {
            if (++recoveryAttempts > 3) {
                msg.setText("The graphics renderer keeps closing. Please send the Android crash report or WebView version. Your data is safe.");
            } else showGame();
        });
        panel.addView(retry);
        setContentView(panel);
    }

    @Override protected void onPause() {
        if (gameView != null && !rendererFailed) {
            try { gameView.evaluateJavascript("window.__pianistPause && window.__pianistPause();", null); gameView.onPause(); }
            catch (Exception e) { Log.w(TAG, "Unable to pause WebView", e); }
        }
        super.onPause();
    }
    @Override protected void onResume() {
        super.onResume();
        if (gameView != null && !rendererFailed) {
            try { gameView.onResume(); gameView.evaluateJavascript("window.__pianistResume && window.__pianistResume();", null); }
            catch (Exception e) { Log.w(TAG, "Unable to resume WebView", e); }
        }
    }
    @Override protected void onDestroy() {
        if (gameView != null) { try { gameView.destroy(); } catch(Exception ignored) {} gameView = null; }
        super.onDestroy();
    }
}
