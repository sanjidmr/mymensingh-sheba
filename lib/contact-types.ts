/**
 * যোগাযোগ ফর্মের ডোমেইন: বিষয়ের অপশন, ইনপুট ভ্যালিডেশন ও বাংলা ত্রুটি-বার্তা।
 *
 * Validation is intentionally dependency-free and synchronous — the same
 * pattern the rest of the app uses (no react-hook-form, no zod on this page),
 * so the form stays lightweight and behaves identically on mobile.
 */

export type ContactSubject =
  | 'general'
  | 'service_info'
  | 'post_service'
  | 'correction'
  | 'complaint'
  | 'partnership'
  | 'other';

export interface ContactSubjectOption {
  value: ContactSubject;
  labelBn: string;
  hintBn: string;
}

export const CONTACT_SUBJECTS: ContactSubjectOption[] = [
  { value: 'general', labelBn: 'সাধারণ জিজ্ঞাসা', hintBn: 'প্ল্যাটফর্ম নিয়ে সাধারণ কোনো প্রশ্ন' },
  { value: 'service_info', labelBn: 'কোনো সেবা সম্পর্কে জানতে চাই', hintBn: 'নির্দিষ্ট সেবা কীভাবে কাজ করে' },
  { value: 'post_service', labelBn: 'নিজের সেবা পোস্ট করতে চাই', hintBn: 'আপনার সেবা মানুষের কাছে পৌঁছে দিতে চাইলে' },
  { value: 'correction', labelBn: 'কোনো তথ্য সংশোধন করতে চাই', hintBn: 'কোনো প্রোফাইল বা তথ্যে ভুল চোখে পড়লে' },
  { value: 'complaint', labelBn: 'সমস্যা / অভিযোগ জানাতে চাই', hintBn: 'অসুবিধা বা অসন্তোষের কথা জানাতে চাইলে' },
  { value: 'partnership', labelBn: 'Partnership / Business', hintBn: 'ব্যবসা বা অংশীদারিতা নিয়ে আলোচনা' },
  { value: 'other', labelBn: 'অন্যান্য', hintBn: 'উপরের কোনোটাতে না আসা কোনো বিষয়' },
];

export interface ContactFormValues {
  name: string;
  phone: string;
  email: string;
  subject: ContactSubject | '';
  message: string;
}

export type ContactField = keyof ContactFormValues;
export type ContactFieldErrors = Partial<Record<ContactField, string>>;

export const EMPTY_CONTACT_FORM: ContactFormValues = {
  name: '',
  phone: '',
  email: '',
  subject: '',
  message: '',
};

/** Bangladeshi mobile: 01[3-9] + 8 digits, tolerating +88 / 0088 / spaces / dashes. */
const BD_MOBILE_RE = /^(?:\+?88|0088)?0?1[3-9]\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const MESSAGE_MIN = 12;

/**
 * Validates a single field. Returns undefined when acceptable, so the form can
 * run it per-field on blur and across all fields on submit with one rule set.
 */
export function validateContactField(
  field: ContactField,
  values: ContactFormValues
): string | undefined {
  switch (field) {
    case 'name': {
      const name = values.name.trim();
      if (!name) return 'আপনার নাম লিখুন।';
      if (name.length < NAME_MIN) return `নাম কমপক্ষে ${NAME_MIN} অক্ষরের হতে হবে।`;
      return undefined;
    }
    case 'phone': {
      const phone = normalizeBdPhone(values.phone);
      if (!phone) return 'আপনার মোবাইল নম্বরটি লিখুন।';
      if (!BD_MOBILE_RE.test(phone)) return 'সঠিক মোবাইল নম্বর লিখুন (যেমন ০১৭১২৩৪৫৬৭৮)।';
      return undefined;
    }
    case 'email': {
      const email = values.email.trim();
      if (!email) return undefined; // optional field
      if (!EMAIL_RE.test(email)) return 'সঠিক ইমেইল ঠিকানা লিখুন।';
      return undefined;
    }
    case 'subject': {
      if (!values.subject) return 'একটি বিষয় নির্বাচন করুন।';
      return undefined;
    }
    case 'message': {
      const message = values.message.trim();
      if (!message) return 'আপনার বার্তাটি লিখুন।';
      if (message.length < MESSAGE_MIN) return `বার্তা কমপক্ষে ${MESSAGE_MIN} অক্ষরের হতে হবে।`;
      if (message.length > MESSAGE_MAX) return `বার্তা সর্বোচ্চ ${MESSAGE_MAX} অক্ষরের মধ্যে রাখুন।`;
      return undefined;
    }
    default:
      return undefined;
  }
}

/** Field order drives both the error summary order and the focus jump on submit. */
export const CONTACT_FIELD_ORDER: ContactField[] = ['name', 'phone', 'email', 'subject', 'message'];

export function validateContactForm(values: ContactFormValues): ContactFieldErrors {
  const errors: ContactFieldErrors = {};
  for (const field of CONTACT_FIELD_ORDER) {
    const error = validateContactField(field, values);
    if (error) errors[field] = error;
  }
  return errors;
}

export function hasContactErrors(errors: ContactFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** The FAQ quick-help block that sits directly under the form. */
export interface ContactFaqItem {
  questionBn: string;
  answerBn: string;
}

export const CONTACT_FAQS: ContactFaqItem[] = [
  {
    questionBn: 'কীভাবে Mymensingh Sheba-তে service post করব?',
    answerBn:
      'প্রথমে একটি অ্যাকাউন্ট খুলে নিন। এরপর আপনার প্রয়োজনীয় সেবার প্রোফাইল সেটআপ ফর্মটি পূরণ করুন — নাম, যোগাযোগের নম্বর, এলাকা ও কাজের বিবরণ দিন। ফর্ম জমা দেওয়ার পর আমাদের অ্যাডমিন টিম তথ্য যাচাই করে এবং যাচাই সম্পন্ন হলে আপনার সেবাটি সবার জন্য তালিকায় দেখা যাবে।',
  },
  {
    questionBn: 'কোনো ভুল তথ্য বা ভুল ছবি দেখলে কী করব?',
    answerBn:
      'প্রোফাইল পেজেই প্রতিটি কার্ডের উপরে থাকা রিপোর্ট/ফ্ল্যাগ বোতামে ট্যাপ করে সরাসরি জানাতে পারেন। বিষয়টি একাধিকবার দেখা গেলে আমরা সেটি যাচাই করে সংশোধন করে দিই। অথবা নিচের ফর্মে “কোনো তথ্য সংশোধন করতে চাই” বেছে নিয়ে লিখে পাঠাতে পারেন।',
  },
  {
    questionBn: 'কোনো service provider-এর সাথে কীভাবে যোগাযোগ করব?',
    answerBn:
      'যেকোনো প্রোফাইল পেজে সরাসরি যোগাযোগের বাটন ও ফোন নম্বর পাবেন। রক্তদাতাদের ক্ষেত্রে নম্বরটি কেবল তখনই দেখা যায় যখন তাঁরা নিজে যোগাযোগের অনুমতি দেন — নিরাপত্তার কারণে এটি সবসময় সক্রিয় থাকে না।',
  },
  {
    questionBn: 'আমার service বা category তালিকায় না থাকলে কী করব?',
    answerBn:
      'চিন্তা করবেন না। নিচের ফর্মে বিষয় হিসেবে “কোনো সেবা সম্পর্কে জানতে চাই” অথবা “অন্যান্য” বেছে নিয়ে আপনার service সম্পর্কে বিস্তারিত লিখে পাঠান। আমরা সেটি সম্ভব হলে যোগ করার ব্যবস্থা নেব।',
  },
  {
    questionBn: 'Mymensingh Sheba-এর সাথে partnership বা business করা যাবে কি?',
    answerBn:
      'অবশ্যই। আপনি একজন business owner, service provider বা সংস্থা হলে ফর্মে বিষয় হিসেবে “Partnership / Business” নির্বাচন করে আপনার পরিকল্পনা লিখে পাঠান। আমরা সম্ভাব্য সহযোগিতার বিষয়ে আপনার সাথে সরাসরি আলোচনা করব।',
  },
];

export const MESSAGE_MAX = 1500;
export const NAME_MIN = 3;

/** Strips the international prefix and separators so typing AND pasting both validate. */
export function normalizeBdPhone(raw: string): string {
  return raw
    .replace(/[^\d+]/g, '')
    .replace(/^\+?88/, '')
    .replace(/^0088/, '');
}

export function subjectLabelBn(subject: ContactSubject | ''): string {
  return CONTACT_SUBJECTS.find((o) => o.value === subject)?.labelBn ?? 'সাধারণ জিজ্ঞাসা';
}
