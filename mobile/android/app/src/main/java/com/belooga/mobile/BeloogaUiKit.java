package com.belooga.mobile;

import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public final class BeloogaUiKit {
    public static final int COLOR_PAGE = Color.rgb(9, 13, 22);
    public static final int COLOR_CARD = Color.rgb(17, 25, 40);
    public static final int COLOR_SUBTLE = Color.rgb(11, 17, 30);
    public static final int COLOR_ELEVATED = Color.rgb(26, 37, 58);
    public static final int COLOR_BORDER = Color.rgb(38, 52, 77);
    public static final int COLOR_BRAND = Color.rgb(91, 187, 174);
    public static final int COLOR_BRAND_MUTED = Color.argb(42, 91, 187, 174);
    public static final int COLOR_ACCENT_BLUE = Color.rgb(37, 99, 235);
    public static final int COLOR_SUCCESS = Color.rgb(52, 211, 153);
    public static final int COLOR_SUCCESS_MUTED = Color.argb(40, 52, 211, 153);
    public static final int COLOR_WARNING = Color.rgb(251, 191, 36);
    public static final int COLOR_TEXT_HEADING = Color.rgb(248, 250, 252);
    public static final int COLOR_TEXT_MAIN = Color.rgb(226, 232, 240);
    public static final int COLOR_TEXT_MUTED = Color.rgb(148, 163, 184);
    public static final int COLOR_TEXT_INVERSE = Color.rgb(11, 17, 30);

    private BeloogaUiKit() {}

    public static int dp(Context ctx, float value) {
        float density = ctx.getResources().getDisplayMetrics().density;
        return Math.round(value * density);
    }

    public static GradientDrawable roundedDrawable(
            Context ctx,
            int fillColor,
            int strokeColor,
            float strokeDp,
            float radiusDp
    ) {
        GradientDrawable gd = new GradientDrawable();
        gd.setShape(GradientDrawable.RECTANGLE);
        gd.setColor(fillColor);
        gd.setCornerRadius(dp(ctx, radiusDp));
        if (strokeDp > 0f) {
            gd.setStroke(dp(ctx, strokeDp), strokeColor);
        }
        return gd;
    }

    public static LinearLayout createSurfaceCard(Context ctx, String testId) {
        LinearLayout card = new LinearLayout(ctx);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setBackground(roundedDrawable(ctx, COLOR_CARD, COLOR_BORDER, 1f, 16f));
        int pad = dp(ctx, 15f);
        card.setPadding(pad, pad, pad, pad);
        if (testId != null && !testId.isEmpty()) {
            card.setContentDescription(testId);
        }
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        lp.setMargins(0, 0, 0, dp(ctx, 11f));
        card.setLayoutParams(lp);
        return card;
    }

    public static LinearLayout createSubtleBox(Context ctx) {
        LinearLayout box = new LinearLayout(ctx);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setBackground(roundedDrawable(ctx, COLOR_SUBTLE, COLOR_BORDER, 1f, 12f));
        int pad = dp(ctx, 11f);
        box.setPadding(pad, pad, pad, pad);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        lp.setMargins(0, dp(ctx, 7f), 0, dp(ctx, 7f));
        box.setLayoutParams(lp);
        return box;
    }

    public static TextView createBadgePill(
            Context ctx,
            String text,
            int textColor,
            int bgColor,
            int borderColor,
            String testId
    ) {
        TextView pill = new TextView(ctx);
        pill.setText(text);
        pill.setTextColor(textColor);
        pill.setTextSize(10.5f);
        pill.setTypeface(Typeface.DEFAULT_BOLD);
        pill.setBackground(roundedDrawable(ctx, bgColor, borderColor, 1f, 999f));
        pill.setPadding(dp(ctx, 9f), dp(ctx, 3.5f), dp(ctx, 9f), dp(ctx, 3.5f));
        if (testId != null && !testId.isEmpty()) {
            pill.setContentDescription(testId);
        }
        return pill;
    }

    public static TextView createAvatarCircle(Context ctx, String initials, int bgColor, int textColor) {
        TextView avatar = new TextView(ctx);
        avatar.setText(initials);
        avatar.setTextColor(textColor);
        avatar.setTextSize(13f);
        avatar.setTypeface(Typeface.DEFAULT_BOLD);
        avatar.setGravity(Gravity.CENTER);
        avatar.setBackground(roundedDrawable(ctx, bgColor, COLOR_BRAND, 1.5f, 999f));
        int size = dp(ctx, 38f);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(size, size);
        lp.setMargins(0, 0, dp(ctx, 10f), 0);
        avatar.setLayoutParams(lp);
        return avatar;
    }

    public static Button createActionButton(
            Context ctx,
            String label,
            String testId,
            int bgColor,
            int textColor,
            View.OnClickListener listener
    ) {
        Button btn = new Button(ctx);
        btn.setText(label);
        btn.setAllCaps(false);
        btn.setTextSize(13f);
        btn.setTypeface(Typeface.DEFAULT_BOLD);
        btn.setTextColor(textColor);
        btn.setBackground(roundedDrawable(ctx, bgColor, COLOR_BORDER, 0f, 11f));
        btn.setPadding(dp(ctx, 12f), dp(ctx, 9f), dp(ctx, 12f), dp(ctx, 9f));
        btn.setMinimumHeight(dp(ctx, 40f));
        btn.setMinHeight(dp(ctx, 40f));
        if (testId != null && !testId.isEmpty()) {
            btn.setContentDescription(testId);
        }
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        lp.setMargins(0, dp(ctx, 7f), 0, 0);
        btn.setLayoutParams(lp);
        btn.setOnClickListener(listener);
        return btn;
    }

    public static LinearLayout createMetricTile(
            Context ctx,
            String metricValue,
            String metricLabel,
            int valueColor
    ) {
        LinearLayout tile = new LinearLayout(ctx);
        tile.setOrientation(LinearLayout.VERTICAL);
        tile.setGravity(Gravity.CENTER);
        tile.setBackground(roundedDrawable(ctx, COLOR_SUBTLE, COLOR_BORDER, 1f, 12f));
        int pad = dp(ctx, 9f);
        tile.setPadding(pad, pad, pad, pad);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                0,
                ViewGroup.LayoutParams.WRAP_CONTENT,
                1f
        );
        lp.setMargins(dp(ctx, 3f), 0, dp(ctx, 3f), 0);
        tile.setLayoutParams(lp);

        TextView val = new TextView(ctx);
        val.setText(metricValue);
        val.setTextColor(valueColor);
        val.setTextSize(16f);
        val.setTypeface(Typeface.DEFAULT_BOLD);
        val.setGravity(Gravity.CENTER);
        tile.addView(val);

        TextView lbl = new TextView(ctx);
        lbl.setText(metricLabel);
        lbl.setTextColor(COLOR_TEXT_MUTED);
        lbl.setTextSize(10.5f);
        lbl.setGravity(Gravity.CENTER);
        tile.addView(lbl);

        return tile;
    }

    public static LinearLayout createRow(Context ctx, int bottomMarginDp) {
        LinearLayout row = new LinearLayout(ctx);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        lp.setMargins(0, 0, 0, dp(ctx, bottomMarginDp));
        row.setLayoutParams(lp);
        return row;
    }

    public static View createSpacer(Context ctx, int widthDp) {
        View spacer = new View(ctx);
        spacer.setLayoutParams(new LinearLayout.LayoutParams(dp(ctx, widthDp), 1));
        return spacer;
    }
}
