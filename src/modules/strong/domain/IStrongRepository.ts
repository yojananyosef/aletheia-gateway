import type { StrongEntry } from './StrongEntry';

export interface IStrongRepository {
  getAll(): Promise<StrongEntry[]>;
  getById(id: string): Promise<StrongEntry | null>;
}
