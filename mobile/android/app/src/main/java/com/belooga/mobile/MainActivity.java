package com.belooga.mobile;

import android.app.Activity;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

public class MainActivity extends Activity {
    private LinearLayout contentContainer;
    private Button tabDiscover;
    private Button tabStudio;
    private Button tabTracker;
    private Button tabProfile;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        LinearLayout rootShell = new LinearLayout(this);
        rootShell.setOrientation(LinearLayout.VERTICAL);
        rootShell.setBackgroundColor(BeloogaUiKit.COLOR_PAGE);
        rootShell.setContentDescription("mobile-root-shell");

        rootShell.addView(buildTopHeader(), new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        ));

        ScrollView scrollArea = new ScrollView(this);
        contentContainer = new LinearLayout(this);
        contentContainer.setOrientation(LinearLayout.VERTICAL);
        int padH = BeloogaUiKit.dp(this, 14f);
        int padV = BeloogaUiKit.dp(this, 12f);
        contentContainer.setPadding(padH, padV, padH, padV);
        contentContainer.setContentDescription("mobile-tabs-content");
        scrollArea.addView(contentContainer);

        rootShell.addView(scrollArea, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                0,
                1f
        ));

        rootShell.addView(buildBottomNav(), new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        ));

        setContentView(rootShell);
        renderDiscoverScreen();
    }

    private LinearLayout buildTopHeader() {
        LinearLayout topBar = new LinearLayout(this);
        topBar.setOrientation(LinearLayout.HORIZONTAL);
        topBar.setGravity(Gravity.CENTER_VERTICAL);
        topBar.setBackgroundColor(BeloogaUiKit.COLOR_CARD);
        int pH = BeloogaUiKit.dp(this, 14f);
        int pV = BeloogaUiKit.dp(this, 11f);
        topBar.setPadding(pH, pV, pH, pV);

        TextView brandLogo = BeloogaUiKit.createAvatarCircle(
                this, "B", BeloogaUiKit.COLOR_BRAND, BeloogaUiKit.COLOR_TEXT_INVERSE
        );
        topBar.addView(brandLogo);

        LinearLayout titleCol = new LinearLayout(this);
        titleCol.setOrientation(LinearLayout.VERTICAL);
        titleCol.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));

        TextView brandTitle = new TextView(this);
        brandTitle.setText("BELOOGA MOBILE (RN 0.88.0)");
        brandTitle.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
        brandTitle.setTextSize(14.5f);
        brandTitle.setTypeface(Typeface.DEFAULT_BOLD);
        brandTitle.setContentDescription("mobile-brand-header");
        titleCol.addView(brandTitle);

        TextView statusBanner = new TextView(this);
        statusBanner.setText("Edge Gateway :8080 • Keystore Vault Active");
        statusBanner.setTextColor(BeloogaUiKit.COLOR_TEXT_MUTED);
        statusBanner.setTextSize(11f);
        statusBanner.setContentDescription("mobile-connection-status");
        titleCol.addView(statusBanner);

        topBar.addView(titleCol);
        topBar.addView(BeloogaUiKit.createBadgePill(
                this,
                "LIVE 12ms",
                BeloogaUiKit.COLOR_SUCCESS,
                BeloogaUiKit.COLOR_SUCCESS_MUTED,
                BeloogaUiKit.COLOR_BORDER,
                null
        ));
        return topBar;
    }

    private LinearLayout buildBottomNav() {
        LinearLayout bottomNav = new LinearLayout(this);
        bottomNav.setOrientation(LinearLayout.HORIZONTAL);
        bottomNav.setBackgroundColor(BeloogaUiKit.COLOR_CARD);
        int pH = BeloogaUiKit.dp(this, 10f);
        int pV = BeloogaUiKit.dp(this, 9f);
        bottomNav.setPadding(pH, pV, pH, BeloogaUiKit.dp(this, 12f));
        bottomNav.setContentDescription("mobile-bottom-tab-bar");

        tabDiscover = createNavTab("Discover", "mobile-tab-discover", new Runnable() {
            @Override
            public void run() {
                renderDiscoverScreen();
            }
        });
        tabStudio = createNavTab("Pitch Studio", "mobile-tab-studio", new Runnable() {
            @Override
            public void run() {
                renderStudioScreen();
            }
        });
        tabTracker = createNavTab("Job Tracker", "mobile-tab-tracker", new Runnable() {
            @Override
            public void run() {
                renderTrackerScreen();
            }
        });
        tabProfile = createNavTab("Workspace", "mobile-tab-profile", new Runnable() {
            @Override
            public void run() {
                renderWorkspaceScreen();
            }
        });

        bottomNav.addView(tabDiscover);
        bottomNav.addView(tabStudio);
        bottomNav.addView(tabTracker);
        bottomNav.addView(tabProfile);
        return bottomNav;
    }

    private Button createNavTab(String label, String testId, final Runnable onTap) {
        Button btn = new Button(this);
        btn.setText(label);
        btn.setAllCaps(false);
        btn.setContentDescription(testId);
        btn.setTextSize(11.5f);
        btn.setTypeface(Typeface.DEFAULT_BOLD);
        btn.setMinimumHeight(BeloogaUiKit.dp(this, 38f));
        btn.setMinHeight(BeloogaUiKit.dp(this, 38f));
        btn.setPadding(BeloogaUiKit.dp(this, 4f), BeloogaUiKit.dp(this, 6f), BeloogaUiKit.dp(this, 4f), BeloogaUiKit.dp(this, 6f));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        lp.setMargins(BeloogaUiKit.dp(this, 3f), 0, BeloogaUiKit.dp(this, 3f), 0);
        btn.setLayoutParams(lp);
        btn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                onTap.run();
            }
        });
        return btn;
    }

    private void highlightActiveTab(Button active) {
        Button[] all = new Button[]{tabDiscover, tabStudio, tabTracker, tabProfile};
        for (Button b : all) {
            if (b == null) continue;
            if (b == active) {
                b.setBackground(BeloogaUiKit.roundedDrawable(this, BeloogaUiKit.COLOR_BRAND, BeloogaUiKit.COLOR_BRAND, 0f, 10f));
                b.setTextColor(BeloogaUiKit.COLOR_TEXT_INVERSE);
            } else {
                b.setBackground(BeloogaUiKit.roundedDrawable(this, BeloogaUiKit.COLOR_SUBTLE, BeloogaUiKit.COLOR_BORDER, 1f, 10f));
                b.setTextColor(BeloogaUiKit.COLOR_TEXT_MUTED);
            }
        }
    }

    private void addSkillChipsRow(LinearLayout parent, String[] chips) {
        LinearLayout row = BeloogaUiKit.createRow(this, 4);
        for (int i = 0; i < chips.length; i++) {
            int bg = (i == 0) ? BeloogaUiKit.COLOR_BRAND_MUTED : BeloogaUiKit.COLOR_SUBTLE;
            int fg = (i == 0) ? BeloogaUiKit.COLOR_BRAND : BeloogaUiKit.COLOR_TEXT_MAIN;
            row.addView(BeloogaUiKit.createBadgePill(this, chips[i], fg, bg, BeloogaUiKit.COLOR_BORDER, null));
            if (i < chips.length - 1) {
                row.addView(BeloogaUiKit.createSpacer(this, 5));
            }
        }
        parent.addView(row);
    }

    private void renderDiscoverScreen() {
        highlightActiveTab(tabDiscover);
        contentContainer.removeAllViews();

        LinearLayout filterCard = BeloogaUiKit.createSurfaceCard(this, "mobile-search-filter-bar");
        LinearLayout topBadges = BeloogaUiKit.createRow(this, 6);
        topBadges.addView(BeloogaUiKit.createBadgePill(
                this, "GIN TSVECTOR <15MS", BeloogaUiKit.COLOR_BRAND, BeloogaUiKit.COLOR_BRAND_MUTED, BeloogaUiKit.COLOR_BORDER, null
        ));
        topBadges.addView(BeloogaUiKit.createSpacer(this, 6));
        topBadges.addView(BeloogaUiKit.createBadgePill(
                this, "500K+ VERIFIED", BeloogaUiKit.COLOR_SUCCESS, BeloogaUiKit.COLOR_SUCCESS_MUTED, BeloogaUiKit.COLOR_BORDER, null
        ));
        filterCard.addView(topBadges);

        TextView heading = new TextView(this);
        heading.setText("Talent Discovery & 60s Pitch Feed");
        heading.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
        heading.setTextSize(17.5f);
        heading.setTypeface(Typeface.DEFAULT_BOLD);
        heading.setContentDescription("mobile-discovery-heading");
        filterCard.addView(heading);

        EditText searchInput = new EditText(this);
        searchInput.setHint("Search skills (FastAPI, PostgreSQL, React Native)...");
        searchInput.setHintTextColor(BeloogaUiKit.COLOR_TEXT_MUTED);
        searchInput.setTextColor(BeloogaUiKit.COLOR_TEXT_MAIN);
        searchInput.setTextSize(13f);
        searchInput.setSingleLine(true);
        searchInput.setBackground(BeloogaUiKit.roundedDrawable(this, BeloogaUiKit.COLOR_SUBTLE, BeloogaUiKit.COLOR_BORDER, 1f, 10f));
        int sPad = BeloogaUiKit.dp(this, 10f);
        searchInput.setPadding(sPad, sPad, sPad, sPad);
        searchInput.setContentDescription("mobile-search-input");
        LinearLayout.LayoutParams sLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
        );
        sLp.setMargins(0, BeloogaUiKit.dp(this, 8f), 0, BeloogaUiKit.dp(this, 8f));
        searchInput.setLayoutParams(sLp);
        filterCard.addView(searchInput);

        addSkillChipsRow(filterCard, new String[]{"All (500k)", "FastAPI (142)", "PostgreSQL (98)", "RN 0.88"});
        contentContainer.addView(filterCard);

        LinearLayout alexCard = BeloogaUiKit.createSurfaceCard(this, "mobile-candidate-card-alexnguyen");
        LinearLayout alexHeader = BeloogaUiKit.createRow(this, 4);
        alexHeader.addView(BeloogaUiKit.createAvatarCircle(this, "AN", BeloogaUiKit.COLOR_BRAND_MUTED, BeloogaUiKit.COLOR_BRAND));

        LinearLayout alexMeta = new LinearLayout(this);
        alexMeta.setOrientation(LinearLayout.VERTICAL);
        alexMeta.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));

        TextView name = new TextView(this);
        name.setText("Alex Nguyen (@alexnguyen)");
        name.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
        name.setTextSize(15.5f);
        name.setTypeface(Typeface.DEFAULT_BOLD);
        name.setContentDescription("mobile-candidate-name-alexnguyen");
        alexMeta.addView(name);

        TextView role = new TextView(this);
        role.setText("Principal Distributed Systems Engineer | Trust Score: 96%");
        role.setTextColor(BeloogaUiKit.COLOR_BRAND);
        role.setTextSize(12.5f);
        role.setContentDescription("mobile-candidate-headline-alexnguyen");
        alexMeta.addView(role);

        alexHeader.addView(alexMeta);
        alexHeader.addView(BeloogaUiKit.createBadgePill(
                this, "96% TRUST", BeloogaUiKit.COLOR_SUCCESS, BeloogaUiKit.COLOR_SUCCESS_MUTED, BeloogaUiKit.COLOR_BORDER, null
        ));
        alexCard.addView(alexHeader);

        LinearLayout videoPreview = BeloogaUiKit.createSubtleBox(this);
        TextView pitchBadge = new TextView(this);
        pitchBadge.setText("▶ 00:58 HD ELEVATOR PITCH  •  Ho Chi Minh City  •  $195k–$220k");
        pitchBadge.setTextColor(BeloogaUiKit.COLOR_TEXT_MAIN);
        pitchBadge.setTextSize(11.5f);
        pitchBadge.setTypeface(Typeface.DEFAULT_BOLD);
        videoPreview.addView(pitchBadge);

        TextView pitchQuote = new TextView(this);
        pitchQuote.setText("\"Architected two-phase bounded GIN CTE search & L1/L2 singleflight cache sustaining 25k RPS.\"");
        pitchQuote.setTextColor(BeloogaUiKit.COLOR_TEXT_MUTED);
        pitchQuote.setTextSize(11.5f);
        videoPreview.addView(pitchQuote);
        alexCard.addView(videoPreview);

        addSkillChipsRow(alexCard, new String[]{"Python", "FastAPI", "PostgreSQL 16", "React Native 0.88"});

        alexCard.addView(BeloogaUiKit.createActionButton(
                this,
                "Watch 60s Video Pitch & Timeline",
                "mobile-open-candidate-alexnguyen",
                BeloogaUiKit.COLOR_BRAND,
                BeloogaUiKit.COLOR_TEXT_INVERSE,
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        renderCandidateDetailScreen();
                    }
                }
        ));
        contentContainer.addView(alexCard);

        LinearLayout sarahCard = BeloogaUiKit.createSurfaceCard(this, "mobile-candidate-card-sarahchen");
        LinearLayout sarahHeader = BeloogaUiKit.createRow(this, 4);
        sarahHeader.addView(BeloogaUiKit.createAvatarCircle(this, "SC", BeloogaUiKit.COLOR_ELEVATED, BeloogaUiKit.COLOR_TEXT_HEADING));
        LinearLayout sarahMeta = new LinearLayout(this);
        sarahMeta.setOrientation(LinearLayout.VERTICAL);
        sarahMeta.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        TextView sName = new TextView(this);
        sName.setText("Sarah Chen (@sarahchen)");
        sName.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
        sName.setTextSize(15f);
        sName.setTypeface(Typeface.DEFAULT_BOLD);
        sarahMeta.addView(sName);
        TextView sRole = new TextView(this);
        sRole.setText("Staff Mobile & Edge Systems Architect • Singapore");
        sRole.setTextColor(BeloogaUiKit.COLOR_BRAND);
        sRole.setTextSize(12f);
        sarahMeta.addView(sRole);
        sarahHeader.addView(sarahMeta);
        sarahHeader.addView(BeloogaUiKit.createBadgePill(
                this, "94% TRUST", BeloogaUiKit.COLOR_SUCCESS, BeloogaUiKit.COLOR_SUCCESS_MUTED, BeloogaUiKit.COLOR_BORDER, null
        ));
        sarahCard.addView(sarahHeader);
        addSkillChipsRow(sarahCard, new String[]{"Expo SDK 58", "TypeScript", "ConnectRPC", "Redis 7"});
        contentContainer.addView(sarahCard);
    }

    private void renderCandidateDetailScreen() {
        contentContainer.removeAllViews();
        LinearLayout detailCard = BeloogaUiKit.createSurfaceCard(this, "mobile-candidate-profile-screen");

        TextView title = new TextView(this);
        title.setText("Alex Nguyen — Verified Senior (96% Trust)");
        title.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
        title.setTextSize(17.5f);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setContentDescription("mobile-profile-fullname");
        detailCard.addView(title);

        TextView trajectory = new TextView(this);
        trajectory.setText("ConnectRPC Batch Loaded: 10 yrs exp • 1-Click PDF Export Ready");
        trajectory.setTextColor(BeloogaUiKit.COLOR_BRAND);
        trajectory.setContentDescription("mobile-profile-trust-badge");
        detailCard.addView(trajectory);

        detailCard.addView(BeloogaUiKit.createActionButton(
                this,
                "Back to Talent Feed",
                "mobile-candidate-back",
                BeloogaUiKit.COLOR_ELEVATED,
                BeloogaUiKit.COLOR_TEXT_HEADING,
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        renderDiscoverScreen();
                    }
                }
        ));
        contentContainer.addView(detailCard);
    }

    private void renderStudioScreen() {
        highlightActiveTab(tabStudio);
        contentContainer.removeAllViews();

        LinearLayout studioCard = BeloogaUiKit.createSurfaceCard(this, "mobile-pitch-studio-screen");
        LinearLayout badges = BeloogaUiKit.createRow(this, 6);
        badges.addView(BeloogaUiKit.createBadgePill(
                this, "WEBRTC 60S STUDIO", BeloogaUiKit.COLOR_BRAND, BeloogaUiKit.COLOR_BRAND_MUTED, BeloogaUiKit.COLOR_BORDER, null
        ));
        badges.addView(BeloogaUiKit.createSpacer(this, 6));
        badges.addView(BeloogaUiKit.createBadgePill(
                this, "● REC 1080P 60FPS", BeloogaUiKit.COLOR_SUCCESS, BeloogaUiKit.COLOR_SUCCESS_MUTED, BeloogaUiKit.COLOR_BORDER, null
        ));
        studioCard.addView(badges);

        TextView heading = new TextView(this);
        heading.setText("60s Video Elevator Pitch Studio");
        heading.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
        heading.setTextSize(17.5f);
        heading.setTypeface(Typeface.DEFAULT_BOLD);
        heading.setContentDescription("mobile-studio-title");
        studioCard.addView(heading);

        LinearLayout viewfinderBox = BeloogaUiKit.createSubtleBox(this);
        TextView vfHeader = new TextView(this);
        vfHeader.setText("AI TELEPROMPTER VIEWFINDER  •  ROLE: STAFF BACKEND ENGINEER");
        vfHeader.setTextColor(BeloogaUiKit.COLOR_BRAND);
        vfHeader.setTextSize(10.5f);
        vfHeader.setTypeface(Typeface.DEFAULT_BOLD);
        viewfinderBox.addView(vfHeader);

        final TextView scriptOutput = new TextView(this);
        scriptOutput.setText("AI Teleprompter Ready: Tap below to generate script or upload chunks.");
        scriptOutput.setTextColor(BeloogaUiKit.COLOR_TEXT_MAIN);
        scriptOutput.setTextSize(12.5f);
        scriptOutput.setContentDescription("mobile-studio-script-output");
        viewfinderBox.addView(scriptOutput);
        studioCard.addView(viewfinderBox);

        studioCard.addView(BeloogaUiKit.createActionButton(
                this,
                "Generate AI Teleprompter Script",
                "mobile-studio-generate-script",
                BeloogaUiKit.COLOR_ACCENT_BLUE,
                BeloogaUiKit.COLOR_TEXT_HEADING,
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        scriptOutput.setText("Pitch Script: Hi, I am Alex, a Staff Engineer specializing in sub-30ms PostgreSQL GIN search & React Native.");
                    }
                }
        ));

        LinearLayout uploadBox = BeloogaUiKit.createSubtleBox(this);
        final TextView uploadProgress = new TextView(this);
        uploadProgress.setText("Upload Progress: 0%");
        uploadProgress.setTextColor(BeloogaUiKit.COLOR_BRAND);
        uploadProgress.setTextSize(13f);
        uploadProgress.setTypeface(Typeface.DEFAULT_BOLD);
        uploadProgress.setContentDescription("mobile-studio-upload-progress");
        uploadBox.addView(uploadProgress);

        TextView chunkMeta = new TextView(this);
        chunkMeta.setText("Pipeline: [Chunk 1: H.264]  •  [Chunk 2: AAC]  •  [Chunk 3: FastStart MP4]");
        chunkMeta.setTextColor(BeloogaUiKit.COLOR_TEXT_MUTED);
        chunkMeta.setTextSize(11f);
        uploadBox.addView(chunkMeta);
        studioCard.addView(uploadBox);

        studioCard.addView(BeloogaUiKit.createActionButton(
                this,
                "Record & Upload 60s Pitch",
                "mobile-studio-upload-chunks",
                BeloogaUiKit.COLOR_BRAND,
                BeloogaUiKit.COLOR_TEXT_INVERSE,
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        uploadProgress.setText("Upload Progress: 100% (3/3 Chunks Assembled)");
                    }
                }
        ));
        contentContainer.addView(studioCard);

        LinearLayout atsCard = BeloogaUiKit.createSurfaceCard(this, "mobile-studio-ats-card");
        LinearLayout atsRow = BeloogaUiKit.createRow(this, 4);
        atsRow.addView(BeloogaUiKit.createBadgePill(
                this, "ATS JD MATCH SCANNER", BeloogaUiKit.COLOR_BRAND, BeloogaUiKit.COLOR_BRAND_MUTED, BeloogaUiKit.COLOR_BORDER, null
        ));
        atsRow.addView(BeloogaUiKit.createSpacer(this, 6));
        atsRow.addView(BeloogaUiKit.createBadgePill(
                this, "94% COMPATIBLE", BeloogaUiKit.COLOR_SUCCESS, BeloogaUiKit.COLOR_SUCCESS_MUTED, BeloogaUiKit.COLOR_BORDER, null
        ));
        atsCard.addView(atsRow);

        TextView atsSummary = new TextView(this);
        atsSummary.setText("Matched Keywords: FastAPI • PostgreSQL 16 • AsyncIO • Redis 7 • React Native");
        atsSummary.setTextColor(BeloogaUiKit.COLOR_TEXT_MAIN);
        atsSummary.setTextSize(12.5f);
        atsCard.addView(atsSummary);

        TextView pulseSummary = new TextView(this);
        pulseSummary.setText("Market Pulse: +34% YoY Demand  •  Median Comp: $195,000 USD");
        pulseSummary.setTextColor(BeloogaUiKit.COLOR_TEXT_MUTED);
        pulseSummary.setTextSize(11.5f);
        atsCard.addView(pulseSummary);
        contentContainer.addView(atsCard);
    }

    private void renderTrackerScreen() {
        highlightActiveTab(tabTracker);
        contentContainer.removeAllViews();

        LinearLayout kpiRow = BeloogaUiKit.createRow(this, 10);
        kpiRow.addView(BeloogaUiKit.createMetricTile(this, "12", "Active Pipeline", BeloogaUiKit.COLOR_BRAND));
        kpiRow.addView(BeloogaUiKit.createMetricTile(this, "92%", "Avg ATS Match", BeloogaUiKit.COLOR_SUCCESS));
        kpiRow.addView(BeloogaUiKit.createMetricTile(this, "33%", "Interview Rate", BeloogaUiKit.COLOR_WARNING));
        contentContainer.addView(kpiRow);

        LinearLayout trackerCard = BeloogaUiKit.createSurfaceCard(this, "mobile-job-tracker-screen");
        LinearLayout badges = BeloogaUiKit.createRow(this, 6);
        badges.addView(BeloogaUiKit.createBadgePill(
                this, "CANDIDATE KANBAN CRM", BeloogaUiKit.COLOR_BRAND, BeloogaUiKit.COLOR_BRAND_MUTED, BeloogaUiKit.COLOR_BORDER, null
        ));
        badges.addView(BeloogaUiKit.createSpacer(this, 6));
        badges.addView(BeloogaUiKit.createBadgePill(
                this, "OFFLINE OUTBOX READY", BeloogaUiKit.COLOR_SUCCESS, BeloogaUiKit.COLOR_SUCCESS_MUTED, BeloogaUiKit.COLOR_BORDER, null
        ));
        trackerCard.addView(badges);

        TextView heading = new TextView(this);
        heading.setText("Job Application Kanban Pipeline");
        heading.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
        heading.setTextSize(17.5f);
        heading.setTypeface(Typeface.DEFAULT_BOLD);
        heading.setContentDescription("mobile-tracker-title");
        trackerCard.addView(heading);

        addSkillChipsRow(trackerCard, new String[]{"APPLIED (3)", "INTERVIEW (3)", "OFFER (1)", "TARGET (5)"});

        LinearLayout stripeBox = BeloogaUiKit.createSubtleBox(this);
        final TextView jobStatus = new TextView(this);
        jobStatus.setText("Stripe — Staff Mobile Engineer [APPLIED] (ATS Match: 92%)");
        jobStatus.setTextColor(BeloogaUiKit.COLOR_BRAND);
        jobStatus.setTextSize(13.5f);
        jobStatus.setTypeface(Typeface.DEFAULT_BOLD);
        jobStatus.setContentDescription("mobile-tracker-job-status-job_101");
        stripeBox.addView(jobStatus);

        TextView stripeMeta = new TextView(this);
        stripeMeta.setText("Comp: $210,000 USD  •  San Francisco / Remote  •  Referral Verified");
        stripeMeta.setTextColor(BeloogaUiKit.COLOR_TEXT_MUTED);
        stripeMeta.setTextSize(11.5f);
        stripeBox.addView(stripeMeta);
        trackerCard.addView(stripeBox);

        trackerCard.addView(BeloogaUiKit.createActionButton(
                this,
                "Advance to INTERVIEW",
                "mobile-tracker-move-job_101-INTERVIEW",
                BeloogaUiKit.COLOR_BRAND,
                BeloogaUiKit.COLOR_TEXT_INVERSE,
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        jobStatus.setText("Stripe — Staff Mobile Engineer [INTERVIEW] (Synced)");
                    }
                }
        ));
        contentContainer.addView(trackerCard);

        LinearLayout pipelineCard = BeloogaUiKit.createSurfaceCard(this, "mobile-tracker-secondary-list");
        TextView pipeTitle = new TextView(this);
        pipeTitle.setText("Active Interviews & Offers");
        pipeTitle.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
        pipeTitle.setTextSize(14.5f);
        pipeTitle.setTypeface(Typeface.DEFAULT_BOLD);
        pipelineCard.addView(pipeTitle);

        LinearLayout linearBox = BeloogaUiKit.createSubtleBox(this);
        TextView lTitle = new TextView(this);
        lTitle.setText("Linear — Principal Product Engineer  [INTERVIEW]");
        lTitle.setTextColor(BeloogaUiKit.COLOR_TEXT_MAIN);
        lTitle.setTextSize(12.5f);
        lTitle.setTypeface(Typeface.DEFAULT_BOLD);
        linearBox.addView(lTitle);
        TextView lSub = new TextView(this);
        lSub.setText("$195,000 USD  •  ATS Match: 90%  •  Architecture Round Tomorrow");
        lSub.setTextColor(BeloogaUiKit.COLOR_TEXT_MUTED);
        lSub.setTextSize(11f);
        linearBox.addView(lSub);
        pipelineCard.addView(linearBox);

        LinearLayout anthropicBox = BeloogaUiKit.createSubtleBox(this);
        TextView aTitle = new TextView(this);
        aTitle.setText("Anthropic — Staff Distributed Systems  [OFFER RECEIVED]");
        aTitle.setTextColor(BeloogaUiKit.COLOR_SUCCESS);
        aTitle.setTextSize(12.5f);
        aTitle.setTypeface(Typeface.DEFAULT_BOLD);
        anthropicBox.addView(aTitle);
        TextView aSub = new TextView(this);
        aSub.setText("$240,000 USD  •  ATS Match: 96%  •  Deadline: Nov 05");
        aSub.setTextColor(BeloogaUiKit.COLOR_TEXT_MUTED);
        aSub.setTextSize(11f);
        anthropicBox.addView(aSub);
        pipelineCard.addView(anthropicBox);

        contentContainer.addView(pipelineCard);
    }

    private void renderWorkspaceScreen() {
        highlightActiveTab(tabProfile);
        contentContainer.removeAllViews();

        LinearLayout profileCard = BeloogaUiKit.createSurfaceCard(this, "mobile-workspace-profile-screen");
        LinearLayout badges = BeloogaUiKit.createRow(this, 6);
        badges.addView(BeloogaUiKit.createBadgePill(
                this, "VERIFIED CANDIDATE WORKSPACE", BeloogaUiKit.COLOR_BRAND, BeloogaUiKit.COLOR_BRAND_MUTED, BeloogaUiKit.COLOR_BORDER, null
        ));
        badges.addView(BeloogaUiKit.createSpacer(this, 6));
        badges.addView(BeloogaUiKit.createBadgePill(
                this, "TIER 1 • 96% TRUST", BeloogaUiKit.COLOR_SUCCESS, BeloogaUiKit.COLOR_SUCCESS_MUTED, BeloogaUiKit.COLOR_BORDER, null
        ));
        profileCard.addView(badges);

        TextView heading = new TextView(this);
        heading.setText("Candidate Workspace");
        heading.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
        heading.setTextSize(17.5f);
        heading.setTypeface(Typeface.DEFAULT_BOLD);
        heading.setContentDescription("mobile-workspace-heading");
        profileCard.addView(heading);

        LinearLayout idRow = BeloogaUiKit.createRow(this, 6);
        idRow.addView(BeloogaUiKit.createAvatarCircle(this, "AN", BeloogaUiKit.COLOR_BRAND_MUTED, BeloogaUiKit.COLOR_BRAND));
        LinearLayout idCol = new LinearLayout(this);
        idCol.setOrientation(LinearLayout.VERTICAL);
        TextView fullName = new TextView(this);
        fullName.setText("Alex Nguyen • Principal Distributed Systems Engineer");
        fullName.setTextColor(BeloogaUiKit.COLOR_TEXT_MAIN);
        fullName.setTextSize(13.5f);
        fullName.setTypeface(Typeface.DEFAULT_BOLD);
        idCol.addView(fullName);

        TextView userLabel = new TextView(this);
        userLabel.setText("@alexnguyen • Dual-Mode SecureStore Token Vault Active");
        userLabel.setTextColor(BeloogaUiKit.COLOR_BRAND);
        userLabel.setTextSize(12f);
        userLabel.setContentDescription("mobile-workspace-username");
        idCol.addView(userLabel);
        idRow.addView(idCol);
        profileCard.addView(idRow);

        LinearLayout statsRow = BeloogaUiKit.createRow(this, 4);
        statsRow.addView(BeloogaUiKit.createMetricTile(this, "10+ Yrs", "Verified Exp", BeloogaUiKit.COLOR_BRAND));
        statsRow.addView(BeloogaUiKit.createMetricTile(this, "96/100", "Trust Score", BeloogaUiKit.COLOR_SUCCESS));
        statsRow.addView(BeloogaUiKit.createMetricTile(this, "1.4k", "Recruiter Views", BeloogaUiKit.COLOR_TEXT_HEADING));
        profileCard.addView(statsRow);
        contentContainer.addView(profileCard);

        LinearLayout timelineCard = BeloogaUiKit.createSurfaceCard(this, "mobile-workspace-timeline-card");
        TextView tlHeading = new TextView(this);
        tlHeading.setText("Verified Career Trajectory & Credentials");
        tlHeading.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
        tlHeading.setTextSize(14.5f);
        tlHeading.setTypeface(Typeface.DEFAULT_BOLD);
        timelineCard.addView(tlHeading);

        LinearLayout exp1 = BeloogaUiKit.createSubtleBox(this);
        TextView e1Title = new TextView(this);
        e1Title.setText("2023–Present  •  Principal Architect @ Belooga");
        e1Title.setTextColor(BeloogaUiKit.COLOR_TEXT_MAIN);
        e1Title.setTextSize(12.5f);
        e1Title.setTypeface(Typeface.DEFAULT_BOLD);
        exp1.addView(e1Title);
        TextView e1Sub = new TextView(this);
        e1Sub.setText("PostgreSQL 16 GIN Search, ConnectRPC Batching & React Native 0.88");
        e1Sub.setTextColor(BeloogaUiKit.COLOR_TEXT_MUTED);
        e1Sub.setTextSize(11f);
        exp1.addView(e1Sub);
        timelineCard.addView(exp1);

        LinearLayout exp2 = BeloogaUiKit.createSubtleBox(this);
        TextView e2Title = new TextView(this);
        e2Title.setText("2020–2023  •  Senior Systems Engineer @ Stripe");
        e2Title.setTextColor(BeloogaUiKit.COLOR_TEXT_MAIN);
        e2Title.setTextSize(12.5f);
        e2Title.setTypeface(Typeface.DEFAULT_BOLD);
        exp2.addView(e2Title);
        TextView e2Sub = new TextView(this);
        e2Sub.setText("High-throughput payment settlement & idempotent ledger APIs");
        e2Sub.setTextColor(BeloogaUiKit.COLOR_TEXT_MUTED);
        e2Sub.setTextSize(11f);
        exp2.addView(e2Sub);
        timelineCard.addView(exp2);

        timelineCard.addView(BeloogaUiKit.createActionButton(
                this,
                "Export 1-Click ATS PDF Resume",
                "mobile-workspace-export-pdf",
                BeloogaUiKit.COLOR_BRAND,
                BeloogaUiKit.COLOR_TEXT_INVERSE,
                null
        ));
        contentContainer.addView(timelineCard);
    }
}
