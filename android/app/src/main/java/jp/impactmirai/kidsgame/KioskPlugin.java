package jp.impactmirai.kidsgame;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Integration with the self-order app that launches the games.
 * JavaScript side: src/core/platform/AndroidPlatform.ts
 */
@CapacitorPlugin(name = "Kiosk")
public class KioskPlugin extends Plugin {

    /**
     * Closes the game and removes it from the recent-apps list, so the
     * launching app is shown again and the game cannot be reopened from Recents.
     */
    @PluginMethod
    public void exit(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("No activity to close");
            return;
        }
        call.resolve();
        activity.runOnUiThread(activity::finishAndRemoveTask);
    }

    /**
     * The page draws its own loading screen now: make the web view opaque again. It starts
     * see-through (capacitor.config.json) so the launch picture shows until the page is ready,
     * but a see-through web view loses its WebGL drawing when the app returns from the
     * background (Android 12), leaving a frozen light-blue screen.
     */
    @PluginMethod
    public void pageShown(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("No activity");
            return;
        }
        activity.runOnUiThread(() -> {
            bridge.getWebView().setBackgroundColor(Color.parseColor("#dcf2ff"));
            call.resolve();
        });
    }

    /** The launching app opened the game again while it was still running. */
    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        notifyListeners("relaunch", new JSObject());
    }
}
