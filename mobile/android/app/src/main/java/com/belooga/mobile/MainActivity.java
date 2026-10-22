package com.belooga.mobile;

import android.app.Activity;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

public class MainActivity extends Activity {
    private LinearLayout contentContainer;
    private BeloogaUiKit.NavTabHolder tabDiscover;
    private BeloogaUiKit.NavTabHolder tabStudio;
    private BeloogaUiKit.NavTabHolder tabTracker;
    private BeloogaUiKit.NavTabHolder tabCareer;
    private BeloogaUiKit.NavTabHolder tabProfile;
    private BeloogaUiKit.NavTabHolder[] allTabs;

    private int discoverSubTab = 0;
    private int studioSubTab = 0;
    private int careerSubTab = 0;
    private int workspaceSubTab = 0;
    private boolean alexBookmarked = true;
    private boolean sarahBookmarked = true;
    private boolean filterSavedOnly = false;

    private int getSavedShortlistCount() {
        return (alexBookmarked ? 1 : 0) + (sarahBookmarked ? 1 : 0);
    }

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
        int padH = BeloogaUiKit.dp(this, 13f);
        int padV = BeloogaUiKit.dp(this, 11f);
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
        LinearLayout wrapper = new LinearLayout(this);
        wrapper.setOrientation(LinearLayout.VERTICAL);
        wrapper.setBackgroundColor(BeloogaUiKit.COLOR_NAVDOCK);
        wrapper.setElevation(BeloogaUiKit.dp(this, 6f));
        wrapper.setContentDescription("mobile-top-app-header");

        LinearLayout topBar = new LinearLayout(this);
        topBar.setOrientation(LinearLayout.HORIZONTAL);
        topBar.setGravity(Gravity.CENTER_VERTICAL);
        int pH = BeloogaUiKit.dp(this, 16f);
        int pV = BeloogaUiKit.dp(this, 11f);
        topBar.setPadding(pH, pV, pH, pV);

        TextView avatarCircle = BeloogaUiKit.createAvatarCircle(
                this, "B", BeloogaUiKit.COLOR_BRAND, BeloogaUiKit.COLOR_TEXT_INVERSE
        );
        avatarCircle.setContentDescription("mobile-header-avatar-btn");
        topBar.addView(avatarCircle);

        LinearLayout titleCol = new LinearLayout(this);
        titleCol.setOrientation(LinearLayout.VERTICAL);
        titleCol.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));

        TextView brandTitle = new TextView(this);
        brandTitle.setText("BELOOGA MOBILE");
        brandTitle.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
        brandTitle.setTextSize(15f);
        brandTitle.setTypeface(Typeface.DEFAULT_BOLD);
        brandTitle.setContentDescription("mobile-brand-header");
        titleCol.addView(brandTitle);

        TextView statusBanner = new TextView(this);
        statusBanner.setText("Edge Gateway :8080 • Keystore Vault Active");
        statusBanner.setTextColor(BeloogaUiKit.COLOR_TEXT_MUTED);
        statusBanner.setTextSize(10.5f);
        statusBanner.setContentDescription("mobile-connection-status");
        titleCol.addView(statusBanner);

        topBar.addView(titleCol);

        TextView walletPill = BeloogaUiKit.createBadgePill(
                this,
                "450,000đ +",
                BeloogaUiKit.COLOR_BRAND,
                BeloogaUiKit.COLOR_BRAND_MUTED,
                BeloogaUiKit.COLOR_BRAND,
                "mobile-wallet-balance-pill"
        );
        walletPill.setTag("mobile-header-wallet-pill");
        walletPill.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                careerSubTab = 1;
                renderCareerScreen();
            }
        });
        topBar.addView(walletPill);
        topBar.addView(BeloogaUiKit.createSpacer(this, 6));

        TextView alertsPill = BeloogaUiKit.createBadgePill(
                this,
                "3 ALERTS",
                BeloogaUiKit.COLOR_SUCCESS,
                BeloogaUiKit.COLOR_SUCCESS_MUTED,
                BeloogaUiKit.COLOR_BORDER,
                "mobile-header-notifications-btn"
        );
        alertsPill.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                workspaceSubTab = 2;
                renderWorkspaceScreen();
            }
        });
        topBar.addView(alertsPill);
        wrapper.addView(topBar);

        View divider = new View(this);
        divider.setBackgroundColor(BeloogaUiKit.COLOR_BORDER);
        divider.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, BeloogaUiKit.dp(this, 1f)));
        wrapper.addView(divider);
        return wrapper;
    }

    private LinearLayout buildBottomNav() {
        LinearLayout dockWrapper = new LinearLayout(this);
        dockWrapper.setOrientation(LinearLayout.VERTICAL);
        dockWrapper.setBackgroundColor(BeloogaUiKit.COLOR_PAGE);
        dockWrapper.setPadding(
                BeloogaUiKit.dp(this, 10f),
                BeloogaUiKit.dp(this, 4f),
                BeloogaUiKit.dp(this, 10f),
                BeloogaUiKit.dp(this, 8f)
        );
        dockWrapper.setContentDescription("mobile-bottom-nav-bar");

        LinearLayout bottomNav = new LinearLayout(this);
        bottomNav.setOrientation(LinearLayout.HORIZONTAL);
        bottomNav.setGravity(Gravity.CENTER_VERTICAL);
        bottomNav.setBackground(BeloogaUiKit.roundedDrawable(
                this,
                BeloogaUiKit.COLOR_NAVDOCK,
                BeloogaUiKit.COLOR_BORDER,
                1f,
                24f
        ));
        bottomNav.setElevation(BeloogaUiKit.dp(this, 8f));
        int pH = BeloogaUiKit.dp(this, 6f);
        bottomNav.setPadding(pH, BeloogaUiKit.dp(this, 6f), pH, BeloogaUiKit.dp(this, 8f));
        bottomNav.setContentDescription("mobile-bottom-tab-bar");

        tabDiscover = BeloogaUiKit.createModernNavTab(this, "Discover", "mobile-tab-discover", BeloogaUiKit.ICON_DISCOVER, new Runnable() {
            @Override
            public void run() {
                discoverSubTab = 0;
                renderDiscoverScreen();
            }
        });
        tabStudio = BeloogaUiKit.createModernNavTab(this, "Studio", "mobile-tab-studio", BeloogaUiKit.ICON_STUDIO, new Runnable() {
            @Override
            public void run() {
                studioSubTab = 0;
                renderStudioScreen();
            }
        });
        tabTracker = BeloogaUiKit.createModernNavTab(this, "Tracker", "mobile-tab-tracker", BeloogaUiKit.ICON_TRACKER, new Runnable() {
            @Override
            public void run() {
                renderTrackerScreen();
            }
        });
        tabCareer = BeloogaUiKit.createModernNavTab(this, "Career Pro", "mobile-tab-career", BeloogaUiKit.ICON_CAREER, new Runnable() {
            @Override
            public void run() {
                renderCareerScreen();
            }
        });
        tabProfile = BeloogaUiKit.createModernNavTab(this, "Workspace", "mobile-tab-profile", BeloogaUiKit.ICON_WORKSPACE, new Runnable() {
            @Override
            public void run() {
                workspaceSubTab = 0;
                renderWorkspaceScreen();
            }
        });

        allTabs = new BeloogaUiKit.NavTabHolder[]{tabDiscover, tabStudio, tabTracker, tabCareer, tabProfile};
        for (BeloogaUiKit.NavTabHolder holder : allTabs) {
            bottomNav.addView(holder.root);
        }

        dockWrapper.addView(bottomNav);
        return dockWrapper;
    }

    private void addSkillChipsRow(LinearLayout parent, String[] chips) {
        LinearLayout row = BeloogaUiKit.createRow(this, 4);
        for (int i = 0; i < chips.length; i++) {
            int bg = (i == 0) ? BeloogaUiKit.COLOR_BRAND_MUTED : BeloogaUiKit.COLOR_SUBTLE;
            int fg = (i == 0) ? BeloogaUiKit.COLOR_BRAND : BeloogaUiKit.COLOR_TEXT_MAIN;
            String cleanName = chips[i].split(" ")[0];
            row.addView(BeloogaUiKit.createBadgePill(
                    this,
                    chips[i],
                    fg,
                    bg,
                    BeloogaUiKit.COLOR_BORDER,
                    "mobile-skill-chip-" + cleanName
            ));
            if (i < chips.length - 1) {
                row.addView(BeloogaUiKit.createSpacer(this, 5));
            }
        }
        parent.addView(row);
    }

    private void renderDiscoverScreen() {
        BeloogaUiKit.updateNavTabsState(this, allTabs, tabDiscover);
        contentContainer.removeAllViews();

        contentContainer.addView(BeloogaUiKit.createSegmentedBar(
                this,
                new String[]{"Talent Feed (500k)", "AI Shortlist (2)", "Salary Radar"},
                discoverSubTab,
                new BeloogaUiKit.SegmentSelectListener() {
                    @Override
                    public void onSelect(int index) {
                        if (index == 2) {
                            careerSubTab = 2;
                            renderCareerScreen();
                            return;
                        }
                        discoverSubTab = index;
                        renderDiscoverScreen();
                    }
                }
        ));

        if (discoverSubTab == 1) {
            MobileCareerScreens.renderDiscoverShortlistSubScreen(this, contentContainer);
            return;
        }

        LinearLayout filterCard = BeloogaUiKit.createSurfaceCard(this, "mobile-search-filter-bar");
        LinearLayout topBadges = BeloogaUiKit.createRow(this, 5);
        topBadges.addView(BeloogaUiKit.createBadgePill(
                this, "GIN TSVECTOR <15MS", BeloogaUiKit.COLOR_BRAND, BeloogaUiKit.COLOR_BRAND_MUTED, BeloogaUiKit.COLOR_BORDER, null
        ));
        topBadges.addView(BeloogaUiKit.createSpacer(this, 6));
        topBadges.addView(BeloogaUiKit.createShortlistFilterChip(
                this,
                "Saved Shortlist (" + getSavedShortlistCount() + ")",
                filterSavedOnly,
                "filter-saved-shortlist-chip",
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        filterSavedOnly = !filterSavedOnly;
                        renderDiscoverScreen();
                    }
                }
        ));
        filterCard.addView(topBadges);

        TextView heading = new TextView(this);
        heading.setText("Talent Discovery & 60s Pitch Feed");
        heading.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
        heading.setTextSize(17f);
        heading.setTypeface(Typeface.DEFAULT_BOLD);
        heading.setContentDescription("mobile-discovery-heading");
        filterCard.addView(heading);

        EditText searchInput = new EditText(this);
        searchInput.setHint("Search skills (FastAPI, PostgreSQL, React Native)...");
        searchInput.setHintTextColor(BeloogaUiKit.COLOR_TEXT_MUTED);
        searchInput.setTextColor(BeloogaUiKit.COLOR_TEXT_MAIN);
        searchInput.setTextSize(12.5f);
        searchInput.setSingleLine(true);
        searchInput.setBackground(BeloogaUiKit.roundedDrawable(this, BeloogaUiKit.COLOR_SUBTLE, BeloogaUiKit.COLOR_BORDER, 1f, 10f));
        int sPad = BeloogaUiKit.dp(this, 9f);
        searchInput.setPadding(sPad, sPad, sPad, sPad);
        searchInput.setContentDescription("mobile-search-input");
        LinearLayout.LayoutParams sLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
        );
        sLp.setMargins(0, BeloogaUiKit.dp(this, 7f), 0, BeloogaUiKit.dp(this, 5f));
        searchInput.setLayoutParams(sLp);
        filterCard.addView(searchInput);

        LinearLayout customSkillRow = BeloogaUiKit.createRow(this, 6);
        final EditText customSkillInput = new EditText(this);
        customSkillInput.setHint("+ Nhập skill mới (Golang, Kubernetes, AI/LLM)...");
        customSkillInput.setHintTextColor(BeloogaUiKit.COLOR_TEXT_MUTED);
        customSkillInput.setTextColor(BeloogaUiKit.COLOR_TEXT_MAIN);
        customSkillInput.setTextSize(11.5f);
        customSkillInput.setSingleLine(true);
        customSkillInput.setBackground(BeloogaUiKit.roundedDrawable(this, BeloogaUiKit.COLOR_SUBTLE, BeloogaUiKit.COLOR_BORDER, 1f, 10f));
        customSkillInput.setPadding(sPad, BeloogaUiKit.dp(this, 7f), sPad, BeloogaUiKit.dp(this, 7f));
        customSkillInput.setContentDescription("mobile-custom-skill-input");
        LinearLayout.LayoutParams csLp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        csLp.setMargins(0, 0, BeloogaUiKit.dp(this, 6f), 0);
        customSkillInput.setLayoutParams(csLp);
        customSkillRow.addView(customSkillInput);

        customSkillRow.addView(BeloogaUiKit.createShortlistFilterChip(
                this,
                "+ Thêm Skill Mới",
                true,
                "mobile-add-custom-skill-btn",
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        customSkillInput.setText("");
                    }
                }
        ));
        filterCard.addView(customSkillRow);

        addSkillChipsRow(filterCard, new String[]{"Golang", "Python", "FastAPI (142)", "PostgreSQL (98)"});
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
        name.setTextSize(15f);
        name.setTypeface(Typeface.DEFAULT_BOLD);
        name.setContentDescription("mobile-candidate-name-alexnguyen");
        alexMeta.addView(name);

        TextView role = new TextView(this);
        role.setText("Principal Distributed Systems Engineer | Trust Score: 96%");
        role.setTextColor(BeloogaUiKit.COLOR_BRAND);
        role.setTextSize(12f);
        role.setContentDescription("mobile-candidate-headline-alexnguyen");
        alexMeta.addView(role);

        alexHeader.addView(alexMeta);
        alexHeader.addView(BeloogaUiKit.createBadgePill(
                this,
                "Khớp 4/4 kỹ năng",
                BeloogaUiKit.COLOR_BRAND,
                BeloogaUiKit.COLOR_BRAND_MUTED,
                BeloogaUiKit.COLOR_BORDER,
                "mobile-skill-match-badge-alexnguyen"
        ));
        alexHeader.addView(BeloogaUiKit.createSpacer(this, 4));
        alexHeader.addView(BeloogaUiKit.createBookmarkToggleBtn(
                this,
                alexBookmarked,
                "bookmark-candidate-alexnguyen",
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        alexBookmarked = !alexBookmarked;
                        renderDiscoverScreen();
                    }
                }
        ));
        alexCard.addView(alexHeader);

        LinearLayout videoPreview = BeloogaUiKit.createSubtleBox(this);
        TextView pitchBadge = new TextView(this);
        pitchBadge.setText("▶ 00:30 HD ELEVATOR PITCH  •  Ho Chi Minh City  •  $195k–$220k");
        pitchBadge.setTextColor(BeloogaUiKit.COLOR_TEXT_MAIN);
        pitchBadge.setTextSize(11.5f);
        pitchBadge.setTypeface(Typeface.DEFAULT_BOLD);
        pitchBadge.setContentDescription("mobile-watch-pitch-alexnguyen");
        videoPreview.addView(pitchBadge);

        TextView pitchQuote = new TextView(this);
        pitchQuote.setText("\"Architected two-phase bounded GIN CTE search & L1/L2 singleflight cache sustaining 25k RPS.\"");
        pitchQuote.setTextColor(BeloogaUiKit.COLOR_TEXT_MUTED);
        pitchQuote.setTextSize(11f);
        videoPreview.addView(pitchQuote);
        alexCard.addView(videoPreview);

        addSkillChipsRow(alexCard, new String[]{"Golang", "Python", "FastAPI", "PostgreSQL 16"});

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
        sName.setTextSize(14.5f);
        sName.setTypeface(Typeface.DEFAULT_BOLD);
        sarahMeta.addView(sName);
        TextView sRole = new TextView(this);
        sRole.setText("Staff Mobile & Edge Systems Architect • Singapore");
        sRole.setTextColor(BeloogaUiKit.COLOR_BRAND);
        sRole.setTextSize(11.5f);
        sarahMeta.addView(sRole);
        sarahHeader.addView(sarahMeta);
        sarahHeader.addView(BeloogaUiKit.createBadgePill(
                this, "94% TRUST", BeloogaUiKit.COLOR_SUCCESS, BeloogaUiKit.COLOR_SUCCESS_MUTED, BeloogaUiKit.COLOR_BORDER, null
        ));
        sarahHeader.addView(BeloogaUiKit.createBookmarkToggleBtn(
                this,
                sarahBookmarked,
                "bookmark-candidate-sarahchen",
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        sarahBookmarked = !sarahBookmarked;
                        renderDiscoverScreen();
                    }
                }
        ));
        sarahCard.addView(sarahHeader);
        addSkillChipsRow(sarahCard, new String[]{"Expo SDK 58", "TypeScript", "ConnectRPC", "Redis 7"});
        contentContainer.addView(sarahCard);

        LinearLayout companiesCard = BeloogaUiKit.createSurfaceCard(this, "mobile-companies-section");
        EditText companySearchInput = new EditText(this);
        companySearchInput.setHint("Tìm công ty theo tên, Tech Stack, ngành nghề (/v1/companies/search)...");
        companySearchInput.setHintTextColor(BeloogaUiKit.COLOR_TEXT_MUTED);
        companySearchInput.setTextColor(BeloogaUiKit.COLOR_TEXT_MAIN);
        companySearchInput.setTextSize(12f);
        companySearchInput.setSingleLine(true);
        companySearchInput.setContentDescription("mobile-company-search-input");
        companiesCard.addView(companySearchInput);

        LinearLayout dbCard = BeloogaUiKit.createSubtleBox(this);
        dbCard.setContentDescription("mobile-company-card-databricks");
        TextView dbTitle = new TextView(this);
        dbTitle.setText("Databricks (AI / Cloud • Ho Chi Minh • ★ 4.9 • $3,200/mo • 6 Open Jobs)");
        dbTitle.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
        dbTitle.setTextSize(12f);
        dbTitle.setTypeface(Typeface.DEFAULT_BOLD);
        dbCard.addView(dbTitle);
        companiesCard.addView(dbCard);

        LinearLayout compProfileCard = BeloogaUiKit.createSubtleBox(this);
        compProfileCard.setContentDescription("mobile-company-profile-card");
        compProfileCard.addView(BeloogaUiKit.createActionButton(
                this,
                "Viết Đánh Giá Công Ty (/v1/companies/databricks/reviews)",
                "mobile-company-review-btn",
                BeloogaUiKit.COLOR_BRAND,
                BeloogaUiKit.COLOR_TEXT_INVERSE,
                null
        ));
        companiesCard.addView(compProfileCard);
        contentContainer.addView(companiesCard);

        LinearLayout topCandidatesCard = BeloogaUiKit.createSurfaceCard(this, "mobile-top-candidates-section");
        LinearLayout topCatRow = BeloogaUiKit.createRow(this, 6);
        topCatRow.addView(BeloogaUiKit.createBadgePill(
                this,
                "BACKEND",
                BeloogaUiKit.COLOR_BRAND,
                BeloogaUiKit.COLOR_BRAND_MUTED,
                BeloogaUiKit.COLOR_BORDER,
                "mobile-top-candidates-category-backend"
        ));
        topCatRow.addView(BeloogaUiKit.createSpacer(this, 6));
        topCatRow.addView(BeloogaUiKit.createBadgePill(
                this,
                "READY NOW",
                BeloogaUiKit.COLOR_SUCCESS,
                BeloogaUiKit.COLOR_SUCCESS_MUTED,
                BeloogaUiKit.COLOR_BORDER,
                "mobile-top-candidates-active-toggle"
        ));
        topCandidatesCard.addView(topCatRow);

        LinearLayout topAlexBox = BeloogaUiKit.createSubtleBox(this);
        topAlexBox.setContentDescription("mobile-top-candidate-card-alexnguyen");
        TextView topAlexTxt = new TextView(this);
        topAlexTxt.setText("#1 Alex Nguyen (@alexnguyen) • Top 1% Talent (98/100 pts) • 60s Video Pitch");
        topAlexTxt.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
        topAlexTxt.setTextSize(12f);
        topAlexTxt.setTypeface(Typeface.DEFAULT_BOLD);
        topAlexBox.addView(topAlexTxt);
        topCandidatesCard.addView(topAlexBox);
        contentContainer.addView(topCandidatesCard);
    }

    private void renderCandidateDetailScreen() {
        contentContainer.removeAllViews();
        LinearLayout detailCard = BeloogaUiKit.createSurfaceCard(this, "mobile-candidate-profile-screen");

        TextView title = new TextView(this);
        title.setText("Alex Nguyen — Verified Senior (96% Trust)");
        title.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
        title.setTextSize(17f);
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
        BeloogaUiKit.updateNavTabsState(this, allTabs, tabStudio);
        contentContainer.removeAllViews();

        contentContainer.addView(BeloogaUiKit.createSegmentedBar(
                this,
                new String[]{"60s Video Studio", "Pro CV Studio", "ATS Scanner"},
                studioSubTab,
                new BeloogaUiKit.SegmentSelectListener() {
                    @Override
                    public void onSelect(int index) {
                        if (index == 2) {
                            careerSubTab = 0;
                            renderCareerScreen();
                            return;
                        }
                        studioSubTab = index;
                        renderStudioScreen();
                    }
                }
        ));

        if (studioSubTab == 1) {
            MobileCareerScreens.renderCvStudioSubScreen(this, contentContainer);
            return;
        }

        LinearLayout studioCard = BeloogaUiKit.createSurfaceCard(this, "mobile-pitch-studio-screen");
        LinearLayout badges = BeloogaUiKit.createRow(this, 5);
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
        heading.setTextSize(17f);
        heading.setTypeface(Typeface.DEFAULT_BOLD);
        heading.setContentDescription("mobile-studio-title");
        studioCard.addView(heading);

        LinearLayout viewfinderBox = BeloogaUiKit.createSubtleBox(this);
        TextView vfHeader = new TextView(this);
        vfHeader.setText("AI TELEPROMPTER VIEWFINDER  •  ROLE: STAFF BACKEND ENGINEER");
        vfHeader.setTextColor(BeloogaUiKit.COLOR_BRAND);
        vfHeader.setTextSize(10f);
        vfHeader.setTypeface(Typeface.DEFAULT_BOLD);
        viewfinderBox.addView(vfHeader);

        final TextView scriptOutput = new TextView(this);
        scriptOutput.setText("AI Teleprompter Ready: Tap below to generate script or upload chunks.");
        scriptOutput.setTextColor(BeloogaUiKit.COLOR_TEXT_MAIN);
        scriptOutput.setTextSize(12f);
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

        final LinearLayout uploadBox = BeloogaUiKit.createSubtleBox(this);
        final TextView uploadProgress = new TextView(this);
        uploadProgress.setText("Upload Progress: 0%");
        uploadProgress.setTextColor(BeloogaUiKit.COLOR_BRAND);
        uploadProgress.setTextSize(12.5f);
        uploadProgress.setTypeface(Typeface.DEFAULT_BOLD);
        uploadProgress.setContentDescription("mobile-studio-upload-progress");
        uploadBox.addView(uploadProgress);

        TextView chunkMeta = new TextView(this);
        chunkMeta.setText("Pipeline: [Chunk 1: H.264]  •  [Chunk 2: AAC]  •  [Chunk 3: FastStart MP4]");
        chunkMeta.setTextColor(BeloogaUiKit.COLOR_TEXT_MUTED);
        chunkMeta.setTextSize(10.5f);
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
        atsSummary.setTextSize(12f);
        atsCard.addView(atsSummary);
        contentContainer.addView(atsCard);
    }

    private void renderTrackerScreen() {
        BeloogaUiKit.updateNavTabsState(this, allTabs, tabTracker);
        contentContainer.removeAllViews();

        LinearLayout kpiRow = BeloogaUiKit.createRow(this, 9);
        kpiRow.addView(BeloogaUiKit.createMetricTile(this, "12", "Active Pipeline", BeloogaUiKit.COLOR_BRAND));
        kpiRow.addView(BeloogaUiKit.createMetricTile(this, "92%", "Avg ATS Match", BeloogaUiKit.COLOR_SUCCESS));
        kpiRow.addView(BeloogaUiKit.createMetricTile(this, "33%", "Interview Rate", BeloogaUiKit.COLOR_WARNING));
        contentContainer.addView(kpiRow);

        LinearLayout trackerCard = BeloogaUiKit.createSurfaceCard(this, "mobile-job-tracker-screen");
        LinearLayout badges = BeloogaUiKit.createRow(this, 5);
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
        heading.setTextSize(17f);
        heading.setTypeface(Typeface.DEFAULT_BOLD);
        heading.setContentDescription("mobile-tracker-title");
        trackerCard.addView(heading);

        EditText trackerSearchInput = new EditText(this);
        trackerSearchInput.setHint("Tìm kiếm công việc theo công ty / vị trí...");
        trackerSearchInput.setHintTextColor(BeloogaUiKit.COLOR_TEXT_MUTED);
        trackerSearchInput.setTextColor(BeloogaUiKit.COLOR_TEXT_MAIN);
        trackerSearchInput.setTextSize(12f);
        trackerSearchInput.setSingleLine(true);
        trackerSearchInput.setBackground(BeloogaUiKit.roundedDrawable(this, BeloogaUiKit.COLOR_SUBTLE, BeloogaUiKit.COLOR_BORDER, 1f, 10f));
        int tsPad = BeloogaUiKit.dp(this, 8f);
        trackerSearchInput.setPadding(tsPad, tsPad, tsPad, tsPad);
        trackerSearchInput.setContentDescription("mobile-tracker-search-input");
        LinearLayout.LayoutParams tsLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
        );
        tsLp.setMargins(0, BeloogaUiKit.dp(this, 6f), 0, BeloogaUiKit.dp(this, 6f));
        trackerSearchInput.setLayoutParams(tsLp);
        trackerCard.addView(trackerSearchInput);

        LinearLayout stageFilterRow = BeloogaUiKit.createRow(this, 5);
        String[] stageLabels = new String[]{"ALL", "SAVED", "APPLIED", "INTERVIEW", "OFFER"};
        for (int i = 0; i < stageLabels.length; i++) {
            String st = stageLabels[i];
            int bg = (i == 0) ? BeloogaUiKit.COLOR_BRAND_MUTED : BeloogaUiKit.COLOR_SUBTLE;
            int fg = (i == 0) ? BeloogaUiKit.COLOR_BRAND : BeloogaUiKit.COLOR_TEXT_MAIN;
            stageFilterRow.addView(BeloogaUiKit.createBadgePill(
                    this, st, fg, bg, BeloogaUiKit.COLOR_BORDER, "mobile-tracker-stage-filter-" + st
            ));
            if (i < stageLabels.length - 1) {
                stageFilterRow.addView(BeloogaUiKit.createSpacer(this, 4));
            }
        }
        trackerCard.addView(stageFilterRow);

        LinearLayout stripeBox = BeloogaUiKit.createSubtleBox(this);
        final TextView jobStatus = new TextView(this);
        jobStatus.setText("Stripe — Staff Mobile Engineer [APPLIED] (ATS Match: 92%)");
        jobStatus.setTextColor(BeloogaUiKit.COLOR_BRAND);
        jobStatus.setTextSize(13f);
        jobStatus.setTypeface(Typeface.DEFAULT_BOLD);
        jobStatus.setContentDescription("mobile-tracker-job-status-job_101");
        stripeBox.addView(jobStatus);

        TextView stripeMeta = new TextView(this);
        stripeMeta.setText("Comp: $210,000 USD  •  San Francisco / Remote  •  Referral Verified");
        stripeMeta.setTextColor(BeloogaUiKit.COLOR_TEXT_MUTED);
        stripeMeta.setTextSize(11f);
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

        LinearLayout goalCard = BeloogaUiKit.createBottomSheetDrawer(
                this,
                "Mục Tiêu Săn Việc & AI Job Matcher",
                "mobile-bottom-sheet-drawer"
        );
        LinearLayout goalBadges = BeloogaUiKit.createRow(this, 4);
        goalBadges.setContentDescription("mobile-career-goal-card");
        goalBadges.addView(BeloogaUiKit.createBadgePill(
                this, "PERSISTED CAREER GOAL (/v1/tracker/goals)", BeloogaUiKit.COLOR_BRAND, BeloogaUiKit.COLOR_BRAND_MUTED, BeloogaUiKit.COLOR_BORDER, null
        ));
        goalCard.addView(goalBadges);

        final TextView goalSummary = new TextView(this);
        goalSummary.setText("Target: Staff Distributed Systems  •  Skills: Golang, Python, PG16  •  Min $4,500/mo");
        goalSummary.setTextColor(BeloogaUiKit.COLOR_TEXT_MAIN);
        goalSummary.setTextSize(12f);
        goalSummary.setTypeface(Typeface.DEFAULT_BOLD);
        goalCard.addView(goalSummary);

        goalCard.addView(BeloogaUiKit.createActionButton(
                this,
                "Lưu Mục Tiêu Săn Việc (/v1/tracker/goals)",
                "mobile-save-career-goal-btn",
                BeloogaUiKit.COLOR_ELEVATED,
                BeloogaUiKit.COLOR_TEXT_HEADING,
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        goalSummary.setText("✓ Đã Lưu Mục Tiêu Bền Vững Xuống DB & Vault (Không mất khi tắt App)");
                        goalSummary.setTextColor(BeloogaUiKit.COLOR_SUCCESS);
                    }
                }
        ));

        goalCard.addView(BeloogaUiKit.createActionButton(
                this,
                "Nhờ AI Săn Job Phù Hợp (29k • Ví / MoMo)",
                "mobile-trigger-ai-job-match-btn",
                BeloogaUiKit.COLOR_BRAND,
                BeloogaUiKit.COLOR_TEXT_INVERSE,
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        goalSummary.setText("✓ AI Job Matcher (29k VND): Đã tìm thấy 3 Job khớp 96% ATS và đẩy vào Kanban!");
                        goalSummary.setTextColor(BeloogaUiKit.COLOR_SUCCESS);
                    }
                }
        ));
        contentContainer.addView(goalCard);

        LinearLayout pipelineCard = BeloogaUiKit.createSurfaceCard(this, "mobile-tracker-secondary-list");
        TextView pipeTitle = new TextView(this);
        pipeTitle.setText("Active Interviews & Offers");
        pipeTitle.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
        pipeTitle.setTextSize(14f);
        pipeTitle.setTypeface(Typeface.DEFAULT_BOLD);
        pipelineCard.addView(pipeTitle);

        LinearLayout linearBox = BeloogaUiKit.createSubtleBox(this);
        TextView lTitle = new TextView(this);
        lTitle.setText("Linear — Principal Product Engineer  [INTERVIEW]");
        lTitle.setTextColor(BeloogaUiKit.COLOR_TEXT_MAIN);
        lTitle.setTextSize(12f);
        lTitle.setTypeface(Typeface.DEFAULT_BOLD);
        linearBox.addView(lTitle);
        TextView lSub = new TextView(this);
        lSub.setText("$195,000 USD  •  ATS Match: 90%  •  Architecture Round Tomorrow");
        lSub.setTextColor(BeloogaUiKit.COLOR_TEXT_MUTED);
        lSub.setTextSize(10.5f);
        linearBox.addView(lSub);
        pipelineCard.addView(linearBox);

        LinearLayout anthropicBox = BeloogaUiKit.createSubtleBox(this);
        TextView aTitle = new TextView(this);
        aTitle.setText("Anthropic — Staff Distributed Systems  [OFFER RECEIVED]");
        aTitle.setTextColor(BeloogaUiKit.COLOR_SUCCESS);
        aTitle.setTextSize(12f);
        aTitle.setTypeface(Typeface.DEFAULT_BOLD);
        anthropicBox.addView(aTitle);
        TextView aSub = new TextView(this);
        aSub.setText("$240,000 USD  •  ATS Match: 96%  •  Deadline: Nov 05");
        aSub.setTextColor(BeloogaUiKit.COLOR_TEXT_MUTED);
        aSub.setTextSize(10.5f);
        anthropicBox.addView(aSub);
        pipelineCard.addView(anthropicBox);
        contentContainer.addView(pipelineCard);
    }

    private void renderCareerScreen() {
        BeloogaUiKit.updateNavTabsState(this, allTabs, tabCareer);
        MobileCareerScreens.renderCareerHub(this, contentContainer, careerSubTab, new BeloogaUiKit.SegmentSelectListener() {
            @Override
            public void onSelect(int index) {
                careerSubTab = index;
                renderCareerScreen();
            }
        });
    }

    private void renderWorkspaceScreen() {
        BeloogaUiKit.updateNavTabsState(this, allTabs, tabProfile);
        contentContainer.removeAllViews();

        contentContainer.addView(BeloogaUiKit.createSegmentedBar(
                this,
                new String[]{"Overview", "Timeline CRUD", "Alerts (3)", "Vault Auth"},
                workspaceSubTab,
                new BeloogaUiKit.SegmentSelectListener() {
                    @Override
                    public void onSelect(int index) {
                        workspaceSubTab = index;
                        renderWorkspaceScreen();
                    }
                }
        ));

        if (workspaceSubTab != 0) {
            MobileCareerScreens.renderWorkspaceSubTabContent(this, contentContainer, workspaceSubTab);
            return;
        }

        LinearLayout profileCard = BeloogaUiKit.createSurfaceCard(this, "mobile-workspace-profile-screen");
        LinearLayout badges = BeloogaUiKit.createRow(this, 5);
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
        heading.setTextSize(17f);
        heading.setTypeface(Typeface.DEFAULT_BOLD);
        heading.setContentDescription("mobile-workspace-heading");
        profileCard.addView(heading);

        LinearLayout idRow = BeloogaUiKit.createRow(this, 5);
        idRow.addView(BeloogaUiKit.createAvatarCircle(this, "AN", BeloogaUiKit.COLOR_BRAND_MUTED, BeloogaUiKit.COLOR_BRAND));
        LinearLayout idCol = new LinearLayout(this);
        idCol.setOrientation(LinearLayout.VERTICAL);
        TextView fullName = new TextView(this);
        fullName.setText("Alex Nguyen • Principal Distributed Systems Engineer");
        fullName.setTextColor(BeloogaUiKit.COLOR_TEXT_MAIN);
        fullName.setTextSize(13f);
        fullName.setTypeface(Typeface.DEFAULT_BOLD);
        idCol.addView(fullName);

        TextView userLabel = new TextView(this);
        userLabel.setText("@alexnguyen • Dual-Mode SecureStore Token Vault Active");
        userLabel.setTextColor(BeloogaUiKit.COLOR_BRAND);
        userLabel.setTextSize(11.5f);
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
        tlHeading.setText("Verified Career Trajectory, Education & Notifications");
        tlHeading.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
        tlHeading.setTextSize(14f);
        tlHeading.setTypeface(Typeface.DEFAULT_BOLD);
        timelineCard.addView(tlHeading);

        LinearLayout exp1 = BeloogaUiKit.createSubtleBox(this);
        TextView e1Title = new TextView(this);
        e1Title.setText("2023–Present  •  Principal Architect @ Belooga  [Experience]");
        e1Title.setTextColor(BeloogaUiKit.COLOR_TEXT_MAIN);
        e1Title.setTextSize(12f);
        e1Title.setTypeface(Typeface.DEFAULT_BOLD);
        exp1.addView(e1Title);
        TextView e1Sub = new TextView(this);
        e1Sub.setText("PostgreSQL 16 GIN Search, ConnectRPC Batching & React Native 0.88");
        e1Sub.setTextColor(BeloogaUiKit.COLOR_TEXT_MUTED);
        e1Sub.setTextSize(10.5f);
        exp1.addView(e1Sub);
        timelineCard.addView(exp1);

        LinearLayout edu1 = BeloogaUiKit.createSubtleBox(this);
        TextView edTitle = new TextView(this);
        edTitle.setText("B.Sc. Computer Science (GPA 3.9/4.0)  •  ACM ICPC Regional Winner  [Award]");
        edTitle.setTextColor(BeloogaUiKit.COLOR_SUCCESS);
        edTitle.setTextSize(11.5f);
        edTitle.setTypeface(Typeface.DEFAULT_BOLD);
        edu1.addView(edTitle);
        timelineCard.addView(edu1);

        timelineCard.addView(BeloogaUiKit.createActionButton(
                this,
                "Export 1-Click ATS PDF Resume",
                "mobile-workspace-export-pdf",
                BeloogaUiKit.COLOR_BRAND,
                BeloogaUiKit.COLOR_TEXT_INVERSE,
                null
        ));
        contentContainer.addView(timelineCard);

        LinearLayout postsCard = BeloogaUiKit.createSurfaceCard(this, "mobile-profile-posts-list");
        postsCard.addView(BeloogaUiKit.createActionButton(
                this,
                "+ Đăng Bài Viết Mới (/v1/posts)",
                "mobile-quick-post-open-btn",
                BeloogaUiKit.COLOR_BRAND,
                BeloogaUiKit.COLOR_TEXT_INVERSE,
                null
        ));

        LinearLayout postItem = BeloogaUiKit.createSubtleBox(this);
        postItem.setContentDescription("mobile-user-post-card-post-1");
        TextView pTitle = new TextView(this);
        pTitle.setText("[Career Insight] Scaling PostgreSQL 16 GIN TSVECTOR to 500k Profiles");
        pTitle.setTextColor(BeloogaUiKit.COLOR_TEXT_HEADING);
        pTitle.setTextSize(12f);
        pTitle.setTypeface(Typeface.DEFAULT_BOLD);
        postItem.addView(pTitle);

        LinearLayout postActions = BeloogaUiKit.createRow(this, 6);
        postActions.addView(BeloogaUiKit.createActionButton(
                this,
                "Edit Post",
                "mobile-user-post-edit-btn-post-1",
                BeloogaUiKit.COLOR_ELEVATED,
                BeloogaUiKit.COLOR_TEXT_HEADING,
                null
        ));
        postActions.addView(BeloogaUiKit.createSpacer(this, 6));
        postActions.addView(BeloogaUiKit.createActionButton(
                this,
                "Delete Post",
                "mobile-user-post-delete-btn-post-1",
                BeloogaUiKit.COLOR_WARNING,
                BeloogaUiKit.COLOR_TEXT_HEADING,
                null
        ));
        postItem.addView(postActions);
        postsCard.addView(postItem);
        contentContainer.addView(postsCard);

        LinearLayout postDrawer = BeloogaUiKit.createBottomSheetDrawer(this, "mobile-quick-post-drawer", "Đăng Bài Viết Mới (/v1/posts)");
        postDrawer.addView(BeloogaUiKit.createActionButton(
                this,
                "Đăng Bài Viết (/v1/posts)",
                "mobile-user-post-submit-btn",
                BeloogaUiKit.COLOR_BRAND,
                BeloogaUiKit.COLOR_TEXT_INVERSE,
                null
        ));
        contentContainer.addView(postDrawer);
    }
}
