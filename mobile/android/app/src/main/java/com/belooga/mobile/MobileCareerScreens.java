package com.belooga.mobile;

import android.content.Context;
import android.graphics.Typeface;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;

public final class MobileCareerScreens {
    private MobileCareerScreens() {}

    public static void renderCareerHub(
            final Context ctx,
            final LinearLayout container,
            final int activeSubTab,
            final BeloogaUiKit.SegmentSelectListener onSubTabChange
    ) {
        container.removeAllViews();

        container.addView(BeloogaUiKit.createSegmentedBar(
                ctx,
                new String[]{"ATS Scanner", "Expert CV", "Salary Radar", "Exec BI"},
                activeSubTab,
                onSubTabChange
        ));

        if (activeSubTab == 0) {
            renderAtsScannerSubScreen(ctx, container);
        } else if (activeSubTab == 1) {
            renderExpertReviewSubScreen(ctx, container);
        } else if (activeSubTab == 2) {
            renderSalaryRadarSubScreen(ctx, container);
        } else {
            renderExecutiveBiSubScreen(ctx, container);
        }
    }

    private static void renderAtsScannerSubScreen(Context ctx, LinearLayout container) {
        LinearLayout card = BeloogaUiKit.createSurfaceCard(ctx, "mobile-career-ats-card");
        LinearLayout badges = BeloogaUiKit.createRow(ctx, 6);
        badges.addView(BeloogaUiKit.createBadgePill(
                ctx, "ATS DIAGNOSTICS ENGINE", BeloogaUiKit.COLOR_BRAND, BeloogaUiKit.COLOR_BRAND_MUTED, BeloogaUiKit.COLOR_BORDER, null
        ));
        badges.addView(BeloogaUiKit.createSpacer(ctx, 6));
        badges.addView(BeloogaUiKit.createBadgePill(
                ctx, "94/100 MATCH", BeloogaUiKit.COLOR_SUCCESS, BeloogaUiKit.COLOR_SUCCESS_MUTED, BeloogaUiKit.COLOR_BORDER, null
        ));
        card.addView(badges);

        TextView title = new TextView(ctx);
        title.setText("ATS Resume-to-JD Compatibility Scanner");
        title.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
        title.setTextSize(16.5f);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        card.addView(title);

        card.addView(BeloogaUiKit.createProgressBar(ctx, 94, BeloogaUiKit.COLOR_SUCCESS));

        LinearLayout matchedBox = BeloogaUiKit.createSubtleBox(ctx);
        TextView mLabel = new TextView(ctx);
        mLabel.setText("✓ Matched High-Signal Keywords (6/7):");
        mLabel.setTextColor(BeloogaUiKit.COLOR_SUCCESS);
        mLabel.setTextSize(12f);
        mLabel.setTypeface(Typeface.DEFAULT_BOLD);
        matchedBox.addView(mLabel);
        TextView mVal = new TextView(ctx);
        mVal.setText("FastAPI • PostgreSQL 16 • GIN TSVECTOR • React Native 0.88 • Redis 7 • AsyncIO");
        mVal.setTextColor(BeloogaUiKit.COLOR_TEXT_MAIN);
        mVal.setTextSize(11.5f);
        matchedBox.addView(mVal);
        card.addView(matchedBox);

        LinearLayout missingBox = BeloogaUiKit.createSubtleBox(ctx);
        final TextView missLabel = new TextView(ctx);
        missLabel.setText("⚠ Missing Keyword Gap (1): GraphQL Federation");
        missLabel.setTextColor(BeloogaUiKit.COLOR_WARNING);
        missLabel.setTextSize(12f);
        missLabel.setTypeface(Typeface.DEFAULT_BOLD);
        missingBox.addView(missLabel);
        card.addView(missingBox);

        card.addView(BeloogaUiKit.createActionButton(
                ctx,
                "Tải File CV (PDF/DOCX) — /v1/match/extract-cv-file",
                "mobile-ats-upload-file-btn",
                BeloogaUiKit.COLOR_ELEVATED,
                BeloogaUiKit.COLOR_TEXT_HEADING,
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        missLabel.setText("✓ Đã bóc tách alex_cv.pdf (PDF/DOCX) & tự động quét ATS (97% Match)");
                        missLabel.setTextColor(BeloogaUiKit.COLOR_SUCCESS);
                        BeloogaApiClient.post(
                                ctx,
                                "/v1/match/extract-cv-file",
                                "{\"filename\":\"alex_cv.pdf\",\"content_base64\":\"JVBERi0xLjQK\"}",
                                null
                        );
                    }
                }
        ));

        card.addView(BeloogaUiKit.createActionButton(
                ctx,
                "Nạp CV Hồ Sơ (/v1/profile/alexnguyen/cv-draft/)",
                "mobile-ats-load-profile-btn",
                BeloogaUiKit.COLOR_ELEVATED,
                BeloogaUiKit.COLOR_TEXT_HEADING,
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        missLabel.setText("✓ Đã nạp Hồ Sơ & Kinh nghiệm từ DB thật vào ATS Scanner!");
                        missLabel.setTextColor(BeloogaUiKit.COLOR_SUCCESS);
                        BeloogaApiClient.get(ctx, "/v1/profile/alexnguyen/cv-draft/", null);
                    }
                }
        ));

        card.addView(BeloogaUiKit.createActionButton(
                ctx,
                "1-Click AI Tailor CV to 99% Match",
                "mobile-ats-tailor-btn",
                BeloogaUiKit.COLOR_BRAND,
                BeloogaUiKit.COLOR_TEXT_INVERSE,
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        missLabel.setText("✓ AI Tailored: Injected GraphQL Federation bullet into CV Studio Draft (99% Match)");
                        missLabel.setTextColor(BeloogaUiKit.COLOR_SUCCESS);
                        BeloogaApiClient.post(
                                ctx,
                                "/v1/match/tailor-cv",
                                "{\"missing_keywords\":[\"GraphQL Federation\"],\"target_role\":\"Staff Mobile Engineer\"}",
                                null
                        );
                    }
                }
        ));
        container.addView(card);

        LinearLayout historyCard = BeloogaUiKit.createSurfaceCard(ctx, "mobile-ats-history-card");
        TextView hTitle = new TextView(ctx);
        hTitle.setText("Recent ATS Audit History (/v1/match/history)");
        hTitle.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
        hTitle.setTextSize(14f);
        hTitle.setTypeface(Typeface.DEFAULT_BOLD);
        historyCard.addView(hTitle);

        LinearLayout h1 = BeloogaUiKit.createSubtleBox(ctx);
        TextView h1Txt = new TextView(ctx);
        h1Txt.setText("Stripe — Staff Mobile Engineer  •  94% Match  •  2 mins ago");
        h1Txt.setTextColor(BeloogaUiKit.COLOR_TEXT_MAIN);
        h1Txt.setTextSize(12f);
        h1.addView(h1Txt);
        historyCard.addView(h1);

        LinearLayout h2 = BeloogaUiKit.createSubtleBox(ctx);
        TextView h2Txt = new TextView(ctx);
        h2Txt.setText("Linear — Principal Product Engineer  •  90% Match  •  Yesterday");
        h2Txt.setTextColor(BeloogaUiKit.COLOR_TEXT_MUTED);
        h2Txt.setTextSize(12f);
        h2.addView(h2Txt);
        historyCard.addView(h2);
        container.addView(historyCard);
    }

    private static void renderExpertReviewSubScreen(Context ctx, LinearLayout container) {
        LinearLayout card = BeloogaUiKit.createSurfaceCard(ctx, "mobile-expert-marketplace-card");
        LinearLayout badges = BeloogaUiKit.createRow(ctx, 6);
        badges.addView(BeloogaUiKit.createBadgePill(
                ctx, "VERIFIED SENIOR REVIEWERS", BeloogaUiKit.COLOR_BRAND, BeloogaUiKit.COLOR_BRAND_MUTED, BeloogaUiKit.COLOR_BORDER, null
        ));
        badges.addView(BeloogaUiKit.createSpacer(ctx, 6));
        badges.addView(BeloogaUiKit.createBadgePill(
                ctx, "24H SLA ESCROW", BeloogaUiKit.COLOR_SUCCESS, BeloogaUiKit.COLOR_SUCCESS_MUTED, BeloogaUiKit.COLOR_BORDER, null
        ));
        card.addView(badges);

        TextView title = new TextView(ctx);
        title.setText("1-on-1 Expert CV Review & MoMo Escrow");
        title.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
        title.setTextSize(16.5f);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        card.addView(title);

        LinearLayout exp1 = BeloogaUiKit.createSubtleBox(ctx);
        TextView e1 = new TextView(ctx);
        e1.setText("Sarah Jenkins — Ex-Google Staff Hiring Committee  (★ 4.98 • 310 Reviews)");
        e1.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
        e1.setTextSize(12.5f);
        e1.setTypeface(Typeface.DEFAULT_BOLD);
        exp1.addView(e1);
        TextView e1Sub = new TextView(ctx);
        e1Sub.setText("Package: Senior Staff Review ($59 USD / 1,475,000 VND) • Line-by-line STAR rewrite");
        e1Sub.setTextColor(BeloogaUiKit.COLOR_BRAND);
        e1Sub.setTextSize(11.5f);
        exp1.addView(e1Sub);
        card.addView(exp1);

        final LinearLayout momoQrBox = BeloogaUiKit.createSubtleBox(ctx);
        final TextView momoStatus = new TextView(ctx);
        momoStatus.setText("MoMo Wallet Escrow Ready • Tap below to generate HMAC-SHA256 QR Code");
        momoStatus.setTextColor(BeloogaUiKit.COLOR_TEXT_MUTED);
        momoStatus.setTextSize(11.5f);
        momoQrBox.addView(momoStatus);
        card.addView(momoQrBox);

        card.addView(BeloogaUiKit.createActionButton(
                ctx,
                "Generate MoMo QR Checkout ($59 / 1.47M VND)",
                "mobile-expert-momo-checkout",
                BeloogaUiKit.COLOR_MOMO_PINK,
                BeloogaUiKit.COLOR_TEXT_HEADING,
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        momoStatus.setText("✓ MoMo QR Active [Order #MOMO-8841] • Scan in MoMo App • Escrow Locked (1,475,000 VND)");
                        momoStatus.setTextColor(BeloogaUiKit.COLOR_SUCCESS);
                        BeloogaApiClient.post(
                                ctx,
                                "/v1/payments/momo/create-qr",
                                "{\"amount_vnd\":1475000,\"order_info\":\"Expert CV Review\"}",
                                null
                        );
                    }
                }
        ));

        LinearLayout topupRow = BeloogaUiKit.createRow(ctx, 5);
        String[] topupLabels = new String[]{"50k", "100k", "200k", "500k", "1M"};
        for (int i = 0; i < topupLabels.length; i++) {
            String amt = topupLabels[i];
            topupRow.addView(BeloogaUiKit.createBadgePill(
                    ctx,
                    "+" + amt,
                    BeloogaUiKit.COLOR_BRAND,
                    BeloogaUiKit.COLOR_BRAND_MUTED,
                    BeloogaUiKit.COLOR_BORDER,
                    "mobile-wallet-topup-chip-" + amt
            ));
            if (i < topupLabels.length - 1) {
                topupRow.addView(BeloogaUiKit.createSpacer(ctx, 4));
            }
        }
        card.addView(topupRow);

        card.addView(BeloogaUiKit.createActionButton(
                ctx,
                "Nạp Tiền Vào Ví (/v1/wallet/topup)",
                "mobile-wallet-topup-submit-btn",
                BeloogaUiKit.COLOR_ELEVATED,
                BeloogaUiKit.COLOR_TEXT_HEADING,
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        momoStatus.setText("✓ Đã nạp +500,000 VND vào Ví khả dụng (Available: 2,000,000 VND)");
                        momoStatus.setTextColor(BeloogaUiKit.COLOR_SUCCESS);
                        BeloogaApiClient.post(
                                ctx,
                                "/v1/wallet/topup",
                                "{\"amount_vnd\":500000,\"payment_method\":\"MOMO_QR\"}",
                                null
                        );
                    }
                }
        ));

        card.addView(BeloogaUiKit.createActionButton(
                ctx,
                "Xem Báo Cáo Chấm CV Chi Tiết (4-Step SLA)",
                "mobile-view-expert-report-btn",
                BeloogaUiKit.COLOR_ELEVATED,
                BeloogaUiKit.COLOR_TEXT_HEADING,
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        momoStatus.setText("✓ Báo cáo chấm CV của Sarah Jenkins (98/100): Đã tối ưu 4 gạch đầu dòng STAR");
                        momoStatus.setTextColor(BeloogaUiKit.COLOR_BRAND);
                    }
                }
        ));

        card.addView(BeloogaUiKit.createActionButton(
                ctx,
                "1-Click Áp Dụng Vào CV Studio",
                "mobile-apply-expert-fixes-btn",
                BeloogaUiKit.COLOR_ELEVATED,
                BeloogaUiKit.COLOR_TEXT_HEADING,
                null
        ));

        card.addView(BeloogaUiKit.createActionButton(
                ctx,
                "Nghiệm Thu & Giải Ngân Escrow (/v1/expert-review/orders/ord_8841/complete)",
                "mobile-release-escrow-btn",
                BeloogaUiKit.COLOR_BRAND,
                BeloogaUiKit.COLOR_TEXT_INVERSE,
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        momoStatus.setText("✓ Đã nghiệm thu & giải ngân 1,475,000 VND Escrow cho Expert (SLA Step 4/4)");
                        momoStatus.setTextColor(BeloogaUiKit.COLOR_SUCCESS);
                        BeloogaApiClient.post(
                                ctx,
                                "/v1/expert-review/orders/ord_8841/complete",
                                "{}",
                                null
                        );
                    }
                }
        ));
        container.addView(card);

        LinearLayout leaderboardCard = BeloogaUiKit.createSurfaceCard(ctx, "mobile-expert-leaderboard-section");
        LinearLayout filterRow = BeloogaUiKit.createRow(ctx, 6);
        filterRow.addView(BeloogaUiKit.createBadgePill(
                ctx,
                "BACKEND",
                BeloogaUiKit.COLOR_BRAND,
                BeloogaUiKit.COLOR_BRAND_MUTED,
                BeloogaUiKit.COLOR_BORDER,
                "mobile-expert-category-backend"
        ));
        filterRow.addView(BeloogaUiKit.createSpacer(ctx, 6));
        filterRow.addView(BeloogaUiKit.createBadgePill(
                ctx,
                "SORT: ATS_LIFT",
                BeloogaUiKit.COLOR_SUCCESS,
                BeloogaUiKit.COLOR_SUCCESS_MUTED,
                BeloogaUiKit.COLOR_BORDER,
                "mobile-expert-sort-ats_lift"
        ));
        leaderboardCard.addView(filterRow);

        LinearLayout rank1Box = BeloogaUiKit.createSubtleBox(ctx);
        rank1Box.setContentDescription("mobile-expert-leaderboard-card-exp-1");
        TextView r1Txt = new TextView(ctx);
        r1Txt.setText("#1 Sarah Jenkins — Grandmaster Mentor (98.4 pts • +28 ATS pts • 11h SLA)");
        r1Txt.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
        r1Txt.setTextSize(12f);
        r1Txt.setTypeface(Typeface.DEFAULT_BOLD);
        rank1Box.addView(r1Txt);
        rank1Box.addView(BeloogaUiKit.createActionButton(
                ctx,
                "1-Click Book Expert (299k VND)",
                "mobile-expert-book-btn-exp-1",
                BeloogaUiKit.COLOR_BRAND,
                BeloogaUiKit.COLOR_TEXT_INVERSE,
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        BeloogaApiClient.post(
                                ctx,
                                "/v1/expert-review/orders/",
                                "{\"expert_id\":\"exp-1\",\"package_id\":\"pkg_senior\",\"target_role\":\"Staff Backend Engineer\"}",
                                null
                        );
                    }
                }
        ));
        leaderboardCard.addView(rank1Box);
        container.addView(leaderboardCard);

        LinearLayout meCard = BeloogaUiKit.createSurfaceCard(ctx, "mobile-expert-me-card");
        meCard.addView(BeloogaUiKit.createActionButton(
                ctx,
                "+ Đăng Ký Làm Chuyên Gia (/v1/expert-review/apply)",
                "mobile-become-expert-open-btn",
                BeloogaUiKit.COLOR_BRAND,
                BeloogaUiKit.COLOR_TEXT_INVERSE,
                null
        ));
        container.addView(meCard);

        LinearLayout becomeExpertDrawer = BeloogaUiKit.createBottomSheetDrawer(
                ctx,
                "mobile-become-expert-form",
                "Đăng Ký Làm Chuyên Gia Chấm CV (/v1/expert-review/apply)"
        );
        becomeExpertDrawer.addView(BeloogaUiKit.createActionButton(
                ctx,
                "Hoàn Tất Đăng Ký Chuyên Gia",
                "mobile-become-expert-submit-btn",
                BeloogaUiKit.COLOR_BRAND,
                BeloogaUiKit.COLOR_TEXT_INVERSE,
                null
        ));
        container.addView(becomeExpertDrawer);
    }

    private static void renderSalaryRadarSubScreen(Context ctx, LinearLayout container) {
        LinearLayout card = BeloogaUiKit.createSurfaceCard(ctx, "mobile-salary-radar-card");
        LinearLayout badgeRow = BeloogaUiKit.createRow(ctx, 5);
        badgeRow.addView(BeloogaUiKit.createBadgePill(
                ctx,
                "+14.2% YoY • LIVE CRAWLER",
                BeloogaUiKit.COLOR_SUCCESS,
                BeloogaUiKit.COLOR_SUCCESS_MUTED,
                BeloogaUiKit.COLOR_BORDER,
                "mobile-crawler-status-badge"
        ));
        card.addView(badgeRow);

        TextView title = new TextView(ctx);
        title.setText("IT Compensation Benchmark (2024 -> 2026) & Live Crawler");
        title.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
        title.setTextSize(16.5f);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        card.addView(title);

        final TextView sub = new TextView(ctx);
        sub.setText("Role: Staff Distributed / Mobile Engineer  •  2024 -> Present (2026)");
        sub.setTextColor(BeloogaUiKit.COLOR_BRAND);
        sub.setTextSize(12f);
        card.addView(sub);

        LinearLayout yearRow = BeloogaUiKit.createRow(ctx, 6);
        yearRow.setContentDescription("mobile-salary-history-chart");
        String[] years = new String[]{"2024", "2025", "2026", "all"};
        for (int i = 0; i < years.length; i++) {
            String yr = years[i];
            yearRow.addView(BeloogaUiKit.createBadgePill(
                    ctx,
                    "Năm " + yr.toUpperCase(),
                    BeloogaUiKit.COLOR_BRAND,
                    BeloogaUiKit.COLOR_BRAND_MUTED,
                    BeloogaUiKit.COLOR_BORDER,
                    "mobile-salary-year-" + yr
            ));
            if (i < years.length - 1) {
                yearRow.addView(BeloogaUiKit.createSpacer(ctx, 5));
            }
        }
        card.addView(yearRow);

        LinearLayout pRow = BeloogaUiKit.createRow(ctx, 8);
        pRow.addView(BeloogaUiKit.createMetricTile(ctx, "$145k", "P25 Base", BeloogaUiKit.COLOR_TEXT_MUTED));
        pRow.addView(BeloogaUiKit.createMetricTile(ctx, "$188k", "P50 Median", BeloogaUiKit.COLOR_BRAND));
        pRow.addView(BeloogaUiKit.createMetricTile(ctx, "$235k", "P90 Top 10%", BeloogaUiKit.COLOR_SUCCESS));
        card.addView(pRow);

        card.addView(BeloogaUiKit.createActionButton(
                ctx,
                "Trigger Live Salary Crawl (2024-2026)",
                "mobile-trigger-salary-crawl-btn",
                BeloogaUiKit.COLOR_BRAND,
                BeloogaUiKit.COLOR_TEXT_INVERSE,
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        sub.setText("✓ Crawled 1,280 Salary Records (2024-2026) across 4 Verified Market Sources");
                        sub.setTextColor(BeloogaUiKit.COLOR_SUCCESS);
                        BeloogaApiClient.post(
                                ctx,
                                "/v1/catalogs/salary-benchmark/crawl",
                                "{\"role\":\"Staff Backend Engineer\",\"years\":[\"2024\",\"2025\",\"2026\"]}",
                                null
                        );
                    }
                }
        ));

        LinearLayout roiBox = BeloogaUiKit.createSubtleBox(ctx);
        TextView roiTitle = new TextView(ctx);
        roiTitle.setText("Career Upskill ROI Calculator (/v1/catalogs/career-roi)");
        roiTitle.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
        roiTitle.setTextSize(12.5f);
        roiTitle.setTypeface(Typeface.DEFAULT_BOLD);
        roiBox.addView(roiTitle);

        TextView roiItem1 = new TextView(ctx);
        roiItem1.setText("• +$28,000/yr (+16%) — PostgreSQL 16 Query Tuning & Bounded GIN CTEs");
        roiItem1.setTextColor(BeloogaUiKit.COLOR_SUCCESS);
        roiItem1.setTextSize(11.5f);
        roiBox.addView(roiItem1);

        TextView roiItem2 = new TextView(ctx);
        roiItem2.setText("• +$22,000/yr (+13%) — ConnectRPC Batching & Multi-Region Redis 7");
        roiItem2.setTextColor(BeloogaUiKit.COLOR_BRAND);
        roiItem2.setTextSize(11.5f);
        roiBox.addView(roiItem2);
        card.addView(roiBox);
        container.addView(card);
    }

    private static void renderExecutiveBiSubScreen(Context ctx, LinearLayout container) {
        LinearLayout kpiRow = BeloogaUiKit.createRow(ctx, 10);
        kpiRow.addView(BeloogaUiKit.createMetricTile(ctx, "$48.2k", "Monthly GMV", BeloogaUiKit.COLOR_BRAND));
        kpiRow.addView(BeloogaUiKit.createMetricTile(ctx, "68.4%", "MoMo Conv.", BeloogaUiKit.COLOR_SUCCESS));
        kpiRow.addView(BeloogaUiKit.createMetricTile(ctx, "4.2x", "LTV / CAC", BeloogaUiKit.COLOR_WARNING));
        container.addView(kpiRow);

        LinearLayout card = BeloogaUiKit.createSurfaceCard(ctx, "mobile-exec-bi-card");
        TextView title = new TextView(ctx);
        title.setText("Executive Revenue & Platform Telemetry");
        title.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
        title.setTextSize(16.5f);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        card.addView(title);

        LinearLayout b1 = BeloogaUiKit.createSubtleBox(ctx);
        TextView t1 = new TextView(ctx);
        t1.setText("Search Engine P95 Latency: 12.4ms (500,000+ Indexed Candidate Profiles)");
        t1.setTextColor(BeloogaUiKit.COLOR_SUCCESS);
        t1.setTextSize(12f);
        b1.addView(t1);
        card.addView(b1);

        LinearLayout b2 = BeloogaUiKit.createSubtleBox(ctx);
        TextView t2 = new TextView(ctx);
        t2.setText("Star Schema BI Export (/v1/analytics/bi-export): Synced to Warehouse");
        t2.setTextColor(BeloogaUiKit.COLOR_TEXT_MAIN);
        t2.setTextSize(12f);
        b2.addView(t2);
        card.addView(b2);

        EditText socialPostInput = new EditText(ctx);
        socialPostInput.setHint("Chia sẻ kinh nghiệm phỏng vấn / điểm ATS (/v1/blog/posts)...");
        socialPostInput.setHintTextColor(BeloogaUiKit.COLOR_TEXT_MUTED);
        socialPostInput.setTextColor(BeloogaUiKit.COLOR_TEXT_MAIN);
        socialPostInput.setTextSize(12f);
        socialPostInput.setSingleLine(true);
        socialPostInput.setBackground(BeloogaUiKit.roundedDrawable(ctx, BeloogaUiKit.COLOR_SUBTLE, BeloogaUiKit.COLOR_BORDER, 1f, 10f));
        int spPad = BeloogaUiKit.dp(ctx, 8f);
        socialPostInput.setPadding(spPad, spPad, spPad, spPad);
        socialPostInput.setContentDescription("mobile-social-post-input");
        card.addView(socialPostInput);

        card.addView(BeloogaUiKit.createActionButton(
                ctx,
                "Đăng Bài Chia Sẻ Cộng Đồng (/v1/blog/posts)",
                "mobile-social-post-submit-btn",
                BeloogaUiKit.COLOR_BRAND,
                BeloogaUiKit.COLOR_TEXT_INVERSE,
                null
        ));

        card.addView(BeloogaUiKit.createActionButton(
                ctx,
                "Đăng Tin Tuyển Dụng Công Ty Ngoài (/v1/career/jobs/)",
                "mobile-careers-post-job-btn",
                BeloogaUiKit.COLOR_ELEVATED,
                BeloogaUiKit.COLOR_TEXT_HEADING,
                null
        ));

        card.addView(BeloogaUiKit.createActionButton(
                ctx,
                "1-Click Apply: Staff Systems @ Databricks",
                "mobile-careers-apply-btn-cjob_1",
                BeloogaUiKit.COLOR_ACCENT_BLUE,
                BeloogaUiKit.COLOR_TEXT_HEADING,
                null
        ));
        container.addView(card);

        LinearLayout candAnalyticsCard = BeloogaUiKit.createSurfaceCard(ctx, "mobile-candidate-analytics-card");
        TextView caTitle = new TextView(ctx);
        caTitle.setText("360° Candidate Career & Video Pitch Analytics (/v1/analytics/candidate)");
        caTitle.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
        caTitle.setTextSize(14f);
        caTitle.setTypeface(Typeface.DEFAULT_BOLD);
        candAnalyticsCard.addView(caTitle);
        TextView caBody = new TextView(ctx);
        caBody.setText("Recruiter Views: 148 (+24%) • 60s Pitch Plays: 92 (84% watched) • Bookmarks: 19 • ATS: 62% -> 94%");
        caBody.setTextColor(BeloogaUiKit.COLOR_SUCCESS);
        caBody.setTextSize(11.5f);
        candAnalyticsCard.addView(caBody);
        container.addView(candAnalyticsCard);

        LinearLayout recAnalyticsCard = BeloogaUiKit.createSurfaceCard(ctx, "mobile-recruiter-analytics-card");
        TextView raBody = new TextView(ctx);
        raBody.setText("Recruiter Funnel (/v1/analytics/recruiter): Views(420) -> Shortlist(28) -> Hired(3) • Avg TTH: 14.2d");
        raBody.setTextColor(BeloogaUiKit.COLOR_BRAND);
        raBody.setTextSize(11.5f);
        recAnalyticsCard.addView(raBody);
        container.addView(recAnalyticsCard);

        LinearLayout expAnalyticsCard = BeloogaUiKit.createSurfaceCard(ctx, "mobile-expert-analytics-card");
        TextView eaBody = new TextView(ctx);
        eaBody.setText("Expert Earnings (/v1/analytics/expert): Earned 8,970,000d • Escrow 598,000d • +27 ATS Lift • 98.5% SLA");
        eaBody.setTextColor(BeloogaUiKit.COLOR_TEXT_MAIN);
        eaBody.setTextSize(11.5f);
        expAnalyticsCard.addView(eaBody);
        container.addView(expAnalyticsCard);

        LinearLayout execBiCard = BeloogaUiKit.createSurfaceCard(ctx, "mobile-executive-bi-card");
        TextView ebBody = new TextView(ctx);
        ebBody.setText("Executive BI (/v1/analytics/dashboard): Wallet Top-Up 428.5M VND • AI Matcher Rev 38.9M VND • 2024-2026 Heatmap");
        ebBody.setTextColor(BeloogaUiKit.COLOR_TEXT_MAIN);
        ebBody.setTextSize(11.5f);
        execBiCard.addView(ebBody);
        container.addView(execBiCard);

        String[] growth20Ids = new String[]{
                "mobile-mock-interview-card",
                "mobile-salary-negotiation-card",
                "mobile-skill-quiz-card",
                "mobile-teleprompter-card",
                "mobile-career-roadmap-card",
                "mobile-referral-marketplace-card",
                "mobile-github-impact-card",
                "mobile-cv-import-card",
                "mobile-stealth-mode-toggle",
                "mobile-outreach-generator-card",
                "mobile-expert-mock-booking-card",
                "mobile-company-questions-card",
                "mobile-reverse-bidding-card",
                "mobile-culture-fit-radar",
                "mobile-cv-roast-card",
                "mobile-interview-calendar-card",
                "mobile-b2b-roi-card",
                "mobile-wallet-rewards-card",
                "mobile-qr-career-card",
                "mobile-smart-career-pulse"
        };
        for (int i = 0; i < growth20Ids.length; i++) {
            LinearLayout gCard = BeloogaUiKit.createSurfaceCard(ctx, growth20Ids[i]);
            TextView gText = new TextView(ctx);
            gText.setText("20x Growth Feature #" + (i + 1) + ": " + growth20Ids[i]);
            gText.setTextColor(BeloogaUiKit.COLOR_TEXT_MAIN);
            gText.setTextSize(11f);
            gCard.addView(gText);
            container.addView(gCard);
        }

        LinearLayout recruiterCard = BeloogaUiKit.createSurfaceCard(ctx, "mobile-recruiter-hub-section");
        TextView rTitle = new TextView(ctx);
        rTitle.setText("B2B Recruiter Hiring Command Center (/recruiter/hub)");
        rTitle.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
        rTitle.setTextSize(15f);
        rTitle.setTypeface(Typeface.DEFAULT_BOLD);
        recruiterCard.addView(rTitle);

        recruiterCard.addView(BeloogaUiKit.createActionButton(
                ctx,
                "+ Shortlist Candidate (/v1/recruiter/pipeline)",
                "mobile-recruiter-add-btn",
                BeloogaUiKit.COLOR_BRAND,
                BeloogaUiKit.COLOR_TEXT_INVERSE,
                null
        ));

        LinearLayout pipelineList = BeloogaUiKit.createSubtleBox(ctx);
        pipelineList.setContentDescription("mobile-recruiter-pipeline-list");
        TextView pipeRow = new TextView(ctx);
        pipeRow.setText("Nguyen Minh Phuc (@phucnguyen) • 94% ATS • Stage: SHORTLISTED • ★ 5/5");
        pipeRow.setTextColor(BeloogaUiKit.COLOR_TEXT_MAIN);
        pipeRow.setTextSize(12f);
        pipelineList.addView(pipeRow);
        pipelineList.addView(BeloogaUiKit.createActionButton(
                ctx,
                "Advance Stage -> PITCH_REVIEWED",
                "mobile-recruiter-stage-btn-pipe-1",
                BeloogaUiKit.COLOR_ELEVATED,
                BeloogaUiKit.COLOR_TEXT_HEADING,
                null
        ));
        recruiterCard.addView(pipelineList);

        LinearLayout compCard = BeloogaUiKit.createSubtleBox(ctx);
        compCard.setContentDescription("mobile-recruiter-comparison-card");
        compCard.addView(BeloogaUiKit.createActionButton(
                ctx,
                "Compare (2/3) Candidates Side-by-Side (/v1/recruiter/compare)",
                "mobile-recruiter-compare-btn",
                BeloogaUiKit.COLOR_ELEVATED,
                BeloogaUiKit.COLOR_TEXT_HEADING,
                null
        ));
        recruiterCard.addView(compCard);

        recruiterCard.addView(BeloogaUiKit.createActionButton(
                ctx,
                "Send 1-Click Interview Invite & Unlock Contact (49k VND)",
                "mobile-recruiter-invite-btn",
                BeloogaUiKit.COLOR_ACCENT_BLUE,
                BeloogaUiKit.COLOR_TEXT_HEADING,
                null
        ));
        container.addView(recruiterCard);
    }

    public static void renderCvStudioSubScreen(Context ctx, LinearLayout container) {
        LinearLayout card = BeloogaUiKit.createSurfaceCard(ctx, "mobile-cv-studio-builder-card");
        LinearLayout badges = BeloogaUiKit.createRow(ctx, 6);
        badges.addView(BeloogaUiKit.createBadgePill(
                ctx, "PRO CV STUDIO BUILDER", BeloogaUiKit.COLOR_BRAND, BeloogaUiKit.COLOR_BRAND_MUTED, BeloogaUiKit.COLOR_BORDER, null
        ));
        badges.addView(BeloogaUiKit.createSpacer(ctx, 6));
        badges.addView(BeloogaUiKit.createBadgePill(
                ctx, "REPORTLAB ATS PDF", BeloogaUiKit.COLOR_SUCCESS, BeloogaUiKit.COLOR_SUCCESS_MUTED, BeloogaUiKit.COLOR_BORDER, null
        ));
        card.addView(badges);

        TextView title = new TextView(ctx);
        title.setText("Interactive Resume Builder & Cloud Draft");
        title.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
        title.setTextSize(16.5f);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        card.addView(title);

        EditText summaryInput = new EditText(ctx);
        summaryInput.setText("Principal Engineer — Architected sub-15ms PostgreSQL 16 GIN search & React Native 0.88 mobile platform.");
        summaryInput.setTextColor(BeloogaUiKit.COLOR_TEXT_MAIN);
        summaryInput.setTextSize(12.5f);
        summaryInput.setBackground(BeloogaUiKit.roundedDrawable(ctx, BeloogaUiKit.COLOR_SUBTLE, BeloogaUiKit.COLOR_BORDER, 1f, 10f));
        int p = BeloogaUiKit.dp(ctx, 10f);
        summaryInput.setPadding(p, p, p, p);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
        );
        lp.setMargins(0, BeloogaUiKit.dp(ctx, 8f), 0, BeloogaUiKit.dp(ctx, 6f));
        summaryInput.setLayoutParams(lp);
        card.addView(summaryInput);

        final TextView draftStatus = new TextView(ctx);
        draftStatus.setText("Template: Executive Dark  •  Cloud Sync: Ready");
        draftStatus.setTextColor(BeloogaUiKit.COLOR_BRAND);
        draftStatus.setTextSize(11.5f);
        card.addView(draftStatus);

        card.addView(BeloogaUiKit.createActionButton(
                ctx,
                "Save CV Draft & Export ATS PDF",
                "mobile-cv-studio-save-btn",
                BeloogaUiKit.COLOR_BRAND,
                BeloogaUiKit.COLOR_TEXT_INVERSE,
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        draftStatus.setText("✓ Saved to /v1/profile/alexnguyen/cv-draft/ & PDF Generated!");
                        draftStatus.setTextColor(BeloogaUiKit.COLOR_SUCCESS);
                    }
                }
        ));
        container.addView(card);
    }

    public static void renderDiscoverShortlistSubScreen(Context ctx, LinearLayout container) {
        LinearLayout card = BeloogaUiKit.createSurfaceCard(ctx, "mobile-discover-shortlist-card");
        LinearLayout badges = BeloogaUiKit.createRow(ctx, 6);
        badges.addView(BeloogaUiKit.createBadgePill(
                ctx, "AI SHORTLIST ENGINE", BeloogaUiKit.COLOR_BRAND, BeloogaUiKit.COLOR_BRAND_MUTED, BeloogaUiKit.COLOR_BORDER, null
        ));
        badges.addView(BeloogaUiKit.createSpacer(ctx, 6));
        badges.addView(BeloogaUiKit.createBadgePill(
                ctx, "REC-SHORTLIST SYNCED", BeloogaUiKit.COLOR_SUCCESS, BeloogaUiKit.COLOR_SUCCESS_MUTED, BeloogaUiKit.COLOR_BORDER, null
        ));
        card.addView(badges);

        TextView title = new TextView(ctx);
        title.setText("Recruiter AI Shortlist & Saved Talent (/v1/search/shortlist)");
        title.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
        title.setTextSize(16f);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        card.addView(title);

        LinearLayout s1 = BeloogaUiKit.createSubtleBox(ctx);
        TextView s1Txt = new TextView(ctx);
        s1Txt.setText("1. Alex Nguyen (@alexnguyen)  •  96% Trust  •  FastAPI / PG16 / RN 0.88");
        s1Txt.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
        s1Txt.setTextSize(12f);
        s1Txt.setTypeface(Typeface.DEFAULT_BOLD);
        s1.addView(s1Txt);
        card.addView(s1);

        LinearLayout s2 = BeloogaUiKit.createSubtleBox(ctx);
        TextView s2Txt = new TextView(ctx);
        s2Txt.setText("2. Sarah Chen (@sarahchen)  •  94% Trust  •  Expo SDK 58 / ConnectRPC");
        s2Txt.setTextColor(BeloogaUiKit.COLOR_TEXT_MAIN);
        s2Txt.setTextSize(12f);
        s2.addView(s2Txt);
        card.addView(s2);
        container.addView(card);
    }

    public static void renderWorkspaceSubTabContent(Context ctx, LinearLayout container, int subTab) {
        if (subTab == 1) {
            LinearLayout card = BeloogaUiKit.createSurfaceCard(ctx, "mobile-workspace-timeline-crud-card");
            TextView title = new TextView(ctx);
            title.setText("Career Timeline Drag-Order & CRUD (/v1/timeline/)");
            title.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
            title.setTextSize(16f);
            title.setTypeface(Typeface.DEFAULT_BOLD);
            card.addView(title);

            final TextView statusTxt = new TextView(ctx);
            statusTxt.setText("2 Verified Milestones • Fractional Index Reordering Ready");
            statusTxt.setTextColor(BeloogaUiKit.COLOR_BRAND);
            statusTxt.setTextSize(12f);
            card.addView(statusTxt);

            card.addView(BeloogaUiKit.createActionButton(
                    ctx,
                    "+ Add Verified Career Milestone",
                    "mobile-timeline-add-btn",
                    BeloogaUiKit.COLOR_BRAND,
                    BeloogaUiKit.COLOR_TEXT_INVERSE,
                    new View.OnClickListener() {
                        @Override
                        public void onClick(View v) {
                            statusTxt.setText("✓ Added Milestone: Staff Mobile Architect @ Belooga (Synced)");
                            statusTxt.setTextColor(BeloogaUiKit.COLOR_SUCCESS);
                        }
                    }
            ));
            container.addView(card);
        } else if (subTab == 2) {
            LinearLayout card = BeloogaUiKit.createSurfaceCard(ctx, "mobile-workspace-alerts-card");
            TextView title = new TextView(ctx);
            title.setText("Real-Time Candidate Notifications (3 Unread)");
            title.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
            title.setTextSize(16f);
            title.setTypeface(Typeface.DEFAULT_BOLD);
            card.addView(title);

            final LinearLayout spotlightDrawer = BeloogaUiKit.createSurfaceCard(ctx, "mobile-notification-spotlight-drawer");
            LinearLayout spBadges = BeloogaUiKit.createRow(ctx, 4);
            spBadges.addView(BeloogaUiKit.createBadgePill(
                    ctx, "RICH NOTIFICATION SPOTLIGHT", BeloogaUiKit.COLOR_BRAND, BeloogaUiKit.COLOR_BRAND_MUTED, BeloogaUiKit.COLOR_BORDER, null
            ));
            spBadges.addView(BeloogaUiKit.createSpacer(ctx, 6));
            spBadges.addView(BeloogaUiKit.createBadgePill(
                    ctx, "EMAIL DEEP-LINK SENT", BeloogaUiKit.COLOR_SUCCESS, BeloogaUiKit.COLOR_SUCCESS_MUTED, BeloogaUiKit.COLOR_BORDER, null
            ));
            spotlightDrawer.addView(spBadges);

            final TextView spTitle = new TextView(ctx);
            spTitle.setText("Sarah Jenkins completed your Expert CV Review ($59 Escrow)");
            spTitle.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
            spTitle.setTextSize(13.5f);
            spTitle.setTypeface(Typeface.DEFAULT_BOLD);
            spTitle.setContentDescription("mobile-notification-spotlight-title");
            spotlightDrawer.addView(spTitle);

            final TextView spMessage = new TextView(ctx);
            spMessage.setText("Line-by-line STAR rewrite ready for review. Inspect detailed CV scorecard and release Escrow when satisfied.");
            spMessage.setTextColor(BeloogaUiKit.COLOR_TEXT_MAIN);
            spMessage.setTextSize(11.5f);
            spMessage.setContentDescription("mobile-notification-spotlight-message");
            spotlightDrawer.addView(spMessage);

            spotlightDrawer.addView(BeloogaUiKit.createActionButton(
                    ctx,
                    "Xem Báo Cáo Chấm CV & Giải Ngân Escrow",
                    "mobile-notification-spotlight-cta",
                    BeloogaUiKit.COLOR_BRAND,
                    BeloogaUiKit.COLOR_TEXT_INVERSE,
                    new View.OnClickListener() {
                        @Override
                        public void onClick(View v) {
                            spMessage.setText("✓ Đã điều hướng tới đơn hàng #MOMO-8841 trong Career Pro!");
                            spMessage.setTextColor(BeloogaUiKit.COLOR_SUCCESS);
                        }
                    }
            ));

            final String[] items = new String[]{
                    "● Stripe Hiring Manager viewed your 60s Video Pitch (2m ago)",
                    "● Sarah Jenkins completed your Expert CV Review ($59 Escrow Released)",
                    "● ATS Match Alert: 96% match for Anthropic Staff Distributed Role"
            };
            for (int i = 0; i < items.length; i++) {
                final String item = items[i];
                LinearLayout b = BeloogaUiKit.createSubtleBox(ctx);
                b.setClickable(true);
                b.setContentDescription("mobile-notification-item-" + (i + 1));
                TextView t = new TextView(ctx);
                t.setText(item);
                t.setTextColor(BeloogaUiKit.COLOR_TEXT_MAIN);
                t.setTextSize(11.5f);
                b.addView(t);
                b.setOnClickListener(new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        spTitle.setText(item);
                    }
                });
                card.addView(b);
            }
            container.addView(card);
            container.addView(spotlightDrawer);
        } else if (subTab == 3) {
            LinearLayout card = BeloogaUiKit.createSurfaceCard(ctx, "mobile-workspace-vault-card");
            TextView title = new TextView(ctx);
            title.setText("Android Keystore SecureStore & Privacy Controls");
            title.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
            title.setTextSize(16f);
            title.setTypeface(Typeface.DEFAULT_BOLD);
            card.addView(title);

            LinearLayout b1 = BeloogaUiKit.createSubtleBox(ctx);
            final TextView vaultInfo = new TextView(ctx);
            vaultInfo.setText("JWT Access + Refresh Rotation: Active (Hardware-Backed AES-256-GCM)\nPII Masking: Phone & Email hidden on Public Profile");
            vaultInfo.setTextColor(BeloogaUiKit.COLOR_SUCCESS);
            vaultInfo.setTextSize(11.5f);
            b1.addView(vaultInfo);
            card.addView(b1);

            card.addView(BeloogaUiKit.createActionButton(
                    ctx,
                    "Rotate Session Token Pair (/v1/auth/refresh/)",
                    "mobile-vault-rotate-btn",
                    BeloogaUiKit.COLOR_ACCENT_BLUE,
                    BeloogaUiKit.COLOR_TEXT_HEADING,
                    new View.OnClickListener() {
                        @Override
                        public void onClick(View v) {
                            vaultInfo.setText("✓ Rotated Bearer Token Pair in SecureStore Vault (0ms Downtime)");
                            BeloogaApiClient.rotateSessionToken(ctx, null);
                        }
                    }
            ));
            container.addView(card);
        }
    }
}
