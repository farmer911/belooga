import React, { useState } from 'react';
import {
  RECRUITER_PIPELINE_STAGES,
  type RecruiterComparisonResponse,
  type RecruiterPipelineStage,
  buildRecruiterShortlistDossier,
  useAddRecruiterCandidateMutation,
  useCompareRecruiterCandidatesMutation,
  useRecruiterPipelineQuery,
  useSendRecruiterInviteMutation,
  useUpdateRecruiterPipelineMutation,
} from '@/hooks/use-mobile-recruiter-hub';
import { ActionButton, BadgePill, BottomSheetDrawer, SurfaceCard } from '@/lib/native-runtime';
import { getSemanticTokens } from '@/theme/tokens';
import { TopCandidatesSection } from '@/components/top-candidates-section';

export function RecruiterHubSection() {
  const tokens = getSemanticTokens('dark');
  const [roleFilter, setRoleFilter] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newRoleTitle, setNewRoleTitle] = useState('Senior Full-Stack Engineer');
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>(['phucnguyen', 'phamgiahuy']);
  const [jdBenchmark, setJdBenchmark] = useState('Senior Full-Stack Engineer (Python, FastAPI, React)');
  const [comparisonResult, setComparisonResult] = useState<RecruiterComparisonResponse | null>(null);
  const [dossierSummary, setDossierSummary] = useState('');
  const [inviteTarget, setInviteTarget] = useState<string>('phucnguyen');
  const [inviteDatetime, setInviteDatetime] = useState('2026-10-25T14:00:00Z');
  const [inviteSalary, setInviteSalary] = useState('$3,000 - $3,600/mo');
  const [invitePrompt, setInvitePrompt] = useState('Walk through your async PostgreSQL & Redis scaling.');
  const [unlockViaWallet, setUnlockViaWallet] = useState(true);

  const pipelineQuery = useRecruiterPipelineQuery(roleFilter || undefined);
  const addMutation = useAddRecruiterCandidateMutation();
  const updateStageMutation = useUpdateRecruiterPipelineMutation();
  const compareMutation = useCompareRecruiterCandidatesMutation();
  const inviteMutation = useSendRecruiterInviteMutation();

  const items = pipelineQuery.data?.items ?? [];
  const inputStyle: React.CSSProperties = {
    backgroundColor: tokens.surface.elevated,
    color: tokens.typography.main,
    border: `1px solid ${tokens.surface.border}`,
    borderRadius: 12,
    padding: '10px 12px',
  };

  const toggleCompareUsername = (username: string) => {
    setSelectedForCompare((prev) =>
      prev.includes(username) ? prev.filter((u) => u !== username) : prev.length < 3 ? [...prev, username] : prev
    );
  };

  const nextStage = (current: RecruiterPipelineStage): RecruiterPipelineStage => {
    const idx = RECRUITER_PIPELINE_STAGES.indexOf(current);
    return RECRUITER_PIPELINE_STAGES[(idx + 1) % RECRUITER_PIPELINE_STAGES.length] ?? 'SHORTLISTED';
  };

  return (
    <div
      data-testid="mobile-recruiter-hub-section"
      aria-label="mobile-recruiter-hub-section"
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <SurfaceCard testID="mobile-recruiter-header-card" mode="dark">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 17, color: tokens.typography.heading }}>
            B2B Recruiter Hiring Command Center (/recruiter/hub)
          </h2>
          <BadgePill label={`${items.length} Pipeline`} tone="brand" />
        </div>
        <input
          aria-label="mobile-recruiter-role-filter-input"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          placeholder="Filter by role (e.g., Principal Engineer)..."
          style={inputStyle}
        />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            aria-label="mobile-recruiter-add-username-input"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="Candidate @username..."
            style={{ ...inputStyle, flex: 1 }}
          />
          <ActionButton
            testID="mobile-recruiter-add-btn"
            accessibilityLabel="mobile-recruiter-add-btn"
            label="+ Shortlist"
            disabled={addMutation.isPending}
            onPress={() => {
              if (!newUsername.trim()) return;
              addMutation.mutate({
                username: newUsername.trim(),
                job_title: newRoleTitle.trim() || 'Senior Full-Stack Engineer',
                recruiter_rating: 5,
              });
              setNewUsername('');
            }}
          />
        </div>
      </SurfaceCard>

      <SurfaceCard testID="mobile-recruiter-pipeline-card" mode="dark">
        <strong style={{ fontSize: 14, color: tokens.typography.heading }}>
          5-Stage Hiring Pipeline (Shortlisted -&gt; Hired)
        </strong>
        <div
          data-testid="mobile-recruiter-pipeline-list"
          aria-label="mobile-recruiter-pipeline-list"
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              data-testid={`recruiter-pipeline-card-${item.id}`}
              style={{
                padding: 12,
                borderRadius: 12,
                backgroundColor: tokens.surface.elevated,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <ActionButton
                  testID={`recruiter-compare-checkbox-${item.username}`}
                  accessibilityLabel={`recruiter-compare-checkbox-${item.username}`}
                  variant="secondary"
                  label={`[${selectedForCompare.includes(item.username) ? 'x' : ' '}] ${item.full_name} (@${item.username})`}
                  onPress={() => toggleCompareUsername(item.username)}
                />
                <BadgePill label={`${item.ats_score}% ATS`} tone="success" />
              </div>
              <span style={{ fontSize: 12, color: tokens.typography.body }}>
                {item.job_title} • Stage: {item.stage} • Rating: {item.recruiter_rating}/5
              </span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <ActionButton
                  testID={`mobile-recruiter-stage-btn-${item.id}`}
                  accessibilityLabel={`mobile-recruiter-stage-btn-${item.id}`}
                  label={`Advance -> ${nextStage(item.stage)}`}
                  variant="secondary"
                  onPress={() =>
                    updateStageMutation.mutate({ itemId: item.id, input: { stage: nextStage(item.stage) } })
                  }
                />
                <ActionButton
                  testID={`recruiter-invite-open-btn-${item.username}`}
                  accessibilityLabel={`recruiter-invite-open-btn-${item.username}`}
                  label="Select for Invite"
                  variant="accent"
                  onPress={() => {
                    setInviteTarget(item.username);
                    setNewRoleTitle(item.job_title);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard testID="mobile-recruiter-comparison-card" mode="dark">
        <div aria-label="mobile-recruiter-comparison-card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <strong style={{ fontSize: 14, color: tokens.typography.heading }}>
            Side-by-Side Candidate Comparison ({selectedForCompare.length}/3 Selected)
          </strong>
          <input
            aria-label="recruiter-compare-jd-input"
            value={jdBenchmark}
            onChange={(e) => setJdBenchmark(e.target.value)}
            placeholder="Benchmark JD text..."
            style={inputStyle}
          />
          <ActionButton
            testID="mobile-recruiter-compare-btn"
            accessibilityLabel="mobile-recruiter-compare-btn"
            label={`Compare (${selectedForCompare.length}) Candidates`}
            disabled={compareMutation.isPending}
            onPress={() => {
              if (selectedForCompare.length < 2) return;
              compareMutation.mutate(
                { usernames: selectedForCompare.slice(0, 3), jd_text: jdBenchmark },
                {
                  onSuccess: (res) => {
                    setComparisonResult(res);
                    setDossierSummary(buildRecruiterShortlistDossier(res));
                  },
                }
              );
            }}
          />
          {comparisonResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {comparisonResult.candidates.map((cand) => (
                <div key={cand.username} style={{ padding: 10, borderRadius: 10, backgroundColor: tokens.surface.elevated }}>
                  <strong>{cand.full_name} (@{cand.username}) — {cand.ats_score}% ATS • {cand.expected_salary}</strong>
                  <div style={{ fontSize: 12, color: tokens.status.success }}>Matched: {cand.matched_skills.join(', ') || 'Core'}</div>
                  <div style={{ fontSize: 12, color: tokens.status.warning }}>Gap: {cand.missing_skills.join(', ') || 'None'}</div>
                </div>
              ))}
              {dossierSummary ? <pre aria-label="recruiter-dossier-preview" style={{ margin: 0, fontSize: 11, color: tokens.typography.body }}>{dossierSummary}</pre> : null}
            </div>
          ) : null}
        </div>
      </SurfaceCard>

      <BottomSheetDrawer testID="mobile-recruiter-invite-drawer" title={`1-Click Interview Invite & B2B Unlock (@${inviteTarget})`}>
        <input aria-label="recruiter-invite-job-input" value={newRoleTitle} onChange={(e) => setNewRoleTitle(e.target.value)} style={inputStyle} />
        <input aria-label="recruiter-invite-datetime-input" value={inviteDatetime} onChange={(e) => setInviteDatetime(e.target.value)} style={inputStyle} />
        <input aria-label="recruiter-invite-salary-input" value={inviteSalary} onChange={(e) => setInviteSalary(e.target.value)} style={inputStyle} />
        <input aria-label="recruiter-invite-prompt-input" value={invitePrompt} onChange={(e) => setInvitePrompt(e.target.value)} style={inputStyle} />
        <ActionButton
          testID="recruiter-invite-wallet-toggle"
          accessibilityLabel="recruiter-invite-wallet-toggle"
          variant="secondary"
          label={`[${unlockViaWallet ? 'x' : ' '}] Unlock Direct Contact via B2B Wallet (49,000 VND)`}
          onPress={() => setUnlockViaWallet((v) => !v)}
        />
        <ActionButton
          testID="mobile-recruiter-invite-btn"
          accessibilityLabel="mobile-recruiter-invite-btn"
          label="Send 1-Click Invite & Unlock Contact"
          disabled={inviteMutation.isPending}
          onPress={() =>
            inviteMutation.mutate({
              username: inviteTarget,
              job_title: newRoleTitle,
              interview_datetime: inviteDatetime,
              offered_salary_range: inviteSalary,
              custom_video_prompt: invitePrompt,
              unlock_contact_via_wallet: unlockViaWallet,
            })
          }
        />
      </BottomSheetDrawer>
      <TopCandidatesSection />
    </div>
  );
}
