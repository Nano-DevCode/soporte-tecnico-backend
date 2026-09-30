export interface DatabaseError extends Error {
  code?: string | number;
  detail?: string;
}
