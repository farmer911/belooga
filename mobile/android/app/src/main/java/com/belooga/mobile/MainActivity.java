package com.belooga.mobile;

import android.app.Activity;
import android.graphics.Color;
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
    private TextView statusBanner;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        LinearLayout rootShell = new LinearLayout(this);
        rootShell.setOrientation(LinearLayout.VERTICAL);
        rootShell.setBackgroundColor(Color.rgb(9, 13, 22));
        rootShell.setContentDescription("mobile-root-shell");

        LinearLayout topBar = new LinearLayout(this);
        topBar.setOrientation(LinearLayout.VERTICAL);
        topBar.setPadding(40, 48, 40, 24);
        topBar.setBackgroundColor(Color.rgb(17, 24, 39));

        TextView brandTitle = new TextView(this);
        brandTitle.setText("BELOOGA MOBILE (RN 0.88.0)");
        brandTitle.setTextColor(Color.rgb(91, 187, 174));
        brandTitle.setTextSize(18f);
        brandTitle.setTypeface(Typeface.DEFAULT_BOLD);
        brandTitle.setContentDescription("mobile-brand-header");
        topBar.addView(brandTitle);

        statusBanner = new TextView(this);
        statusBanner.setText("Connected: SecureStore Vault Ready | API 10.0.2.2:8000");
        statusBanner.setTextColor(Color.rgb(148, 163, 184));
        statusBanner.setTextSize(12f);
        statusBanner.setContentDescription("mobile-connection-status");
        topBar.addView(statusBanner);

        rootShell.addView(topBar, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        ));

        ScrollView scrollArea = new ScrollView(this);
        contentContainer = new LinearLayout(this);
        contentContainer.setOrientation(LinearLayout.VERTICAL);
        contentContainer.setPadding(40, 32, 40, 32);
        contentContainer.setContentDescription("mobile-tabs-content");
        scrollArea.addView(contentContainer);

        LinearLayout.LayoutParams scrollParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                0,
                1f
        );
        rootShell.addView(scrollArea, scrollParams);

        LinearLayout bottomNav = new LinearLayout(this);
        bottomNav.setOrientation(LinearLayout.HORIZONTAL);
        bottomNav.setBackgroundColor(Color.rgb(17, 24, 39));
        bottomNav.setPadding(16, 16, 16, 24);
        bottomNav.setContentDescription("mobile-bottom-tab-bar");

        bottomNav.addView(createTabButton("Discover", "mobile-tab-discover", new Runnable() {
            @Override
            public void run() {
                renderDiscoverScreen();
            }
        }));
        bottomNav.addView(createTabButton("Pitch Studio", "mobile-tab-studio", new Runnable() {
            @Override
            public void run() {
                renderStudioScreen();
            }
        }));
        bottomNav.addView(createTabButton("Job Tracker", "mobile-tab-tracker", new Runnable() {
            @Override
            public void run() {
                renderTrackerScreen();
            }
        }));
        bottomNav.addView(createTabButton("Workspace", "mobile-tab-profile", new Runnable() {
            @Override
            public void run() {
                renderWorkspaceScreen();
            }
        }));

        rootShell.addView(bottomNav, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        ));

        setContentView(rootShell);
        renderDiscoverScreen();
    }

    private Button createTabButton(String label, String testId, final Runnable onTap) {
        Button btn = new Button(this);
        btn.setText(label);
        btn.setContentDescription(testId);
        btn.setTextSize(12f);
        btn.setTextColor(Color.rgb(248, 250, 252));
        btn.setBackgroundColor(Color.rgb(30, 41, 59));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        lp.setMargins(8, 0, 8, 0);
        btn.setLayoutParams(lp);
        btn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                onTap.run();
            }
        });
        return btn;
    }

    private LinearLayout createCard(String testId) {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setBackgroundColor(Color.rgb(17, 24, 39));
        card.setPadding(36, 36, 36, 36);
        card.setContentDescription(testId);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        lp.setMargins(0, 0, 0, 28);
        card.setLayoutParams(lp);
        return card;
    }

    private void renderDiscoverScreen() {
        contentContainer.removeAllViews();

        LinearLayout filterCard = createCard("mobile-search-filter-bar");
        TextView heading = new TextView(this);
        heading.setText("Talent Discovery & 60s Pitch Feed");
        heading.setTextColor(Color.rgb(248, 250, 252));
        heading.setTextSize(20f);
        heading.setTypeface(Typeface.DEFAULT_BOLD);
        heading.setContentDescription("mobile-discovery-heading");
        filterCard.addView(heading);

        EditText searchInput = new EditText(this);
        searchInput.setHint("Search skills (FastAPI, PostgreSQL, React Native)...");
        searchInput.setHintTextColor(Color.rgb(100, 116, 139));
        searchInput.setTextColor(Color.rgb(226, 232, 240));
        searchInput.setContentDescription("mobile-search-input");
        filterCard.addView(searchInput);
        contentContainer.addView(filterCard);

        LinearLayout candidateCard = createCard("mobile-candidate-card-alexnguyen");
        TextView name = new TextView(this);
        name.setText("Alex Nguyen (@alexnguyen)");
        name.setTextColor(Color.rgb(248, 250, 252));
        name.setTextSize(17f);
        name.setTypeface(Typeface.DEFAULT_BOLD);
        name.setContentDescription("mobile-candidate-name-alexnguyen");
        candidateCard.addView(name);

        TextView role = new TextView(this);
        role.setText("Principal Distributed Systems Engineer | Trust Score: 96%");
        role.setTextColor(Color.rgb(91, 187, 174));
        role.setTextSize(14f);
        role.setContentDescription("mobile-candidate-headline-alexnguyen");
        candidateCard.addView(role);

        TextView tags = new TextView(this);
        tags.setText("Skills: Python • FastAPI • PostgreSQL 16 • React Native 0.88");
        tags.setTextColor(Color.rgb(148, 163, 184));
        tags.setTextSize(13f);
        candidateCard.addView(tags);

        Button openBtn = new Button(this);
        openBtn.setText("Watch 60s Video Pitch & Timeline");
        openBtn.setContentDescription("mobile-open-candidate-alexnguyen");
        openBtn.setBackgroundColor(Color.rgb(91, 187, 174));
        openBtn.setTextColor(Color.rgb(15, 23, 42));
        openBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                renderCandidateDetailScreen();
            }
        });
        candidateCard.addView(openBtn);
        contentContainer.addView(candidateCard);
    }

    private void renderCandidateDetailScreen() {
        contentContainer.removeAllViews();
        LinearLayout detailCard = createCard("mobile-candidate-profile-screen");

        TextView title = new TextView(this);
        title.setText("Alex Nguyen — Verified Senior (96% Trust)");
        title.setTextColor(Color.rgb(248, 250, 252));
        title.setTextSize(19f);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setContentDescription("mobile-profile-fullname");
        detailCard.addView(title);

        TextView trajectory = new TextView(this);
        trajectory.setText("ConnectRPC Batch Loaded: 10 yrs exp • 1-Click PDF Export Ready");
        trajectory.setTextColor(Color.rgb(91, 187, 174));
        trajectory.setContentDescription("mobile-profile-trust-badge");
        detailCard.addView(trajectory);

        Button backBtn = new Button(this);
        backBtn.setText("Back to Talent Feed");
        backBtn.setContentDescription("mobile-candidate-back");
        backBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                renderDiscoverScreen();
            }
        });
        detailCard.addView(backBtn);
        contentContainer.addView(detailCard);
    }

    private void renderStudioScreen() {
        contentContainer.removeAllViews();
        LinearLayout studioCard = createCard("mobile-pitch-studio-screen");

        TextView heading = new TextView(this);
        heading.setText("60s Video Elevator Pitch Studio");
        heading.setTextColor(Color.rgb(248, 250, 252));
        heading.setTextSize(20f);
        heading.setTypeface(Typeface.DEFAULT_BOLD);
        heading.setContentDescription("mobile-studio-title");
        studioCard.addView(heading);

        final TextView scriptOutput = new TextView(this);
        scriptOutput.setText("AI Teleprompter Ready: Tap below to generate script or upload chunks.");
        scriptOutput.setTextColor(Color.rgb(148, 163, 184));
        scriptOutput.setContentDescription("mobile-studio-script-output");
        studioCard.addView(scriptOutput);

        Button genBtn = new Button(this);
        genBtn.setText("Generate AI Teleprompter Script");
        genBtn.setContentDescription("mobile-studio-generate-script");
        genBtn.setBackgroundColor(Color.rgb(37, 99, 235));
        genBtn.setTextColor(Color.WHITE);
        genBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                scriptOutput.setText("Pitch Script: Hi, I am Alex, a Staff Engineer specializing in sub-30ms PostgreSQL GIN search & React Native.");
            }
        });
        studioCard.addView(genBtn);

        final TextView uploadProgress = new TextView(this);
        uploadProgress.setText("Upload Progress: 0%");
        uploadProgress.setTextColor(Color.rgb(91, 187, 174));
        uploadProgress.setContentDescription("mobile-studio-upload-progress");
        studioCard.addView(uploadProgress);

        Button uploadBtn = new Button(this);
        uploadBtn.setText("Record & Upload 60s Pitch");
        uploadBtn.setContentDescription("mobile-studio-upload-chunks");
        uploadBtn.setBackgroundColor(Color.rgb(91, 187, 174));
        uploadBtn.setTextColor(Color.rgb(15, 23, 42));
        uploadBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                uploadProgress.setText("Upload Progress: 100% (3/3 Chunks Assembled)");
            }
        });
        studioCard.addView(uploadBtn);

        contentContainer.addView(studioCard);
    }

    private void renderTrackerScreen() {
        contentContainer.removeAllViews();
        LinearLayout trackerCard = createCard("mobile-job-tracker-screen");

        TextView heading = new TextView(this);
        heading.setText("Job Application Kanban Pipeline");
        heading.setTextColor(Color.rgb(248, 250, 252));
        heading.setTextSize(20f);
        heading.setTypeface(Typeface.DEFAULT_BOLD);
        heading.setContentDescription("mobile-tracker-title");
        trackerCard.addView(heading);

        final TextView jobStatus = new TextView(this);
        jobStatus.setText("Stripe — Staff Mobile Engineer [APPLIED] (ATS Match: 92%)");
        jobStatus.setTextColor(Color.rgb(91, 187, 174));
        jobStatus.setContentDescription("mobile-tracker-job-status-job_101");
        trackerCard.addView(jobStatus);

        Button moveInterviewBtn = new Button(this);
        moveInterviewBtn.setText("Advance to INTERVIEW");
        moveInterviewBtn.setContentDescription("mobile-tracker-move-job_101-INTERVIEW");
        moveInterviewBtn.setBackgroundColor(Color.rgb(91, 187, 174));
        moveInterviewBtn.setTextColor(Color.rgb(15, 23, 42));
        moveInterviewBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                jobStatus.setText("Stripe — Staff Mobile Engineer [INTERVIEW] (Synced)");
            }
        });
        trackerCard.addView(moveInterviewBtn);

        contentContainer.addView(trackerCard);
    }

    private void renderWorkspaceScreen() {
        contentContainer.removeAllViews();
        LinearLayout profileCard = createCard("mobile-workspace-profile-screen");

        TextView heading = new TextView(this);
        heading.setText("Candidate Workspace");
        heading.setTextColor(Color.rgb(248, 250, 252));
        heading.setTextSize(20f);
        heading.setTypeface(Typeface.DEFAULT_BOLD);
        heading.setContentDescription("mobile-workspace-heading");
        profileCard.addView(heading);

        TextView userLabel = new TextView(this);
        userLabel.setText("@alexnguyen • Dual-Mode SecureStore Token Vault Active");
        userLabel.setTextColor(Color.rgb(148, 163, 184));
        userLabel.setContentDescription("mobile-workspace-username");
        profileCard.addView(userLabel);

        contentContainer.addView(profileCard);
    }
}
