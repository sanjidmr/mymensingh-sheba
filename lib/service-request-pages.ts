/**
 * ============================================================================
 * Service Request Pages — content + form schema for the five "book a service"
 * pages: কাজের বুয়া · ইলেকট্রিশিয়ান · প্লাম্বার · বাসা পাল্টানো · এসি ও ফ্রিজ
 * ============================================================================
 *
 * WHY THIS FILE EXISTS
 * `components/service-request/ServiceRequestPage.tsx` is a renderer, not a page.
 * Everything a service can change — hero copy, photo, benefits, trust points,
 * form fields — lives here as data. Adding a sixth service means adding one
 * entry to `SERVICE_REQUEST_PAGES`, not writing a new page component.
 *
 * HONESTY CONTRACT (the same rule /about and /contact already follow)
 * Trust points describe what the product actually does: requests land in a real
 * admin board, location is restricted to Mymensingh City Corporation, and we do NOT claim
 * every provider is "verified" — the platform cannot verify tradespeople, so it
 * never says it does. Each trust point below was written against the real
 * implementation, not against a wish list.
 *
 * These pages deliberately show NO listings or provider cards. There is nothing
 * to browse: the user arrives with a problem and wants a request sent.
 */

export type RequestServiceSlug =
  | 'kajer-bua'
  | 'electrician'
  | 'plumber'
  | 'basha-paltano'
  | 'ac-fridge';

/** Controls the renderer in `ServiceRequestFormCard`. */
export type ServiceFieldKind =
  | 'text'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkboxes'
  | 'date'
  | 'number';

export interface ServiceFieldOption {
  value: string;
  label: string;
  /** Small secondary line inside a radio/check option. */
  hint?: string;
}

export interface ServiceField {
  /** Stable key — becomes a key in `service_meta.answers`. */
  name: string;
  label: string;
  kind: ServiceFieldKind;
  required?: boolean;
  placeholder?: string;
  /** Supporting line under the label or under the control. */
  hint?: string;
  options?: ServiceFieldOption[];
  /** Offer a clean free-text alternative after the predefined choices. */
  allowCustom?: boolean;
}

/** A location block inside the "ঠিকানা" section. */
export interface ServiceLocationBlock {
  /** 'work' is the primary block and always required. */
  key: 'work' | 'destination';
  label: string;
  helper: string;
  required: boolean;
}

export type ServiceTrustIcon =
  | 'map'
  | 'clipboard'
  | 'lock'
  | 'phone'
  | 'verify'
  | 'inbox';

export interface ServiceTrustPoint {
  icon: ServiceTrustIcon;
  title: string;
  body: string;
}

export interface ServiceHeroBenefit {
  title: string;
  body: string;
}

export interface ServiceRequestPageConfig {
  /** URL segment. Also the value written to `service_requests.service_slug`. */
  slug: RequestServiceSlug;
  /** Small chip above the H1. */
  eyebrow: string;
  title: string;
  /** One or two plain sentences — the promise, not a slogan. */
  description: string;
  metaTitle: string;
  metaDescription: string;

  /** Hero photo. `position` crops a shared source photo differently per service. */
  image: { src: string; alt: string; position: string };

  /** "কেন এটা দরকার" — what the service is for, in the hero. */
  benefits: ServiceHeroBenefit[];

  trustHeading: string;
  trustIntro: string;
  trustPoints: ServiceTrustPoint[];

  /** The primary choice, stored in `service_requests.service_type`. */
  serviceTypesLabel: string;
  serviceTypes: { id: string; labelBn: string }[];
  allowCustomServiceType?: boolean;

  /** One or more address blocks. */
  locations: ServiceLocationBlock[];

  /** Everything that varies below the address. */
  fields: ServiceField[];

  /** When false, the shared সময় (time-of-day) select is hidden. */
  showTimeField: boolean;
  dateLabel: string;
  /** Render a compact form-only page with an open-ended work description. */
  minimalForm?: boolean;
  /** Show a short image-led hero and form without the long trust-card section. */
  compactHero?: boolean;
  /** Require customers to explain the requested work in their own words. */
  requireDetails?: boolean;

  detailsLabel: string;
  detailsPlaceholder: string;
  detailsHint: string;
  photoHint: string;
}

/* -------------------------------------------------------------------------- */
/* Shared option lists                                                        */
/* -------------------------------------------------------------------------- */

const TIME_OF_DAY_OPTIONS: ServiceFieldOption[] = [
  { value: 'urgent', label: 'যত তাড়াতাড়ি সম্ভব' },
  { value: 'morning', label: 'সকাল (৯টা – ১২টা)' },
  { value: 'noon', label: 'দুপুর (১২টা – ৩টা)' },
  { value: 'afternoon', label: 'বিকেল (৩টা – ৬টা)' },
  { value: 'evening', label: 'সন্ধ্যা (৬টা – ৮টা)' },
  { value: 'night', label: 'রাত (৮টার পর)' },
];

const URGENCY_FIELD: ServiceField = {
  name: 'urgency',
  label: 'জরুরি কি না?',
  kind: 'radio',
  required: true,
  hint: 'জরুরি বললে অনুরোধটি আগের তালিকায় দেখানো হয়।',
  options: [
    { value: 'urgent', label: 'জরুরি', hint: 'যত তাড়াতাড়ি সম্ভব দরকার' },
    { value: 'normal', label: 'সাধারণ', hint: 'নির্ধারিত সময়ে করলেই হবে' },
  ],
};

/* -------------------------------------------------------------------------- */
/* Trust points                                                              */
/* -------------------------------------------------------------------------- */

/**
 * The four points every one of these services can honestly make. Service
 * specific pages add or reword rather than replace these, so the promise stays
 * consistent across the five pages.
 */
const CORE_TRUST: ServiceTrustPoint[] = [
  {
    icon: 'map',
    title: 'শুধু ময়মনসিংহ সিটি কর্পোরেশনের ভেতরে',
    body: 'ময়মনসিংহ সিটি কর্পোরেশন এলাকার তালিকা থেকে ঠিকানা বেছে নিতে হয়। শহরের বাইরের ঠিকানা এখানে গ্রহণ করা হয় না।',
  },
  {
    icon: 'lock',
    title: 'তথ্যের গোপনীয়তা',
    body: 'নাম, মোবাইল ও ঠিকানা শুধু এই অনুরোধটি সামলানোর জন্য ব্যবহার হয়। কোনো পাবলিক তালিকা বা প্রোফাইলে দেখানো হয় না।',
  },
  {
    icon: 'phone',
    title: 'মোবাইলেই যোগাযোগ',
    body: 'নম্বর দিয়েই অনুরোধ পাঠান। অবস্থা “যোগাযোগ হয়েছে”, “কাজ চলছে”, “সম্পন্ন” — এই ধাপগুলোতে আপডেট হয়।',
  },
  {
    icon: 'verify',
    title: 'যতটা সম্ভব তথ্য যাচাই',
    body: 'নম্বর ও ঠিকানা বাস্তব কিনা যাচাই করার চেষ্টা করা হয়। তবে প্রতিটি অনুরোধকে “যাচাইকৃত” বলে দাবি করা হয় না।',
  },
];

const REQUEST_INBOX_TRUST: ServiceTrustPoint = {
  icon: 'inbox',
  title: 'সরাসরি অনুরোধ তালিকায়',
  body: 'পাঠানো অনুরোধ সরাসরি আমাদের অনুরোধ বোর্ডে জমা হয়, তাই আলাদা করে ফোন বা ইমেইল করার দরকার নেই।',
};

const CUSTOM_REQUEST_TRUST: ServiceTrustPoint = {
  icon: 'clipboard',
  title: 'প্রয়োজন অনুযায়ী অনুরোধ',
  body: 'কাজের ধরন, সমস্যা ও সময় জিজ্ঞেস করে এমন একটি অনুরোধ পাঠান, যা সংশ্লিষ্ট কাজের লোকের সাথে মেলানোর জন্য ব্যবহৃত হয়।',
};

/* -------------------------------------------------------------------------- */
/* ১. কাজের বুয়া                                                             */
/* -------------------------------------------------------------------------- */

const KAJER_BUA: ServiceRequestPageConfig = {
  slug: 'kajer-bua',
  eyebrow: 'গৃহকর্মী সেবা',
  title: 'কাজের বুয়া',
  description:
    'ঘরের কাজের ধরন ও সময় জানিয়ে সেবা অনুরোধ পাঠান।',
  metaTitle: 'কাজের বুয়া সেবা অনুরোধ পাঠান | Mymensingh Sheba',
  metaDescription:
    'ময়মনসিংহ সিটি কর্পোরেশন এলাকায় কাজের বুয়ার অনুরোধ পাঠান — কাজের ধরন, শিফট ও সময় জিজ্ঞেস করে এমন ছক। মোবাইল নম্বর ও ঠিকানা দিয়ে অনুরোধ জমা দিন।',
  image: {
    src: '/kajerbua.jpg',
    alt: 'রান্নাঘরে কাজ করছেন একজন গৃহকর্মী',
    position: 'center',
  },
  benefits: [
    { title: 'কাজের ধরন জানান', body: 'রান্না, পরিষ্কার বা অন্য কাজ লিখুন।' },
    { title: 'সময় ও ঠিকানা দিন', body: 'কখন থেকে দরকার এবং কোথায়—তা জানান।' },
  ],
  trustHeading: 'কেন Mymensingh Sheba থেকে সেবা নেবেন?',
  trustIntro:
    'কাজের বুয়া খোঁজা মানে কারো সঙ্গে নিজের ঠিকানা ও পরিবারের তথ্য ভাগ করা। তাই আমরা যা করতে পারি তা-ই বলি, আর যা পারি না তা বলি না।',
  trustPoints: [
    CUSTOM_REQUEST_TRUST,
    {
      icon: 'map',
      title: 'শুধু ময়মনসিংহ সিটি কর্পোরেশনের ভেতরে',
      body: 'ময়মনসিংহ সিটি কর্পোরেশন এলাকার তালিকা থেকে ঠিকানা বেছে নিতে হয়। শহরের বাইরের ঠিকানা এখানে গ্রহণ করা হয় না।',
    },
    CORE_TRUST[1],
    {
      icon: 'lock',
      title: 'ঠিকানা শুধু কাজের জন্য',
      body: 'আপনার দেওয়া ঠিকানা কোনো পাবলিক তালিকায় দেখানো হয় না — শুধু আপনার অনুরোধটি সংশ্লিষ্ট কাজের লোকের সাথে মেলানোর জন্য ব্যবহার হয়।',
    },
    {
      icon: 'verify',
      title: 'যতটা সম্ভব তথ্য যাচাই',
      body: 'যে নম্বর ও ঠিকানা দেওয়া হয়, বাস্তব কিনা তা যাচাই করার চেষ্টা করা হয়। তবে প্রতিটি অনুরোধকে “যাচাইকৃত” বলে দাবি করা হয় না।',
    },
    REQUEST_INBOX_TRUST,
  ],
  serviceTypesLabel: 'কাজের বিবরণ',
  serviceTypes: [],
  locations: [
    {
      key: 'work',
      label: 'যে বাসায় কাজ দরকার',
      helper: 'কাজের বুয়া যে বাসায় আসবেন, সেই বাসার ঠিকানা।',
      required: true,
    },
  ],
  fields: [],
  showTimeField: true,
  dateLabel: 'কখন থেকে প্রয়োজন?',
  minimalForm: true,
  compactHero: true,
  requireDetails: true,
  detailsLabel: 'আপনার কাজ সম্পর্কে বিস্তারিত লিখুন',
  detailsPlaceholder: 'কী কাজ দরকার এবং আপনার বিশেষ কোনো নির্দেশনা থাকলে নিজের ভাষায় লিখুন।',
  detailsHint: 'আপনার প্রয়োজনীয় কাজটি নিজের ভাষায় লিখুন।',
  photoHint: 'কাজের বাসার ছবি দিলে জায়গা ও পরিবেশ বুঝতে সাহায্য হয়',
};

/* -------------------------------------------------------------------------- */
/* ২. ইলেকট্রিশিয়ান                                                          */
/* -------------------------------------------------------------------------- */

const ELECTRICIAN: ServiceRequestPageConfig = {
  slug: 'electrician',
  eyebrow: 'বিদ্যুৎ ও ওয়্যারিং সেবা',
  title: 'ইলেকট্রিশিয়ান',
  description:
    'ফ্যান, লাইট, সুইচ বা ওয়্যারিংয়ের সমস্যা জানিয়ে সেবা অনুরোধ পাঠান।',
  metaTitle: 'ইলেকট্রিশিয়ান সেবা অনুরোধ পাঠান | Mymensingh Sheba',
  metaDescription:
    'ময়মনসিংহে ইলেকট্রিশিয়ানের অনুরোধ পাঠান — সমস্যার ধরন, কোন জিনিসে সমস্যা, জরুরি না নিয়মিত, এবং ছবি সহ। মোবাইল ও ঠিকানা দিন।',
  image: {
    src: '/e&p.jpg',
    alt: 'বৈদ্যুতিক ওয়্যারিং নিয়ে কাজ করছেন একজন ইলেকট্রিশিয়ান',
    // Same source photo as প্লাম্বার; cropped to the wiring side so the two
    // service heroes do not read as the same picture.
    position: 'center 30%',
  },
  benefits: [
    { title: 'সমস্যা লিখে জানান', body: 'কোন জিনিসে সমস্যা, সংক্ষেপে লিখুন।' },
    { title: 'ছবি দিতে পারেন', body: 'ছবি থাকলে সমস্যাটি বুঝতে সুবিধা হয়।' },
  ],
  trustHeading: 'কেন Mymensingh Sheba থেকে সেবা নেবেন?',
  trustIntro:
    'বিদ্যুৎ নিয়ে কাজ চলে ঘরের ভেতরে। তাই প্রতিটি অনুরোধকে “যাচাইকৃত” বলে দাবি করা হয় না — যা সত্যি, তা-ই বলা হয়।',
  trustPoints: [
    {
      icon: 'clipboard',
      title: 'সমস্যা অনুযায়ী অনুরোধ',
      body: 'কোন জিনিসে সমস্যা, কী ধরনের ত্রুটি, জরুরি না নিয়মিত — সব জিজ্ঞেস করে এমন অনুরোধ পাঠান যা সংশ্লিষ্ট কাজের লোকের সাথে মেলানো যায়।',
    },
    CORE_TRUST[0],
    CORE_TRUST[1],
    CORE_TRUST[2],
    CORE_TRUST[3],
    REQUEST_INBOX_TRUST,
  ],
  serviceTypesLabel: 'কী ধরনের কাজ প্রয়োজন?',
  serviceTypes: [],
  allowCustomServiceType: true,
  locations: [
    {
      key: 'work',
      label: 'যে ঠিকানায় কাজ দরকার',
      helper: 'যে ঘর বা বাড়িতে বিদ্যুতের কাজ হবে, সেই ঠিকানা।',
      required: true,
    },
  ],
  fields: [
    {
      name: 'problemItems',
      label: 'কোন জিনিসে সমস্যা?',
      kind: 'checkboxes',
      required: true,
      allowCustom: true,
      hint: 'একাধিকটি বেছে নিতে পারেন।',
      options: [
        { value: 'fan_light', label: 'ফ্যান বা লাইট' },
        { value: 'switch_socket', label: 'সুইচ বোর্ড বা সকেট' },
        { value: 'wiring', label: 'ওয়্যারিং' },
        { value: 'main_meter', label: 'মেইন সুইচ বা মিটার' },
        { value: 'short_circuit', label: 'শর্ট সার্কিট' },
        { value: 'power_cut', label: 'বিদ্যুৎ চলে যাওয়া' },
        { value: 'geyser_ips', label: 'গিজার বা আইপিএস' },
        { value: 'other', label: 'অন্য কিছু' },
      ],
    },
    URGENCY_FIELD,
    {
      name: 'problemDetail',
      label: 'কী সমস্যা হয়েছে?',
      kind: 'textarea',
      required: true,
      placeholder:
        'যেমন—রান্নাঘরের সুইচ বোর্ড গরম হয়ে যায়, কিছুদিন ধরে ফ্যান আর আলো একসাথে জ্বলে যায়, বারবার বিদ্যুৎ চলে যাচ্ছে।',
      hint: 'কতদিন ধরে সমস্যা, কোন সময়ে বেশি হয় — এসব লিখলে দ্রুত বোঝা যায়।',
    },
  ],
  showTimeField: true,
  dateLabel: 'কবে দরকার?',
  minimalForm: true,
  compactHero: true,
  requireDetails: true,
  detailsLabel: 'আপনার কাজ সম্পর্কে বিস্তারিত লিখুন',
  detailsPlaceholder: 'সমস্যা এবং কী ধরনের কাজ দরকার তা নিজের ভাষায় লিখুন।',
  detailsHint: 'আপনার সমস্যা ও প্রয়োজনীয় কাজটি নিজের ভাষায় লিখুন।',
  photoHint: 'সমস্যার ছবি থাকলে ঐচ্ছিকভাবে যুক্ত করুন।',
};

/* -------------------------------------------------------------------------- */
/* ৩. প্লাম্বার                                                               */
/* -------------------------------------------------------------------------- */

const PLUMBER: ServiceRequestPageConfig = {
  slug: 'plumber',
  eyebrow: 'পানি ও প্লাম্বিং সেবা',
  title: 'প্লাম্বার',
  description:
    'পাইপ, বাথরুম বা পানির লাইনের সমস্যা জানিয়ে সেবা অনুরোধ পাঠান।',
  metaTitle: 'প্লাম্বার সেবা অনুরোধ পাঠান | Mymensingh Sheba',
  metaDescription:
    'ময়মনসিংহে প্লাম্বারের অনুরোধ পাঠান — কী সমস্যা, কোথায় সমস্যা, জরুরি না নিয়মিত এবং ছবি সহ। মোবাইল ও ঠিকানা দিয়ে অনুরোধ জমা দিন।',
  image: {
    src: '/e&p.jpg',
    alt: 'পানির পাইপ মেরামত করছেন একজন প্লাম্বার',
    // Same source photo as ইলেকট্রিশিয়ান; cropped to the pipe side.
    position: 'center 72%',
  },
  benefits: [
    { title: 'কোথায় সমস্যা জানান', body: 'পাইপ, নালি বা ফিটিংস—যেটিতে সমস্যা লিখুন।' },
    { title: 'ছবি দিতে পারেন', body: 'লিক বা সমস্যার ছবি দিলে বুঝতে সুবিধা হয়।' },
  ],
  trustHeading: 'কেন Mymensingh Sheba থেকে সেবা নেবেন?',
  trustIntro:
    'পানির সমস্যায় প্রায়ই জরুরি লাগে। তাই অনুরোধটি সরাসরি বোর্ডে পৌঁছে যায় এবং আলাদা করে ফোন বা ইমেইল করার দরকার হয় না।',
  trustPoints: [
    {
      icon: 'clipboard',
      title: 'সমস্যা অনুযায়ী অনুরোধ',
      body: 'কী সমস্যা, কোথায়, কতদিন ধরে — এসব লিখে দিলে সংশ্লিষ্ট কাজের লোকের সাথে দ্রুত মেলানো যায়।',
    },
    CORE_TRUST[0],
    CORE_TRUST[1],
    CORE_TRUST[2],
    CORE_TRUST[3],
    REQUEST_INBOX_TRUST,
  ],
  serviceTypesLabel: 'কী ধরনের কাজ প্রয়োজন?',
  serviceTypes: [],
  allowCustomServiceType: true,
  locations: [
    {
      key: 'work',
      label: 'যে ঠিকানায় কাজ দরকার',
      helper: 'পানির সমস্যা যে বাসায় বা প্রতিষ্ঠানে, সেই ঠিকানা।',
      required: true,
    },
  ],
  fields: [
    {
      name: 'problemPlace',
      label: 'কোথায় সমস্যা?',
      kind: 'checkboxes',
      required: true,
      allowCustom: true,
      hint: 'একাধিকটি বেছে নিতে পারেন।',
      options: [
        { value: 'pipe_line', label: 'পানির পাইপ বা লাইন' },
        { value: 'bathroom', label: 'বাথরুম বা টয়লেট' },
        { value: 'kitchen', label: 'রান্নাঘর বা সিঙ্ক' },
        { value: 'motor_pump', label: 'মোটর বা পাম্প' },
        { value: 'tank', label: 'পানির ট্যাংক' },
        { value: 'outdoor', label: 'ছাদ বা বাইরের লাইন' },
        { value: 'other', label: 'অন্যান্য' },
      ],
    },
    URGENCY_FIELD,
    {
      name: 'problemDetail',
      label: 'সমস্যার বিস্তারিত',
      kind: 'textarea',
      required: true,
      placeholder:
        'যেমন—রান্নাঘরের নিচে পাইপ থেকে পানি পড়ছে, বাথরুমের নালিতে পানি জমে থাকে, ট্যাংক থেকে পানি আসছে না।',
      hint: 'কতদিন ধরে, কখন বেশি হয় — এসব লিখলে ঠিক কী লাগবে বোঝা সহজ হয়।',
    },
  ],
  showTimeField: true,
  dateLabel: 'কবে দরকার?',
  minimalForm: true,
  compactHero: true,
  requireDetails: true,
  detailsLabel: 'আপনার কাজ সম্পর্কে বিস্তারিত লিখুন',
  detailsPlaceholder: 'সমস্যা এবং কী ধরনের কাজ দরকার তা নিজের ভাষায় লিখুন।',
  detailsHint: 'আপনার সমস্যা ও প্রয়োজনীয় কাজটি নিজের ভাষায় লিখুন।',
  photoHint: 'সমস্যার ছবি থাকলে ঐচ্ছিকভাবে যুক্ত করুন।',
};

/* -------------------------------------------------------------------------- */
/* ৪. বাসা পাল্টানো                                                            */
/* -------------------------------------------------------------------------- */

const BASHA_PALTANO: ServiceRequestPageConfig = {
  slug: 'basha-paltano',
  eyebrow: 'গৃহ ও ব্যাগেজ স্থানান্তর সেবা',
  title: 'বাসা পাল্টানো',
  description:
    'নতুন বাসায় উঠতে হবে — কী সরাতে হবে, কতটা মাল আছে, কোন তারিখে দরকার, সব এক ছকে লিখে দিন।',
  metaTitle: 'বাসা পাল্টানো সেবা অনুরোধ পাঠান | Mymensingh Sheba',
  metaDescription:
    'ময়মনসিংহে বাসা পাল্টানোর অনুরোধ পাঠান — বর্তমান ও নতুন ঠিকানা, কী কী জিনিস সরাতে হবে, পরিমাণ, তারিখ এবং প্রয়োজনীয় গাড়ি ও শ্রমিক।',
  image: {
    src: '/homechange.jpg',
    alt: 'বাসা পাল্টানোর সময় আসবাবাবল ও গাড়ি',
    position: 'center',
  },
  benefits: [
    { title: 'দুই ঠিকানাই লাগে', body: 'কোথা থেকে কোথায় যাচ্ছেন — দুটোই এক ছকে লিখে দিন।' },
    { title: 'মালের পরিমাণ আগেই বলা', body: 'অল্প না অনেক, আগেই বললে গাড়ি ও শ্রমিক ঠিকমতো সাজানো যায়।' },
    { title: 'তারিখ আগে জানা যায়', body: 'পড়ার দিনের আগেই সব সরিয়ে নতুন বাসায় পৌঁছে দেওয়া যায়।' },
  ],
  trustHeading: 'কেন Mymensingh Sheba থেকে সেবা নেবেন?',
  trustIntro:
    'বাসা পাল্টানোর মতো কাজে সবচেয়ে বেশি কষ্ট হয় অস্পষ্ট তথ্যে। তাই দুই ঠিকানা, মালের পরিমাণ ও তারিখ — সব লিখে দেওয়ার সুযোগ দেওয়া হয়।',
  trustPoints: [
    {
      icon: 'clipboard',
      title: 'পুরো ছক একবারে',
      body: 'বর্তমান ও নতুন ঠিকানা, কী সরাতে হবে, কতটা মাল আছে, কোন তারিখে — সব এক ছকে লেখা যায়।',
    },
    {
      icon: 'map',
      title: 'দুই ঠিকানাই ময়মনসিংহের ভেতরে',
      body: 'কোথা থেকে যেখানে যাচ্ছেন, দুই জায়গাই ময়মনসিংহ সিটি কর্পোরেশন এলাকার তালিকা থেকে বেছে নিতে হয়।',
    },
    CORE_TRUST[1],
    CORE_TRUST[2],
    CORE_TRUST[3],
    REQUEST_INBOX_TRUST,
  ],
  serviceTypesLabel: 'কী ধরনের কাজ প্রয়োজন?',
  allowCustomServiceType: true,
  serviceTypes: [
    { id: 'full_move', labelBn: 'পুরো বাসা পাল্টানো' },
    { id: 'small_items', labelBn: 'অল্প কিছু জিনিস সরানো' },
    { id: 'furniture_only', labelBn: 'শুধু আসবাবাবল' },
    { id: 'pickup_only', labelBn: 'শুধু তুলে দেওয়া' },
    { id: 'loading', labelBn: 'লোডিং বা আনলোডিং কাজ' },
    { id: 'storage', labelBn: 'মাল ভাণ্ডারে রাখা' },
  ],
  locations: [
    {
      key: 'work',
      label: 'বর্তমান ঠিকানা',
      helper: 'মাল যে বাসা থেকে উঠতে হবে, সেই বাসার ঠিকানা।',
      required: true,
    },
    {
      key: 'destination',
      label: 'নতুন ঠিকানা',
      helper: 'মাল যে বাসায় নিয়ে যেতে হবে, সেই বাসার ঠিকানা।',
      required: true,
    },
  ],
  fields: [
    {
      name: 'items',
      label: 'কী কী জিনিস সরাতে হবে?',
      kind: 'checkboxes',
      required: true,
      allowCustom: true,
      hint: 'একাধিকটি বেছে নিতে পারেন।',
      options: [
        { value: 'bed_furniture', label: 'বিছানা-ম্যাট্রেস ও ফার্নিচার' },
        { value: 'sofa_tv', label: 'সোফা ও টিভি' },
        { value: 'appliances', label: 'ফ্রিজ ও বৈদ্যুতিক যন্ত্র' },
        { value: 'kitchen_large', label: 'ওভেন বা ওয়াশিং মেশিন' },
        { value: 'wardrobe', label: 'ড্রেসিং বা ওয়ার্ড্রোব' },
        { value: 'junk', label: 'ভাঙা বা পুরোনো আসবাব' },
        { value: 'documents', label: 'ডায়মন্ড, বই ও কাগজপত্র' },
        { value: 'small_items', label: 'ছোট যন্ত্র ও টুকিটাকি' },
      ],
    },
    {
      name: 'volume',
      label: 'আনুমানিক জিনিসের পরিমাণ',
      kind: 'radio',
      required: true,
      options: [
        { value: 'light', label: 'অল্প কিছু', hint: 'এক ট্রাকের কম' },
        { value: 'medium', label: 'মাঝারি', hint: '১–২ ট্রাক' },
        { value: 'heavy', label: 'অনেক', hint: '২ ট্রাকের বেশি' },
        { value: 'whole_home', label: 'সারা ঘরের সব মালপত্র' },
      ],
    },
    {
      name: 'crew',
      label: 'প্রয়োজনীয় গাড়ি বা শ্রমিক',
      kind: 'checkboxes',
      hint: 'একাধিকটি বেছে নিতে পারেন।',
      options: [
        { value: 'pickup', label: 'পিকআপ গাড়ি' },
        { value: 'truck', label: 'ছোট ট্রাক' },
        { value: 'cart', label: 'কার্ট বা ঠেলাগাড়ি' },
        { value: 'labour', label: 'কয়েন শ্রমিক' },
        { value: 'full_hand', label: 'হালভাড়া হাত ধরা' },
        { value: 'all', label: 'সব লাগবে' },
      ],
    },
    {
      name: 'floorInfo',
      label: 'বাড়ির তলা ও লিফট',
      kind: 'text',
      placeholder: 'যেমন: ৪ তলা, লিফট নেই',
      hint: 'দুই বাসার তথ্য দিলে ভালো হয় — যেমন: নেমা থেকে ৩ তলা, লিফট আছে।',
    },
  ],
  showTimeField: true,
  dateLabel: 'কোন তারিখে প্রয়োজন?',
  detailsLabel: 'আপনার কাজ সম্পর্কে বিস্তারিত লিখুন',
  detailsPlaceholder:
    'যেমন—সমস্যাটি কী, কখন থেকে হচ্ছে, কী ধরনের কাজ প্রয়োজন ইত্যাদি লিখুন...',
  detailsHint: 'সিঁড়ি, লিফট, পার্কিং বা গাড়ি ঢোকার সমস্যা থাকলে এখানেই লিখুন।',
  photoHint: 'যা সরাতে হবে তার ছবি দিলে পরিমাণ ঠিক বোঝা যায়',
};

/* -------------------------------------------------------------------------- */
/* ৫. এসি ও ফ্রিজ মেরামত                                                       */
/* -------------------------------------------------------------------------- */

const AC_FRIDGE: ServiceRequestPageConfig = {
  slug: 'ac-fridge',
  eyebrow: 'শীতাতপ নিয়ন্ত্রণ সেবা',
  title: 'এসি ও ফ্রিজ মেরামত',
  description:
    'এসি বা ফ্রিজের সমস্যা জানিয়ে সহজে সেবা অনুরোধ পাঠান।',
  metaTitle: 'এসি ও ফ্রিজ মেরামত সেবা অনুরোধ পাঠান | Mymensingh Sheba',
  metaDescription:
    'ময়মনসিংহে এসি সার্ভিসিং বা ফ্রিজ মেরামতের অনুরোধ পাঠান — এসি নাকি ফ্রিজ, ব্র্যান্ড, সমস্যার ধরন, কতদিন ধরে সমস্যা এবং ছবি সহ।',
  image: {
    src: '/ac.png',
    alt: 'ঘরের দেয়ালে বাঁধানো একটি এয়ার কন্ডিশনার',
    position: 'center',
  },
  benefits: [
    { title: 'এসি বা ফ্রিজ বেছে নিন', body: 'একই ফর্মে দুটিরই অনুরোধ করা যায়।' },
    { title: 'সমস্যা সংক্ষেপে লিখুন', body: 'ব্র্যান্ড বা মডেল জানা থাকলে উল্লেখ করুন।' },
  ],
  trustHeading: 'কেন Mymensingh Sheba থেকে সেবা নেবেন?',
  trustIntro:
    'ব্র্যান্ড ও সমস্যার ধরন আগেই জানা থাকলে সঠিক যন্ত্র নিয়ে কেউ আসে। তাই সেবার ধরন ও ব্র্যান্ড জিজ্ঞেস করা হয়।',
  trustPoints: [
    {
      icon: 'clipboard',
      title: 'যন্ত্র অনুযায়ী অনুরোধ',
      body: 'এসি নাকি ফ্রিজ, ব্র্যান্ড কী, সমস্যার ধরন কী — সব লিখে দিলে সংশ্লিষ্ট যন্ত্র নিয়ে কেউ আসতে পারে।',
    },
    CORE_TRUST[0],
    CORE_TRUST[1],
    CORE_TRUST[2],
    CORE_TRUST[3],
    REQUEST_INBOX_TRUST,
  ],
  serviceTypesLabel: 'কী ধরনের কাজ প্রয়োজন?',
  serviceTypes: [],
  locations: [
    {
      key: 'work',
      label: 'যে ঠিকানায় সেবা দরকার',
      helper: 'যে বাসায় বা দোকানায় এসি বা ফ্রিজ আছে, সেই ঠিকানা।',
      required: true,
    },
  ],
  fields: [
    {
      name: 'appliance',
      label: 'এসি নাকি ফ্রিজ?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'ac', label: 'এসি' },
        { value: 'fridge', label: 'ফ্রিজ' },
        { value: 'both', label: 'দুটোই' },
      ],
    },
    {
      name: 'brand',
      label: 'ব্র্যান্ড বা মডেল',
      kind: 'text',
      placeholder: 'জানা থাকলে লিখুন (যেমন: ১.৫ টন এসি, ভোল্টাস ফ্রিজ)',
      hint: 'ব্র্যান্ড জানা থাকলে লিখুন — না জানলেও সমস্যা, ছবি দিলে কাজ হয়ে যায়।',
    },
    {
      name: 'issueTypes',
      label: 'সমস্যার ধরন',
      kind: 'checkboxes',
      required: true,
      allowCustom: true,
      hint: 'একাধিকটি বেছে নিতে পারেন।',
      options: [
        { value: 'not_cooling', label: 'ঠান্ডা করছে না' },
        { value: 'water_leak', label: 'পানি পড়ছে' },
        { value: 'noise', label: 'অস্বাভাবিক আওয়াজ' },
        { value: 'gas', label: 'গ্যাস বা রেফ্রিজারেন্টের সমস্যা' },
        { value: 'remote', label: 'রিমোট কাজ করছে না' },
        { value: 'power_off', label: 'ইউনিট বন্ধ হয়ে যায়' },
        { value: 'water_drip', label: 'পানা ও গিলিং' },
        { value: 'other', label: 'অন্যান্য' },
      ],
    },
    {
      name: 'issueDuration',
      label: 'কতদিন ধরে সমস্যা?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'today', label: 'আজ থেকেই' },
        { value: '1_2_days', label: '১–২ দিন ধরে' },
        { value: 'week', label: 'সপ্তাহ ধরে' },
        { value: 'month', label: 'মাস ধরে' },
        { value: 'long', label: 'অনেকদিন ধরে' },
      ],
    },
    {
      name: 'visitNeeded',
      label: 'বাসায় এসে সার্ভিস দরকার?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'home', label: 'হ্যাঁ, বাসায় এসে করতে হবে' },
        { value: 'workshop', label: 'না, ইউনিট সার্ভিসে নিয়ে যাওয়া যাবে' },
        { value: 'unsure', label: 'বলতে পারছি না' },
      ],
    },
  ],
  showTimeField: true,
  dateLabel: 'কবে দরকার?',
  minimalForm: true,
  compactHero: true,
  requireDetails: true,
  detailsLabel: 'আপনার কাজ সম্পর্কে বিস্তারিত লিখুন',
  detailsPlaceholder: 'এসি বা ফ্রিজের সমস্যা এবং কী কাজ দরকার তা নিজের ভাষায় লিখুন।',
  detailsHint: 'যন্ত্রের মডেল বা সমস্যা সম্পর্কে যা জানেন নিজের ভাষায় লিখুন।',
  photoHint: 'যন্ত্রের ছবি থাকলে ঐচ্ছিকভাবে যুক্ত করুন।',
};

/* -------------------------------------------------------------------------- */
/* Registry                                                                   */
/* -------------------------------------------------------------------------- */

export const SERVICE_REQUEST_PAGES: Record<RequestServiceSlug, ServiceRequestPageConfig> = {
  'kajer-bua': KAJER_BUA,
  electrician: ELECTRICIAN,
  plumber: PLUMBER,
  'basha-paltano': BASHA_PALTANO,
  'ac-fridge': AC_FRIDGE,
};

export const SERVICE_REQUEST_SLUGS = Object.keys(
  SERVICE_REQUEST_PAGES
) as RequestServiceSlug[];

export function getServiceRequestPage(
  slug: string
): ServiceRequestPageConfig | undefined {
  return SERVICE_REQUEST_PAGES[slug as RequestServiceSlug];
}

/** Options for the shared সময় (time-of-day) select. */
export const REQUEST_TIME_OPTIONS = TIME_OF_DAY_OPTIONS;

/**
 * Formats the per-service answers into a readable Bangla block that is appended
 * to `service_requests.details`.
 *
 * Why a text block and not raw JSON: the admin request screen renders `details`
 * verbatim, and an admin reading "ঘর মোছা ও পরিষ্কার · সকাল শিফট" acts faster than
 * one reading `{"extras":["cleaning"],"shift":"morning"}`. The structured copy
 * still goes into `service_meta` for anything that needs to query it later.
 */
export function formatAnswersBn(
  config: ServiceRequestPageConfig,
  answers: Record<string, string | string[]>
): string[] {
  const lines: string[] = [];

  const selectedType = config.serviceTypes.find((type) => type.id === answers.serviceType);
  if (selectedType) {
    lines.push(`${config.serviceTypesLabel} ${selectedType.labelBn}`);
  } else if (
    answers.serviceType === '__custom__' &&
    typeof answers.serviceTypeCustom === 'string' &&
    answers.serviceTypeCustom.trim()
  ) {
    lines.push(`${config.serviceTypesLabel} ${answers.serviceTypeCustom.trim()}`);
  }

  for (const field of config.fields) {
    const raw = answers[field.name];
    if (raw === undefined) continue;
    const values = Array.isArray(raw) ? raw : [raw];
    if (values.length === 0) continue;

    const label = values
      .map((value) => {
        if (field.kind === 'date') return value;
        if (value === '__custom__') {
          const custom = answers[`${field.name}Custom`];
          return typeof custom === 'string' ? custom.trim() : '';
        }
        const match = field.options?.find((option) => option.value === value);
        return match ? match.label : value;
      })
      .filter(Boolean)
      .join(', ');

    if (label) lines.push(`${field.label} ${label}`);
  }

  return lines;
}