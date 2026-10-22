import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  RECRUITER_PIPELINE_STAGES,
  addCandidateToRecruiterPipeline,
  buildRecruiterShortlistDossier,
  compareRecruiterCandidates,
  fetchRecruiterPipeline,
  recruiterComparisonResponseSchema,
  recruiterInviteInputSchema,
  recruiterPipelineItemSchema,
  sendRecruiterInterviewInvite,
  updateRecruiterPipelineItem,
} from '../src/hooks/use-mobile-recruiter-hub';
import { mobileApiClient, setMobileFetchTransportForTesting } from '../src/services/api-client';

describe('[BEL-185] Mobile B2B Recruiter Hub Parity (#110)', () => {
  beforeEach(() => {
    setMobileFetchTransportForTesting(null);
  });

  afterEach(() => {
    setMobileFetchTransportForTesting(null);
  });

  it('validates 5 canonical recruiter pipeline stages and item schema', () => {
    expect(RECRUITER_PIPELINE_STAGES).toEqual([
      'SHORTLISTED',
      'PITCH_REVIEWED',
      'INTERVIEW_INVITED',
      'OFFER_SENT',
      'HIRED',
    ]);

    const item = recruiterPipelineItemSchema.parse({
      id: 'pipe-1',
      username: 'phucnguyen',
      full_name: 'Nguyen Minh Phuc',
      headline: 'Principal Staff Engineer',
      job_title: 'Senior Full-Stack Engineer',
      stage: 'SHORTLISTED',
      ats_score: 94,
      recruiter_rating: 5,
      evaluation_notes: 'Strong system design & async DB',
      video_pitch_url: 'https://cdn.belooga.vn/pitch/phuc.mp4',
      contact_unlocked: false,
    });
    expect(item.stage).toBe('SHORTLISTED');
    expect(item.ats_score).toBe(94);
    expect(item.recruiter_rating).toBe(5);
  });

  it('fetches, adds, and updates candidates in /v1/recruiter/pipeline', async () => {
    const calls: Array<{ url: string; method: string; body?: Record<string, unknown> }> = [];
    setMobileFetchTransportForTesting((async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : undefined;
      calls.push({ url, method, body });

      if (method === 'GET') {
        return new Response(
          JSON.stringify({
            items: [
              {
                id: 'pipe-1',
                username: 'phucnguyen',
                full_name: 'Nguyen Minh Phuc',
                headline: 'Staff Engineer',
                job_title: 'Principal Engineer',
                stage: 'SHORTLISTED',
                ats_score: 94,
                recruiter_rating: 5,
                evaluation_notes: 'Top candidate',
                video_pitch_url: null,
                contact_unlocked: false,
              },
            ],
            total: 1,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (method === 'POST') {
        return new Response(
          JSON.stringify({
            id: 'pipe-2',
            username: body?.username,
            full_name: 'Pham Gia Huy',
            headline: 'Senior Frontend Engineer',
            job_title: body?.job_title,
            stage: 'SHORTLISTED',
            ats_score: 91,
            recruiter_rating: body?.recruiter_rating ?? 4,
            evaluation_notes: body?.evaluation_notes ?? '',
            video_pitch_url: null,
            contact_unlocked: false,
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          id: 'pipe-1',
          username: 'phucnguyen',
          full_name: 'Nguyen Minh Phuc',
          headline: 'Staff Engineer',
          job_title: 'Principal Engineer',
          stage: body?.stage ?? 'INTERVIEW_INVITED',
          ats_score: 94,
          recruiter_rating: body?.recruiter_rating ?? 5,
          evaluation_notes: body?.evaluation_notes ?? 'Moved to interview',
          video_pitch_url: null,
          contact_unlocked: true,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as typeof fetch);

    const list = await fetchRecruiterPipeline(mobileApiClient, 'Principal Engineer');
    expect(list.total).toBe(1);
    expect(calls[0]?.url).toContain('/v1/recruiter/pipeline?job_title=Principal+Engineer');

    const added = await addCandidateToRecruiterPipeline(mobileApiClient, {
      username: 'phamgiahuy',
      job_title: 'Principal Engineer',
      recruiter_rating: 5,
      evaluation_notes: 'Fast React Native delivery',
    });
    expect(added.username).toBe('phamgiahuy');
    expect(calls[1]?.method).toBe('POST');

    const updated = await updateRecruiterPipelineItem(mobileApiClient, 'pipe-1', {
      stage: 'INTERVIEW_INVITED',
      recruiter_rating: 5,
      evaluation_notes: 'Great pitch review',
    });
    expect(updated.stage).toBe('INTERVIEW_INVITED');
    expect(calls[2]?.url).toContain('/v1/recruiter/pipeline/pipe-1');
    expect(calls[2]?.method).toBe('PATCH');
  });

  it('compares 2-3 candidates side-by-side via POST /v1/recruiter/compare and exports shortlist dossier', async () => {
    setMobileFetchTransportForTesting((async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { jd_text?: string };
      return new Response(
        JSON.stringify({
          jd_summary: body.jd_text ?? 'Senior Full-Stack Engineer',
          winner_username: 'phucnguyen',
          candidates: [
            {
              username: 'phucnguyen',
              full_name: 'Nguyen Minh Phuc',
              headline: 'Principal Engineer',
              ats_score: 94,
              video_pitch_url: 'https://cdn.belooga.vn/pitch/phuc.mp4',
              matched_skills: ['Python', 'FastAPI', 'React'],
              missing_skills: [],
              years_experience: 6,
              expected_salary: '$2,800 - $3,500/mo',
              recruiter_rating: 5,
              evaluation_notes: 'Strong system design & async DB',
              key_differentiator: 'Full-stack architecture + 94% ATS match',
            },
            {
              username: 'phamgiahuy',
              full_name: 'Pham Gia Huy',
              headline: 'Senior FE Engineer',
              ats_score: 91,
              video_pitch_url: 'https://cdn.belooga.vn/pitch/huy.mp4',
              matched_skills: ['Python', 'React'],
              missing_skills: ['FastAPI'],
              years_experience: 5,
              expected_salary: '$2,500 - $3,000/mo',
              recruiter_rating: 4,
              evaluation_notes: 'Great frontend velocity',
              key_differentiator: 'High UI craft velocity',
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as typeof fetch);

    const matrix = await compareRecruiterCandidates(mobileApiClient, {
      usernames: ['phucnguyen', 'phamgiahuy'],
      jd_text: 'Senior Full-Stack Engineer with Python FastAPI React',
    });

    const parsed = recruiterComparisonResponseSchema.parse(matrix);
    expect(parsed.candidates.length).toBe(2);
    expect(parsed.winner_username).toBe('phucnguyen');

    const dossier = buildRecruiterShortlistDossier(parsed);
    expect(dossier).toContain('Nguyen Minh Phuc');
    expect(dossier).toContain('94%');
    expect(dossier).toContain('Pham Gia Huy');
  });

  it('sends 1-click interview invite with custom video prompt & B2B wallet unlock via POST /v1/recruiter/invite', async () => {
    const payload = recruiterInviteInputSchema.parse({
      username: 'phucnguyen',
      job_title: 'Senior Full-Stack Engineer',
      interview_datetime: '2026-10-25T14:00:00Z',
      offered_salary_range: '$3,000 - $3,600/mo',
      custom_video_prompt: 'Describe how you scale async PostgreSQL pipelines under 10x load.',
      unlock_contact_via_wallet: true,
    });

    setMobileFetchTransportForTesting((async () =>
      new Response(
        JSON.stringify({
          invite_id: 'inv-101',
          username: payload.username,
          job_title: payload.job_title,
          stage: 'INTERVIEW_INVITED',
          contact_unlocked: true,
          wallet_deducted_vnd: 49000,
          candidate_notification_sent: true,
          candidate_tracker_synced: true,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )) as typeof fetch);

    const res = await sendRecruiterInterviewInvite(mobileApiClient, payload);
    expect(res.stage).toBe('INTERVIEW_INVITED');
    expect(res.contact_unlocked).toBe(true);
    expect(res.wallet_deducted_vnd).toBe(49000);
    expect(res.candidate_notification_sent).toBe(true);
    expect(res.candidate_tracker_synced).toBe(true);
  });

  it('wires all required #107/#110 accessibilityLabel & Android content-desc contracts', () => {
    const sectionSource = readFileSync(
      join(import.meta.dir, '../src/components/recruiter-hub-section.tsx'),
      'utf8'
    );
    const javaSource = readFileSync(
      join(import.meta.dir, '../android/app/src/main/java/com/belooga/mobile/MobileCareerScreens.java'),
      'utf8'
    );

    const requiredIds = [
      'mobile-recruiter-hub-section',
      'mobile-recruiter-add-btn',
      'mobile-recruiter-pipeline-list',
      'mobile-recruiter-stage-btn-',
      'mobile-recruiter-comparison-card',
      'mobile-recruiter-compare-btn',
      'mobile-recruiter-invite-btn',
    ];

    for (const id of requiredIds) {
      expect(sectionSource).toContain(id);
      expect(javaSource).toContain(id);
    }
  });
});
