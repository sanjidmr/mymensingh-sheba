export type AuthErrorFlow = 'login' | 'register' | 'google' | 'recovery' | 'password';

const FALLBACK_MESSAGES: Record<AuthErrorFlow, string> = {
  login: 'লগইন করা যায়নি। ইমেইল ও পাসওয়ার্ড যাচাই করে আবার চেষ্টা করুন।',
  register: 'অ্যাকাউন্ট তৈরি করা যায়নি। তথ্য যাচাই করে আবার চেষ্টা করুন।',
  google: 'Google দিয়ে লগইন করা যায়নি। আবার চেষ্টা করুন।',
  recovery: 'পাসওয়ার্ড পুনরুদ্ধারের নির্দেশনা পাঠানো যায়নি। তথ্য যাচাই করে আবার চেষ্টা করুন।',
  password: 'নতুন পাসওয়ার্ড সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।',
};

function getErrorDetails(error: unknown): { code: string; message: string } {
  if (typeof error === 'string') return { code: '', message: error };
  if (!error || typeof error !== 'object') return { code: '', message: '' };

  const details = error as { code?: unknown; message?: unknown };
  return {
    code: typeof details.code === 'string' ? details.code : '',
    message: typeof details.message === 'string' ? details.message : '',
  };
}

export function getAuthErrorMessage(error: unknown, flow: AuthErrorFlow): string {
  const { code, message } = getErrorDetails(error);
  const normalized = `${code} ${message}`.toLowerCase();
  const status =
    error && typeof error === 'object' && 'status' in error &&
    typeof error.status === 'number'
      ? error.status
      : undefined;
  let readableMessage: string;

  if (
    flow === 'login' &&
    /invalid_login_credentials|invalid_credentials|invalid login credentials|invalid credentials|email or password|user_not_found|user not found/.test(normalized)
  ) {
    readableMessage = 'ইমেইল বা পাসওয়ার্ড সঠিক নয়। এই ইমেইলে অ্যাকাউন্ট না থাকলে আগে রেজিস্ট্রেশন করুন।';
  } else if (
    flow === 'register' &&
    /user_already_exists|user already registered|user already exists|email_exists|email already registered|email already exists/.test(normalized)
  ) {
    readableMessage = 'এই ইমেইলে আগে থেকেই একটি অ্যাকাউন্ট আছে। লগইন করুন অথবা পাসওয়ার্ড ভুলে গেলে পাসওয়ার্ড পুনরুদ্ধার করুন।';
  } else if (/email_not_confirmed|email not confirmed|email address not confirmed/.test(normalized)) {
    readableMessage = 'আপনার ইমেইল ঠিকানা যাচাই করা হয়নি। ইমেইলে পাঠানো যাচাইকরণ লিংক থেকে যাচাই করে আবার চেষ্টা করুন।';
  } else if (/weak_password|password should be at least|password is too short/.test(normalized)) {
    readableMessage = 'পাসওয়ার্ডটি আরও শক্তিশালী করুন। কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড ব্যবহার করুন।';
  } else if (/same_password|password.*same as.*(old|current)|new password.*(same|different)/.test(normalized)) {
    readableMessage = 'নতুন পাসওয়ার্ডটি আগের পাসওয়ার্ড থেকে আলাদা হতে হবে।';
  } else if (/email_address_invalid|invalid email|email is invalid/.test(normalized)) {
    readableMessage = 'সঠিক ইমেইল ঠিকানা লিখুন।';
  } else if (/over_request_rate_limit|email rate limit|too many requests|rate limit/.test(normalized)) {
    readableMessage = 'অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।';
  } else if (/signup_disabled|signups not allowed|signup is disabled/.test(normalized)) {
    readableMessage = 'এই মুহূর্তে নতুন অ্যাকাউন্ট তৈরি করা যাচ্ছে না। পরে আবার চেষ্টা করুন।';
  } else if (/provider_disabled|unsupported provider|provider is not enabled/.test(normalized)) {
    readableMessage = 'Google দিয়ে লগইন বর্তমানে চালু নেই। ইমেইল ও পাসওয়ার্ড দিয়ে চেষ্টা করুন।';
  } else if (/failed to fetch|networkerror|network request failed|fetch failed/.test(normalized)) {
    readableMessage = `ইন্টারনেট সংযোগে সমস্যা হয়েছে। সংযোগ যাচাই করুন।${message ? ` কারণ: ${message}` : ''}`;
  } else if (/[\u0980-\u09FF]/.test(message)) {
    readableMessage = message;
  } else if (message) {
    readableMessage = `${FALLBACK_MESSAGES[flow]} কারণ: ${message}`;
  } else {
    readableMessage = FALLBACK_MESSAGES[flow];
  }

  const diagnostics = [
    status !== undefined ? `HTTP ${status}` : '',
    code ? `কোড ${code}` : '',
  ].filter(Boolean);
  return diagnostics.length
    ? `${readableMessage} (${diagnostics.join(' · ')})`
    : readableMessage;
}
