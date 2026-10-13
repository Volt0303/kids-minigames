package jp.entertainmentlane.kidsgame;

import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.ColorFilter;
import android.graphics.Paint;
import android.graphics.PixelFormat;
import android.graphics.Rect;
import android.graphics.drawable.Drawable;

/**
 * The app's background while the page loads, matching the web loading screen: white, the
 * game's backdrop covering the screen up to 16:9 (centred, cut evenly to fit), and the guide
 * character (or starfish) in the middle. A layer-list drawable could only stretch the picture
 * across the whole 32:9 screen.
 */
public class LaunchBackdrop extends Drawable {

    private static final float BASE_ASPECT = 16f / 9f;

    private final Bitmap backdrop;
    private final Drawable guide;
    private final int guideWidth;
    private final int guideHeight;
    private final Paint paint = new Paint(Paint.FILTER_BITMAP_FLAG);
    private final Rect source = new Rect();
    private final Rect target = new Rect();

    public LaunchBackdrop(Resources res) {
        backdrop = BitmapFactory.decodeResource(res, R.drawable.launch_backdrop);
        guide = res.getDrawable(R.drawable.launch_guide, null);
        guideWidth = res.getDimensionPixelSize(R.dimen.launch_guide_width);
        guideHeight = res.getDimensionPixelSize(R.dimen.launch_guide_height);
    }

    @Override
    public void draw(Canvas canvas) {
        Rect bounds = getBounds();
        canvas.drawColor(0xffffffff);
        if (backdrop != null) drawBackdrop(canvas, bounds);
        int cx = bounds.centerX();
        int cy = bounds.centerY();
        guide.setBounds(cx - guideWidth / 2, cy - guideHeight / 2, cx + guideWidth / 2, cy + guideHeight / 2);
        guide.draw(canvas);
    }

    /** The backdrop covering the centred 16:9 area, cut evenly at two sides to fit it. */
    private void drawBackdrop(Canvas canvas, Rect bounds) {
        int height = bounds.height();
        int width = Math.min(bounds.width(), Math.round(height * BASE_ASPECT));
        int left = bounds.left + (bounds.width() - width) / 2;
        target.set(left, bounds.top, left + width, bounds.bottom);
        float areaAspect = (float) width / height;
        int bw = backdrop.getWidth();
        int bh = backdrop.getHeight();
        if ((float) bw / bh > areaAspect) {
            int cut = Math.round(bh * areaAspect);
            source.set((bw - cut) / 2, 0, (bw + cut) / 2, bh);
        } else {
            int cut = Math.round(bw / areaAspect);
            source.set(0, (bh - cut) / 2, bw, (bh + cut) / 2);
        }
        canvas.drawBitmap(backdrop, source, target, paint);
    }

    @Override
    public void setAlpha(int alpha) {
        paint.setAlpha(alpha);
    }

    @Override
    public void setColorFilter(ColorFilter colorFilter) {
        paint.setColorFilter(colorFilter);
    }

    @Override
    public int getOpacity() {
        return PixelFormat.OPAQUE;
    }
}
