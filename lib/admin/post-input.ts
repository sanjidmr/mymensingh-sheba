import type { PostKind } from '@/lib/catalog-types';

export interface AdminPostInput {
  kind: PostKind;
  titleBn: string;
  summaryBn: string;
  bodyBn: string;
  category: string;
  areaId: string;
  tags: string[];
  coverImageUrl: string;
  gallery: string[];
  authorName: string;
  authorPhone: string;
  whatsappNumber: string;
  price: string;
  conditionLabel: string;
  organizationBn: string;
  jobType: string;
  salaryMin: string;
  salaryMax: string;
  deadline: string;
}
