package jp.entertainmentlane.kidsgame;

import android.os.Bundle;
import android.os.Process;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

/**
 * Full-screen game activity: hides the system bars, keeps the screen on while
 * the game is open, and registers the kiosk integration plugin.
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(KioskPlugin.class);
        super.onCreate(savedInstanceState);
        // Same picture as the launch screen and the web loading screen, behind the transparent
        // web view until the page draws its own — so there is no black or white frame between.
        // (On the content view: the window background alone is not drawn here and shows black.)
        findViewById(android.R.id.content).setBackgroundResource(R.drawable.launch_screen);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        hideSystemBars();
    }

    /** Android shows the bars again after dialogs and app switches; hide them whenever focus returns. */
    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemBars();
        }
    }

    /**
     * When the game closes for good (exit, back button, idle timeout, all clear), end the whole
     * app process too, so the next launch from the icon always starts fresh. A reused process
     * keeps the old web view's graphics state, and the new web view then cannot draw at all
     * (frozen light-blue screen, then the start screen's idle timeout closes it).
     */
    @Override
    public void onDestroy() {
        super.onDestroy();
        if (isFinishing()) {
            Process.killProcess(Process.myPid());
        }
    }

    private void hideSystemBars() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        controller.hide(WindowInsetsCompat.Type.systemBars());
    }
}
