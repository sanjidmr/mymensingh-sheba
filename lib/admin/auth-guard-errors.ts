const INVALID_SESSION_CODES = new Set([
  'invalid_refresh_token',
  'invalid_token',
  'jwt_expired',
  'refresh_token_already_used',
  'refresh_token_not_found',
  'session_not_found',
]);

export function isConfirmedInvalidSessionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const candidate = error as { status?: unknown; code?: unknown };
  return (
    candidate.status === 401 ||
    (typeof candidate.code === 'string' && INVALID_SESSION_CODES.has(candidate.code))
  );
}
