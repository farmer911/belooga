import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  USER_POST_CATEGORIES,
  commentOnUserPost,
  createUserPost,
  deleteUserPost,
  fetchUserPostsByUsername,
  likeUserPost,
  updateUserPost,
  userPostItemSchema,
} from '../src/hooks/use-mobile-user-posts';
import { mobileApiClient, setMobileFetchTransportForTesting } from '../src/services/api-client';

describe('[BEL-189] Mobile User Post Publishing, Edit/Delete & Profile Posts Feed Parity (#114)', () => {
  beforeEach(() => {
    setMobileFetchTransportForTesting(null);
  });

  afterEach(() => {
    setMobileFetchTransportForTesting(null);
  });

  it('validates user post categories and schema', () => {
    expect(USER_POST_CATEGORIES).toEqual([
      'Career Insight',
      'Interview Story',
      'Project Showcase',
      'Hiring Update',
    ]);

    const post = userPostItemSchema.parse({
      id: 'post-101',
      author_username: 'alexnguyen',
      title: 'Scaling PostgreSQL 16 GIN TSVECTOR to 500k Profiles',
      category: 'Career Insight',
      content: 'How we achieved sub-15ms P95 latency.',
      tags: ['PostgreSQL', 'FastAPI'],
      attachment_url: 'https://belooga.vn/posts/101',
      likes_count: 14,
      comments_count: 3,
    });
    expect(post.category).toBe('Career Insight');
    expect(post.tags.length).toBe(2);
  });

  it('lists, creates, edits, and deletes user posts via /v1/posts/*', async () => {
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
                id: 'post-1',
                author_username: 'alexnguyen',
                title: 'Initial Post',
                category: 'Career Insight',
                content: 'Body text',
                tags: ['Python'],
                attachment_url: null,
                likes_count: 5,
                comments_count: 1,
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (method === 'POST') {
        return new Response(
          JSON.stringify({
            id: 'post-2',
            author_username: 'alexnguyen',
            title: body?.title,
            category: body?.category ?? 'Project Showcase',
            content: body?.content,
            tags: body?.tags ?? [],
            attachment_url: body?.attachment_url ?? null,
            likes_count: 0,
            comments_count: 0,
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (method === 'PATCH') {
        return new Response(
          JSON.stringify({
            id: 'post-2',
            author_username: 'alexnguyen',
            title: body?.title ?? 'Updated Title',
            category: body?.category ?? 'Project Showcase',
            content: body?.content ?? 'Updated Body',
            tags: body?.tags ?? ['React Native'],
            attachment_url: body?.attachment_url ?? null,
            likes_count: 2,
            comments_count: 0,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(null, { status: 204 });
    }) as typeof fetch);

    const list = await fetchUserPostsByUsername('alexnguyen', mobileApiClient);
    expect(list.length).toBe(1);
    expect(calls[0]?.url).toContain('/v1/posts/user/alexnguyen');

    const created = await createUserPost(
      {
        title: 'Shipping RN 0.88 Clean APK',
        category: 'Project Showcase',
        content: 'Zero stale cache with aapt2 + d8 + apksigner v2.',
        tags: ['React Native', 'Android'],
        attachment_url: 'https://github.com/farmer911/belooga',
      },
      mobileApiClient
    );
    expect(created.id).toBe('post-2');
    expect(calls[1]?.method).toBe('POST');

    const edited = await updateUserPost(
      'post-2',
      {
        title: 'Shipping RN 0.88 Clean APK (v2)',
        content: 'Updated benchmarks.',
      },
      mobileApiClient
    );
    expect(edited.title).toContain('(v2)');
    expect(calls[2]?.url).toContain('/v1/posts/post-2');
    expect(calls[2]?.method).toBe('PATCH');

    const deleted = await deleteUserPost('post-2', mobileApiClient);
    expect(deleted.deleted).toBe(true);
    expect(calls[3]?.method).toBe('DELETE');
  });

  it('likes and comments on a user post via /v1/posts/{id}/like and /comments', async () => {
    setMobileFetchTransportForTesting((async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/like')) {
        return new Response(JSON.stringify({ id: 'post-1', likes_count: 6, liked: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(
        JSON.stringify({
          id: 'cmt-1',
          post_id: 'post-1',
          author_username: 'recruiter_anna',
          content: 'Great breakdown! Would love to chat.',
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    }) as typeof fetch);

    const likeRes = await likeUserPost('post-1', mobileApiClient);
    expect(likeRes.likes_count).toBe(6);

    const commentRes = await commentOnUserPost(
      'post-1',
      'Great breakdown! Would love to chat.',
      mobileApiClient
    );
    expect(commentRes.id).toBe('cmt-1');
  });

  it('wires all required #111/#114 accessibilityLabel & Android content-desc contracts', () => {
    const sectionSource = readFileSync(
      join(import.meta.dir, '../src/components/user-posts-section.tsx'),
      'utf8'
    );
    const javaSource = readFileSync(
      join(import.meta.dir, '../android/app/src/main/java/com/belooga/mobile/MainActivity.java'),
      'utf8'
    );

    const requiredIds = [
      'mobile-quick-post-open-btn',
      'mobile-quick-post-drawer',
      'mobile-user-post-submit-btn',
      'mobile-profile-posts-list',
      'mobile-user-post-card-',
      'mobile-user-post-edit-btn-',
      'mobile-user-post-delete-btn-',
    ];

    for (const id of requiredIds) {
      expect(sectionSource).toContain(id);
      expect(javaSource).toContain(id);
    }
  });
});
