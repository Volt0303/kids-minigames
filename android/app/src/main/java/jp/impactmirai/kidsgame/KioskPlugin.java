package jp.impactmirai.kidsgame;

import android.app.Activity;
import android.content.Intent;
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

    /** The launching app opened the game again while it was still running. */
    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        notifyListeners("relaunch", new JSObject());
    }
}
