const KNOWN_AUTOMATION_USER_AGENT =
  /bot|crawler|spider|slurp|headlesschrome|lighthouse|playwright|puppeteer|facebookexternalhit|slackbot|preview/i;

export type AnalyticsTrafficClass =
  | 'guest'
  | 'authenticated'
  | 'internal'
  | 'bot'
  | 'unidentified';

export function isKnownAutomationUserAgent(userAgent: string): boolean {
  return KNOWN_AUTOMATION_USER_AGENT.test(userAgent);
}

export function classifyAnalyticsTraffic(input: {
  role: string | null;
  userId: string | null;
  userAgent: string;
  stableVisitorId: boolean;
}): AnalyticsTrafficClass {
  if (input.role === 'admin' || input.role === 'news_editor') return 'internal';
  if (isKnownAutomationUserAgent(input.userAgent)) return 'bot';
  if (input.userId) return 'authenticated';
  return input.stableVisitorId ? 'guest' : 'unidentified';
}
