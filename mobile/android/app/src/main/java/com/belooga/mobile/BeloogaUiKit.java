package com.belooga.mobile;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.LayerDrawable;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;

public final class BeloogaUiKit {
    // Neumorphism (Soft UI) Core Palette (BEL-224 / #194)
    public static final int COLOR_NEUMORPHIC_CANVAS = Color.rgb(224, 229, 236);    // #E0E5EC
    public static final int COLOR_NEUMORPHIC_INSET = Color.rgb(209, 217, 230);     // #D1D9E6
    public static final int COLOR_NEUMORPHIC_HIGHLIGHT = Color.rgb(255, 255, 255); // #FFFFFF
    public static final int COLOR_NEUMORPHIC_SHADOW = Color.rgb(163, 177, 198);    // #A3B1C6

    public static final int COLOR_PAGE = COLOR_NEUMORPHIC_CANVAS;
    public static final int COLOR_NAVDOCK = COLOR_NEUMORPHIC_CANVAS;
    public static final int COLOR_CARD = COLOR_NEUMORPHIC_CANVAS;
    public static final int COLOR_SUBTLE = COLOR_NEUMORPHIC_INSET;
    public static final int COLOR_ELEVATED = COLOR_NEUMORPHIC_INSET;
    public static final int COLOR_BORDER = COLOR_NEUMORPHIC_SHADOW;
    public static final int COLOR_BRAND = Color.rgb(15, 118, 110);                 // #0F766E Soft Extruded Teal
    public static final int COLOR_BRAND_MUTED = Color.argb(36, 15, 118, 110);
    public static final int COLOR_ACCENT_BLUE = Color.rgb(37, 99, 235);
    public static final int COLOR_MOMO_PINK = Color.rgb(216, 45, 139);
    public static final int COLOR_SUCCESS = Color.rgb(15, 118, 110);
    public static final int COLOR_SUCCESS_MUTED = Color.argb(36, 15, 118, 110);
    public static final int COLOR_WARNING = Color.rgb(180, 83, 9);
    public static final int COLOR_WARNING_MUTED = Color.argb(36, 180, 83, 9);
    public static final int COLOR_TEXT_HEADING = Color.rgb(30, 41, 59);            // #1E293B Slate 800
    public static final int COLOR_TEXT_MAIN = Color.rgb(30, 41, 59);               // #1E293B
    public static final int COLOR_TEXT_MUTED = Color.rgb(71, 85, 105);             // #475569 Slate 600
    public static final int COLOR_TEXT_INVERSE = Color.rgb(255, 255, 255);         // #FFFFFF

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

    public static LayerDrawable createNeumorphicExtrudedDrawable(
            Context ctx,
            int fillColor,
            float radiusDp
    ) {
        GradientDrawable shadowLayer = roundedDrawable(ctx, COLOR_NEUMORPHIC_SHADOW, COLOR_NEUMORPHIC_SHADOW, 0f, radiusDp);
        GradientDrawable highlightLayer = roundedDrawable(ctx, COLOR_NEUMORPHIC_HIGHLIGHT, COLOR_NEUMORPHIC_HIGHLIGHT, 0f, radiusDp);
        GradientDrawable surfaceLayer = roundedDrawable(ctx, fillColor, COLOR_NEUMORPHIC_HIGHLIGHT, 0.8f, radiusDp);

        LayerDrawable ld = new LayerDrawable(new Drawable[]{shadowLayer, highlightLayer, surfaceLayer});
        int bevel = dp(ctx, 2f);
        int inner = dp(ctx, 1.5f);
        ld.setLayerInset(0, bevel, bevel, 0, 0);
        ld.setLayerInset(1, 0, 0, bevel, bevel);
        ld.setLayerInset(2, inner, inner, inner, inner);
        return ld;
    }

    public static LayerDrawable createNeumorphicInsetDrawable(Context ctx, float radiusDp) {
        GradientDrawable topShadow = roundedDrawable(ctx, COLOR_NEUMORPHIC_SHADOW, COLOR_NEUMORPHIC_SHADOW, 0f, radiusDp);
        GradientDrawable bottomLight = roundedDrawable(ctx, COLOR_NEUMORPHIC_HIGHLIGHT, COLOR_NEUMORPHIC_HIGHLIGHT, 0f, radiusDp);
        GradientDrawable recessedCore = roundedDrawable(ctx, COLOR_NEUMORPHIC_INSET, COLOR_NEUMORPHIC_SHADOW, 0.6f, radiusDp);

        LayerDrawable ld = new LayerDrawable(new Drawable[]{topShadow, bottomLight, recessedCore});
        int rim = dp(ctx, 1.5f);
        ld.setLayerInset(0, 0, 0, rim, rim);
        ld.setLayerInset(1, rim, rim, 0, 0);
        ld.setLayerInset(2, rim, rim, rim, rim);
        return ld;
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
        LinearLayout.LayoutParams pillLp = new LinearLayout.LayoutParams(dp(ctx, 52f), dp(ctx, 30f));
        iconPill.setLayoutParams(pillLp);

        NavIconView iconView = new NavIconView(ctx, iconType, COLOR_TEXT_MUTED);
        iconView.setLayoutParams(new LinearLayout.LayoutParams(dp(ctx, 22f), dp(ctx, 22f)));
        iconPill.addView(iconView);
        tab.addView(iconPill);
        tab.setMinimumHeight(dp(ctx, 48f));

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
                holder.iconPill.setBackground(createNeumorphicInsetDrawable(ctx, 14f));
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
        bar.setBackground(createNeumorphicInsetDrawable(ctx, 14f));
        int p = dp(ctx, 4f);
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
                seg.setBackground(createNeumorphicExtrudedDrawable(ctx, COLOR_BRAND, 10f));
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
        track.setBackground(createNeumorphicInsetDrawable(ctx, 99f));
        LinearLayout.LayoutParams trackLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dp(ctx, 10f)
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

    public static LinearLayout createNeumorphicCard(Context ctx, String testId) {
        LinearLayout card = new LinearLayout(ctx);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setBackground(createNeumorphicExtrudedDrawable(ctx, COLOR_CARD, 20f));
        card.setElevation(dp(ctx, 6f));
        int pad = dp(ctx, 16f);
        card.setPadding(pad, pad, pad, pad);
        if (testId != null && !testId.isEmpty()) {
            card.setContentDescription(testId);
        }
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        lp.setMargins(0, 0, 0, dp(ctx, 12f));
        card.setLayoutParams(lp);
        return card;
    }

    public static LinearLayout createSurfaceCard(Context ctx, String testId) {
        return createNeumorphicCard(ctx, testId);
    }

    public static LinearLayout createBottomSheetDrawer(Context ctx, String title, String testId) {
        LinearLayout sheet = new LinearLayout(ctx);
        sheet.setOrientation(LinearLayout.VERTICAL);
        sheet.setBackground(createNeumorphicExtrudedDrawable(ctx, COLOR_CARD, 24f));
        sheet.setElevation(dp(ctx, 6f));
        int pad = dp(ctx, 16f);
        sheet.setPadding(pad, dp(ctx, 10f), pad, pad);
        sheet.setContentDescription((testId != null && !testId.isEmpty()) ? testId : "mobile-bottom-sheet-drawer");

        View handle = new View(ctx);
        handle.setBackground(roundedDrawable(ctx, COLOR_BORDER, COLOR_BORDER, 0f, 999f));
        LinearLayout.LayoutParams hLp = new LinearLayout.LayoutParams(dp(ctx, 40f), dp(ctx, 4f));
        hLp.gravity = Gravity.CENTER_HORIZONTAL;
        hLp.setMargins(0, 0, 0, dp(ctx, 8f));
        handle.setLayoutParams(hLp);
        sheet.addView(handle);

        if (title != null && !title.isEmpty()) {
            TextView tv = new TextView(ctx);
            tv.setText(title);
            tv.setTextColor(COLOR_TEXT_HEADING);
            tv.setTextSize(13.5f);
            tv.setTypeface(Typeface.DEFAULT_BOLD);
            sheet.addView(tv);
        }

        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        lp.setMargins(0, 0, 0, dp(ctx, 12f));
        sheet.setLayoutParams(lp);
        return sheet;
    }

    public static LinearLayout createNeumorphicInsetWell(Context ctx) {
        LinearLayout box = new LinearLayout(ctx);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setBackground(createNeumorphicInsetDrawable(ctx, 14f));
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

    public static LinearLayout createSubtleBox(Context ctx) {
        return createNeumorphicInsetWell(ctx);
    }

    public static EditText createNeumorphicInput(Context ctx, String hint, String testId) {
        EditText input = new EditText(ctx);
        input.setHint(hint);
        input.setHintTextColor(COLOR_TEXT_MUTED);
        input.setTextColor(COLOR_TEXT_HEADING);
        input.setTextSize(12.5f);
        input.setSingleLine(true);
        input.setBackground(createNeumorphicInsetDrawable(ctx, 14f));
        int pad = dp(ctx, 10f);
        input.setPadding(pad, pad, pad, pad);
        if (testId != null && !testId.isEmpty()) {
            input.setContentDescription(testId);
        }
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        lp.setMargins(0, dp(ctx, 6f), 0, dp(ctx, 6f));
        input.setLayoutParams(lp);
        return input;
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
        avatar.setBackground(createNeumorphicExtrudedDrawable(ctx, bgColor, 999f));
        int size = dp(ctx, 36f);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(size, size);
        lp.setMargins(0, 0, dp(ctx, 9f), 0);
        avatar.setLayoutParams(lp);
        return avatar;
    }

    public static Button createNeumorphicButton(
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
        btn.setBackground(createNeumorphicExtrudedDrawable(ctx, bgColor, 14f));
        btn.setElevation(dp(ctx, 4f));
        btn.setPadding(dp(ctx, 12f), dp(ctx, 10f), dp(ctx, 12f), dp(ctx, 10f));
        btn.setMinimumHeight(dp(ctx, 48f));
        btn.setMinHeight(dp(ctx, 48f));
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

    public static Button createActionButton(
            Context ctx,
            String label,
            String testId,
            int bgColor,
            int textColor,
            View.OnClickListener listener
    ) {
        return createNeumorphicButton(ctx, label, testId, bgColor, textColor, listener);
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
        tile.setBackground(createNeumorphicInsetDrawable(ctx, 14f));
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

    public static TextView createShortlistFilterChip(
            Context ctx,
            String text,
            boolean active,
            String testId,
            View.OnClickListener listener
    ) {
        TextView chip = new TextView(ctx);
        chip.setText(text);
        chip.setGravity(Gravity.CENTER);
        chip.setTextSize(11f);
        chip.setTypeface(Typeface.DEFAULT_BOLD);
        int fg = active ? COLOR_TEXT_INVERSE : COLOR_BRAND;
        chip.setTextColor(fg);
        chip.setBackground(active
                ? createNeumorphicExtrudedDrawable(ctx, COLOR_BRAND, 999f)
                : createNeumorphicInsetDrawable(ctx, 999f));
        chip.setPadding(dp(ctx, 12f), dp(ctx, 6f), dp(ctx, 12f), dp(ctx, 6f));
        chip.setMinimumHeight(dp(ctx, 44f));
        chip.setMinHeight(dp(ctx, 44f));
        chip.setClickable(true);
        chip.setFocusable(true);
        if (testId != null && !testId.isEmpty()) {
            chip.setContentDescription(testId);
        }
        chip.setOnClickListener(listener);
        return chip;
    }

    public static TextView createBookmarkToggleBtn(
            Context ctx,
            boolean bookmarked,
            String testId,
            View.OnClickListener listener
    ) {
        TextView btn = new TextView(ctx);
        btn.setText(bookmarked ? "Saved" : "Save");
        btn.setGravity(Gravity.CENTER);
        btn.setTextSize(11f);
        btn.setTypeface(Typeface.DEFAULT_BOLD);
        int bg = bookmarked ? COLOR_BRAND : COLOR_CARD;
        int fg = bookmarked ? COLOR_TEXT_INVERSE : COLOR_TEXT_HEADING;
        btn.setTextColor(fg);
        btn.setBackground(createNeumorphicExtrudedDrawable(ctx, bg, 12f));
        int touchSize = dp(ctx, 44f);
        btn.setMinimumWidth(touchSize);
        btn.setMinWidth(touchSize);
        btn.setMinimumHeight(touchSize);
        btn.setMinHeight(touchSize);
        btn.setPadding(dp(ctx, 10f), dp(ctx, 6f), dp(ctx, 10f), dp(ctx, 6f));
        btn.setClickable(true);
        btn.setFocusable(true);
        if (testId != null && !testId.isEmpty()) {
            btn.setContentDescription(testId);
        }
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                touchSize
        );
        lp.setMargins(dp(ctx, 6f), 0, 0, 0);
        btn.setLayoutParams(lp);
        btn.setOnClickListener(listener);
        return btn;
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
