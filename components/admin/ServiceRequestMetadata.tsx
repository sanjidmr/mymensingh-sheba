import { DetailField, Panel } from '@/components/admin/PageHeader';
import { getAreaById } from '@/lib/locations';
import {
  formatAnswersBn,
  getServiceRequestPage,
} from '@/lib/service-request-pages';

type MetadataRecord = Record<string, unknown>;

function asRecord(value: unknown): MetadataRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as MetadataRecord
    : null;
}

function collectText(value: unknown): string[] {
  if (typeof value === 'string' || typeof value === 'number') {
    const text = String(value).trim();
    return text ? [text] : [];
  }
  if (typeof value === 'boolean') return [value ? 'হ্যাঁ' : 'না'];
  if (Array.isArray(value)) return value.flatMap(collectText);
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(collectText);
  }
  return [];
}

function readAnswers(value: unknown): Record<string, string | string[]> {
  const record = asRecord(value);
  if (!record) return {};
  const answers: Record<string, string | string[]> = {};
  for (const [key, answer] of Object.entries(record)) {
    if (typeof answer === 'string') answers[key] = answer;
    else if (Array.isArray(answer) && answer.every((item) => typeof item === 'string')) {
      answers[key] = answer;
    }
  }
  return answers;
}

function locationDescription(value: unknown): string[] {
  const location = asRecord(value);
  if (!location) return [];
  const lines: string[] = [];
  const areaId = typeof location.areaId === 'string' ? location.areaId : '';
  const areaName = areaId ? getAreaById(areaId)?.nameBn ?? areaId : undefined;
  if (areaName) lines.push(`এলাকা: ${areaName}`);
  const labels: Record<string, string> = {
    house: 'বাড়ি / হোল্ডিং / ফ্ল্যাট',
    road: 'রোড',
    landmark: 'কাছের পরিচিত স্থান',
  };
  for (const [key, label] of Object.entries(labels)) {
    const valueText = collectText(location[key]).join(' · ');
    if (valueText) lines.push(`${label}: ${valueText}`);
  }
  if (location.geo && typeof location.geo === 'object') {
    lines.push('ম্যাপের লোকেশন পিন শেয়ার করা হয়েছে');
  }
  return lines;
}

export function ServiceRequestMetadata({
  serviceMeta,
  serviceSlug,
}: {
  serviceMeta: Record<string, unknown> | null;
  serviceSlug: string;
}) {
  if (!serviceMeta) return null;
  const config = getServiceRequestPage(serviceSlug);
  const answers = readAnswers(serviceMeta.answers);
  const fields: { label: string; value: string }[] = [];

  const alternativePhone = collectText(serviceMeta.altPhone).join(' · ');
  if (alternativePhone) fields.push({ label: 'বিকল্প ফোন', value: alternativePhone });

  const serviceTypeId = typeof serviceMeta.serviceTypeId === 'string'
    ? serviceMeta.serviceTypeId
    : '';
  if (config && serviceTypeId && !answers.serviceType) {
    const serviceType = config.serviceTypes.find((item) => item.id === serviceTypeId);
    if (serviceType) {
      fields.push({ label: config.serviceTypesLabel, value: serviceType.labelBn });
    }
  }

  const knownAnswerKeys = new Set([
    'serviceType',
    'serviceTypeCustom',
    ...(config?.fields.map((field) => field.name) ?? []),
    ...(config?.fields.map((field) => `${field.name}Custom`) ?? []),
  ]);
  if (config && Object.keys(answers).length > 0) {
    const answerLabels = [
      config.serviceTypesLabel,
      ...config.fields.map((field) => field.label),
    ].sort((left, right) => right.length - left.length);
    for (const line of formatAnswersBn(config, answers)) {
      const answerLabel = answerLabels.find((label) => line.startsWith(`${label} `));
      fields.push({
        label: answerLabel ?? 'অতিরিক্ত তথ্য',
        value: answerLabel ? line.slice(answerLabel.length).trim() : line,
      });
    }
  }

  const unknownAnswers = Object.entries(asRecord(serviceMeta.answers) ?? {})
    .filter(([key]) => !knownAnswerKeys.has(key))
    .flatMap(([, value]) => collectText(value));
  if (unknownAnswers.length > 0) {
    fields.push({ label: 'অন্যান্য ফর্মের তথ্য', value: unknownAnswers.join(' · ') });
  }

  const locations = asRecord(serviceMeta.locations);
  for (const [key, location] of Object.entries(locations ?? {})) {
    const description = locationDescription(location);
    if (description.length === 0) continue;
    const label = config?.locations.find((block) => block.key === key)?.label
      ?? (key === 'destination' ? 'গন্তব্যের ঠিকানা' : 'কাজের ঠিকানা');
    fields.push({ label, value: description.join('\n') });
  }

  const recognizedKeys = new Set(['altPhone', 'serviceTypeId', 'answers', 'locations', 'summaryBn']);
  const otherMetadata = Object.entries(serviceMeta)
    .filter(([key]) => !recognizedKeys.has(key))
    .flatMap(([, value]) => collectText(value));
  if (otherMetadata.length > 0) {
    fields.push({ label: 'অন্যান্য তথ্য', value: otherMetadata.join(' · ') });
  }

  if (fields.length === 0) return null;
  return (
    <Panel title="অতিরিক্ত ফর্ম তথ্য" className="mb-4">
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((field, index) => (
          <DetailField key={`${field.label}-${index}`} label={field.label} wide>
            <span className="whitespace-pre-line">{field.value}</span>
          </DetailField>
        ))}
      </dl>
    </Panel>
  );
}
