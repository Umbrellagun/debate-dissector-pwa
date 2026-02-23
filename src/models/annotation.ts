import { FallacyCategory } from './fallacy';

export interface Annotation {
  id: string;
  fallacyId: string;
  fallacyCategory: FallacyCategory;
  color: string;
  note?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AnnotationMark {
  type: 'fallacy-annotation';
  annotationId: string;
  fallacyId: string;
  color: string;
}
