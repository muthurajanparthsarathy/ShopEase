/** Uniform outcome shape returned by every service mutation — mirrors the { success, message, data } pattern used across the codebase. */
export interface Result<T = void> {
  success: boolean;
  message: string;
  data?: T;
}
