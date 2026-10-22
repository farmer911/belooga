package com.belooga.mobile;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
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
    public static final int COLOR_NAVDOCK = Color.rgb(12, 18, 30);
    public static final int COLOR_CARD = Color.rgb(17, 25, 40);
    public static final int COLOR_SUBTLE = Color.rgb(11, 17, 30);
    public static final int COLOR_ELEVATED = Color.rgb(26, 37, 58);
    public static final int COLOR_BORDER = Color.rgb(38, 52, 77);
    public static final int COLOR_BRAND = Color.rgb(91, 187, 174);
    public static final int COLOR_BRAND_MUTED = Color.argb(46, 91, 187, 174);
    public static final int COLOR_ACCENT_BLUE = Color.rgb(37, 99, 235);
    public static final int COLOR_MOMO_PINK = Color.rgb(216, 45, 139);
    public static final int COLOR_SUCCESS = Color.rgb(52, 211, 153);
    public static final int COLOR_SUCCESS_MUTED = Color.argb(42, 52, 211, 153);
    public static final int COLOR_WARNING = Color.rgb(251, 191, 36);
    public static final int COLOR_WARNING_MUTED = Color.argb(40, 251, 191, 36);
    public static final int COLOR_TEXT_HEADING = Color.rgb(248, 250, 252);
    public static final int COLOR_TEXT_MAIN = Color.rgb(226, 232, 240);
    public static final int COLOR_TEXT_MUTED = Color.rgb(148, 163, 184);
    public static final int COLOR_TEXT_INVERSE = Color.rgb(11, 17, 30);

    public static final int ICON_DISCOVER = 0;
    public static final int ICON_STUDIO = 1;
    public static final int ICON_TRACKER = 2;
    public static final int ICON_CAREER = 3;
    public static final int ICON_WORKSPACE = 4;

    public interface SegmentSelectListener {
        void onSelect(int index);
    }

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

    public static final class NavIconView extends View {
        private final int iconType;
        private final Paint paint;
        private final RectF rect = new RectF();
        private final Path path = new Path();

        public NavIconView(Context ctx, int iconType, int color) {
            super(ctx);
            this.iconType = iconType;
            this.paint = new Paint(Paint.ANTI_ALIAS_FLAG);
            this.paint.setColor(color);
            this.paint.setStyle(Paint.Style.STROKE);
            this.paint.setStrokeWidth(dp(ctx, 1.9f));
            this.paint.setStrokeCap(Paint.Cap.ROUND);
            this.paint.setStrokeJoin(Paint.Join.ROUND);
        }

        public void setIconColor(int color) {
            this.paint.setColor(color);
            invalidate();
        }

        @Override
        protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);
            float w = getWidth();
            float h = getHeight();
            float cx = w / 2f;
            float cy = h / 2f;
            float r = Math.min(w, h) * 0.34f;

            if (iconType == ICON_DISCOVER) {
                canvas.drawCircle(cx - dp(getContext(), 1.5f), cy - dp(getContext(), 1.5f), r * 0.85f, paint);
                canvas.drawLine(cx + r * 0.45f, cy + r * 0.45f, cx + r * 1.05f, cy + r * 1.05f, paint);
            } else if (iconType == ICON_STUDIO) {
                rect.set(cx - r * 1.1f, cy - r * 0.7f, cx + r * 0.45f, cy + r * 0.7f);
                canvas.drawRoundRect(rect, dp(getContext(), 3f), dp(getContext(), 3f), paint);
                path.reset();
                path.moveTo(cx + r * 0.45f, cy - r * 0.35f);
                path.lineTo(cx + r * 1.1f, cy - r * 0.65f);
                path.lineTo(cx + r * 1.1f, cy + r * 0.65f);
                path.lineTo(cx + r * 0.45f, cy + r * 0.35f);
                path.close();
                canvas.drawPath(path, paint);
            } else if (iconType == ICON_TRACKER) {
                rect.set(cx - r * 1.05f, cy - r * 0.8f, cx + r * 1.05f, cy + r * 0.85f);
                canvas.drawRoundRect(rect, dp(getContext(), 3f), dp(getContext(), 3f), paint);
                canvas.drawLine(cx - r * 0.35f, cy - r * 0.8f, cx - r * 0.35f, cy + r * 0.85f, paint);
                canvas.drawLine(cx + r * 0.35f, cy - r * 0.8f, cx + r * 0.35f, cy + r * 0.85f, paint);
            } else if (iconType == ICON_CAREER) {
                canvas.drawLine(cx - r * 0.85f, cy + r * 0.8f, cx - r * 0.85f, cy + r * 0.1f, paint);
                canvas.drawLine(cx, cy + r * 0.8f, cx, cy - r * 0.35f, paint);
                canvas.drawLine(cx + r * 0.85f, cy + r * 0.8f, cx + r * 0.85f, cy - r * 0.85f, paint);
            } else {
                canvas.drawCircle(cx, cy - r * 0.38f, r * 0.48f, paint);
                rect.set(cx - r * 0.95f, cy + r * 0.2f, cx + r * 0.95f, cy + r * 1.15f);
                canvas.drawArc(rect, 180f, 180f, false, paint);
            }
        }
    }

    public static final class NavTabHolder {
        public final LinearLayout root;
        public final View topIndicator;
        public final LinearLayout iconPill;
        public final NavIconView iconView;
        public final TextView labelView;

        public NavTabHolder(
                LinearLayout root,
                View topIndicator,
                LinearLayout iconPill,
                NavIconView iconView,
                TextView labelView
        ) {
            this.root = root;
            this.topIndicator = topIndicator;
            this.iconPill = iconPill;
            this.iconView = iconView;
            this.labelView = labelView;
        }
    }

    public static NavTabHolder createModernNavTab(
            Context ctx,
            String label,
            String testId,
            int iconType,
            final Runnable onTap
    ) {
        LinearLayout tab = new LinearLayout(ctx);
        tab.setOrientation(LinearLayout.VERTICAL);
        tab.setGravity(Gravity.CENTER_HORIZONTAL);
        tab.setClickable(true);
        tab.setFocusable(true);
        tab.setContentDescription(testId);
        tab.setPadding(dp(ctx, 2f), dp(ctx, 2f), dp(ctx, 2f), dp(ctx, 4f));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                0,
                ViewGroup.LayoutParams.WRAP_CONTENT,
                1f
        );
        tab.setLayoutParams(lp);

        View topIndicator = new View(ctx);
        LinearLayout.LayoutParams indLp = new LinearLayout.LayoutParams(dp(ctx, 24f), dp(ctx, 3f));
        indLp.setMargins(0, 0, 0, dp(ctx, 4f));
        topIndicator.setLayoutParams(indLp);
        tab.addView(topIndicator);

        LinearLayout iconPill = new LinearLayout(ctx);
        iconPill.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams pillLp = new LinearLayout.LayoutParams(dp(ctx, 46f), dp(ctx, 26f));
        iconPill.setLayoutParams(pillLp);

        NavIconView iconView = new NavIconView(ctx, iconType, COLOR_TEXT_MUTED);
        iconView.setLayoutParams(new LinearLayout.LayoutParams(dp(ctx, 20f), dp(ctx, 20f)));
        iconPill.addView(iconView);
        tab.addView(iconPill);

        TextView lbl = new TextView(ctx);
        lbl.setText(label);
        lbl.setTextSize(10.5f);
        lbl.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams lblLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        lblLp.setMargins(0, dp(ctx, 2f), 0, 0);
        lbl.setLayoutParams(lblLp);
        tab.addView(lbl);

        tab.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                onTap.run();
            }
        });

        return new NavTabHolder(tab, topIndicator, iconPill, iconView, lbl);
    }

    public static void updateNavTabsState(Context ctx, NavTabHolder[] tabs, NavTabHolder active) {
        for (NavTabHolder holder : tabs) {
            if (holder == null) continue;
            boolean isActive = (holder == active);
            if (isActive) {
                holder.topIndicator.setBackground(roundedDrawable(ctx, COLOR_BRAND, COLOR_BRAND, 0f, 99f));
                holder.iconPill.setBackground(roundedDrawable(ctx, COLOR_BRAND_MUTED, COLOR_BRAND, 0f, 99f));
                holder.iconView.setIconColor(COLOR_BRAND);
                holder.labelView.setTextColor(COLOR_BRAND);
                holder.labelView.setTypeface(Typeface.DEFAULT_BOLD);
            } else {
                holder.topIndicator.setBackgroundColor(Color.TRANSPARENT);
                holder.iconPill.setBackgroundColor(Color.TRANSPARENT);
                holder.iconView.setIconColor(COLOR_TEXT_MUTED);
                holder.labelView.setTextColor(COLOR_TEXT_MUTED);
                holder.labelView.setTypeface(Typeface.DEFAULT);
            }
        }
    }

    public static LinearLayout createSegmentedBar(
            Context ctx,
            String[] labels,
            int activeIdx,
            final SegmentSelectListener listener
    ) {
        LinearLayout bar = new LinearLayout(ctx);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setBackground(roundedDrawable(ctx, COLOR_SUBTLE, COLOR_BORDER, 1f, 11f));
        int p = dp(ctx, 3.5f);
        bar.setPadding(p, p, p, p);
        LinearLayout.LayoutParams barLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        barLp.setMargins(0, 0, 0, dp(ctx, 10f));
        bar.setLayoutParams(barLp);

        for (int i = 0; i < labels.length; i++) {
            final int index = i;
            boolean active = (i == activeIdx);
            TextView seg = new TextView(ctx);
            seg.setText(labels[i]);
            seg.setGravity(Gravity.CENTER);
            seg.setTextSize(11.5f);
            seg.setTypeface(Typeface.DEFAULT_BOLD);
            seg.setPadding(dp(ctx, 6f), dp(ctx, 7f), dp(ctx, 6f), dp(ctx, 7f));
            seg.setContentDescription("mobile-segment-" + labels[i].toLowerCase().replace(" ", "-"));
            if (active) {
                seg.setBackground(roundedDrawable(ctx, COLOR_BRAND, COLOR_BRAND, 0f, 8f));
                seg.setTextColor(COLOR_TEXT_INVERSE);
            } else {
                seg.setBackgroundColor(Color.TRANSPARENT);
                seg.setTextColor(COLOR_TEXT_MUTED);
            }
            LinearLayout.LayoutParams segLp = new LinearLayout.LayoutParams(
                    0,
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    1f
            );
            seg.setLayoutParams(segLp);
            seg.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    listener.onSelect(index);
                }
            });
            bar.addView(seg);
        }
        return bar;
    }

    public static LinearLayout createProgressBar(Context ctx, int percent, int fillColor) {
        LinearLayout track = new LinearLayout(ctx);
        track.setOrientation(LinearLayout.HORIZONTAL);
        track.setBackground(roundedDrawable(ctx, COLOR_ELEVATED, COLOR_BORDER, 0f, 99f));
        LinearLayout.LayoutParams trackLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dp(ctx, 8f)
        );
        trackLp.setMargins(0, dp(ctx, 6f), 0, dp(ctx, 6f));
        track.setLayoutParams(trackLp);

        int clamped = Math.max(4, Math.min(100, percent));
        View fill = new View(ctx);
        fill.setBackground(roundedDrawable(ctx, fillColor, fillColor, 0f, 99f));
        fill.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, clamped));
        track.addView(fill);

        if (clamped < 100) {
            View empty = new View(ctx);
            empty.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 100 - clamped));
            track.addView(empty);
        }
        return track;
    }

    public static LinearLayout createSurfaceCard(Context ctx, String testId) {
        LinearLayout card = new LinearLayout(ctx);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setBackground(roundedDrawable(ctx, COLOR_CARD, COLOR_BORDER, 1f, 16f));
        int pad = dp(ctx, 14f);
        card.setPadding(pad, pad, pad, pad);
        if (testId != null && !testId.isEmpty()) {
            card.setContentDescription(testId);
        }
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        lp.setMargins(0, 0, 0, dp(ctx, 10f));
        card.setLayoutParams(lp);
        return card;
    }

    public static LinearLayout createSubtleBox(Context ctx) {
        LinearLayout box = new LinearLayout(ctx);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setBackground(roundedDrawable(ctx, COLOR_SUBTLE, COLOR_BORDER, 1f, 12f));
        int pad = dp(ctx, 10f);
        box.setPadding(pad, pad, pad, pad);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        lp.setMargins(0, dp(ctx, 6f), 0, dp(ctx, 6f));
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
        pill.setTextSize(10f);
        pill.setTypeface(Typeface.DEFAULT_BOLD);
        pill.setBackground(roundedDrawable(ctx, bgColor, borderColor, 1f, 999f));
        pill.setPadding(dp(ctx, 8f), dp(ctx, 3f), dp(ctx, 8f), dp(ctx, 3f));
        if (testId != null && !testId.isEmpty()) {
            pill.setContentDescription(testId);
        }
        return pill;
    }

    public static TextView createAvatarCircle(Context ctx, String initials, int bgColor, int textColor) {
        TextView avatar = new TextView(ctx);
        avatar.setText(initials);
        avatar.setTextColor(textColor);
        avatar.setTextSize(12.5f);
        avatar.setTypeface(Typeface.DEFAULT_BOLD);
        avatar.setGravity(Gravity.CENTER);
        avatar.setBackground(roundedDrawable(ctx, bgColor, COLOR_BRAND, 1.5f, 999f));
        int size = dp(ctx, 36f);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(size, size);
        lp.setMargins(0, 0, dp(ctx, 9f), 0);
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
        btn.setTextSize(12.5f);
        btn.setTypeface(Typeface.DEFAULT_BOLD);
        btn.setTextColor(textColor);
        btn.setBackground(roundedDrawable(ctx, bgColor, COLOR_BORDER, 0f, 11f));
        btn.setPadding(dp(ctx, 11f), dp(ctx, 8f), dp(ctx, 11f), dp(ctx, 8f));
        btn.setMinimumHeight(dp(ctx, 38f));
        btn.setMinHeight(dp(ctx, 38f));
        if (testId != null && !testId.isEmpty()) {
            btn.setContentDescription(testId);
        }
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        lp.setMargins(0, dp(ctx, 6f), 0, 0);
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
        int pad = dp(ctx, 8f);
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
        val.setTextSize(15f);
        val.setTypeface(Typeface.DEFAULT_BOLD);
        val.setGravity(Gravity.CENTER);
        tile.addView(val);

        TextView lbl = new TextView(ctx);
        lbl.setText(metricLabel);
        lbl.setTextColor(COLOR_TEXT_MUTED);
        lbl.setTextSize(10f);
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
