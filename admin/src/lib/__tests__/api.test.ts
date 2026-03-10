import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../api';
import { server } from '../../__tests__/mocks/server';
import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:9090/api/v1';

describe('api', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('get', () => {
    it('makes a GET request and returns parsed JSON', async () => {
      const data = await api.get<unknown[]>('/categories');
      expect(data).toBeDefined();
      expect(data).toBeInstanceOf(Array);
    });

    it('includes Authorization header when token exists', async () => {
      let capturedHeaders: Headers | null = null;

      server.use(
        http.get(`${API_BASE}/test-auth`, ({ request }) => {
          capturedHeaders = new Headers(request.headers);
          return HttpResponse.json({ ok: true });
        }),
      );

      localStorage.setItem('token', 'test-token-123');
      await api.get('/test-auth');

      expect(capturedHeaders?.get('Authorization')).toBe('Bearer test-token-123');
    });

    it('does not include Authorization header when no token', async () => {
      let capturedHeaders: Headers | null = null;

      server.use(
        http.get(`${API_BASE}/test-no-auth`, ({ request }) => {
          capturedHeaders = new Headers(request.headers);
          return HttpResponse.json({ ok: true });
        }),
      );

      await api.get('/test-no-auth');
      expect(capturedHeaders?.get('Authorization')).toBeNull();
    });
  });

  describe('post', () => {
    it('sends JSON body with POST method', async () => {
      let capturedBody: unknown = null;

      server.use(
        http.post(`${API_BASE}/test-post`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({ id: '1' });
        }),
      );

      await api.post('/test-post', { name: 'test' });
      expect(capturedBody).toEqual({ name: 'test' });
    });
  });

  describe('put', () => {
    it('sends JSON body with PUT method', async () => {
      let capturedMethod = '';

      server.use(
        http.put(`${API_BASE}/test-put`, ({ request }) => {
          capturedMethod = request.method;
          return HttpResponse.json({ ok: true });
        }),
      );

      await api.put('/test-put', { name: 'updated' });
      expect(capturedMethod).toBe('PUT');
    });
  });

  describe('delete', () => {
    it('sends DELETE request', async () => {
      let capturedMethod = '';

      server.use(
        http.delete(`${API_BASE}/test-delete`, ({ request }) => {
          capturedMethod = request.method;
          return new HttpResponse(null, { status: 204 });
        }),
      );

      await api.delete('/test-delete');
      expect(capturedMethod).toBe('DELETE');
    });
  });

  describe('error handling', () => {
    it('throws on non-ok response', async () => {
      server.use(
        http.get(`${API_BASE}/error-test`, () => {
          return HttpResponse.json({ message: 'Not Found' }, { status: 404 });
        }),
      );

      await expect(api.get('/error-test')).rejects.toThrow('Not Found');
    });

    it('clears token on 401 response', async () => {
      localStorage.setItem('token', 'expired-token');

      // Mock window.location
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { ...originalLocation, href: '' },
      });

      server.use(
        http.get(`${API_BASE}/unauthorized`, () => {
          return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }),
      );

      await expect(api.get('/unauthorized')).rejects.toThrow('Unauthorized');
      expect(localStorage.getItem('token')).toBeNull();

      // Restore
      Object.defineProperty(window, 'location', {
        writable: true,
        value: originalLocation,
      });
    });

    it('handles empty response body', async () => {
      server.use(
        http.delete(`${API_BASE}/empty-body`, () => {
          return new HttpResponse(null, { status: 200 });
        }),
      );

      const result = await api.delete('/empty-body');
      expect(result).toBeNull();
    });
  });
});
