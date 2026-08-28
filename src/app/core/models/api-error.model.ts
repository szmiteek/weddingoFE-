export interface ApiViolation {
  field: string;
  message: string;
}

export interface ApiError {
  timestamp: string;
  message: string;
  violations?: ApiViolation[];
}
