export const ALLOWED_BUCKETS_NAMES = [
  'avatars',
  'images-tickets',
  'pdfs',
  'images',
  'pdfs-response',
  'pdfs-request',
  'excels',
  'tools-images',
  'it-assets-images',
  'images-consumable',
] as const;

export type AllowedBucket = (typeof ALLOWED_BUCKETS_NAMES)[number];
