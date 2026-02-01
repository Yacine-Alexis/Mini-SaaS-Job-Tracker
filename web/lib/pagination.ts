import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

export type Pagination = z.infer<typeof paginationQuerySchema>;

export interface SkipTake {
  skip: number;
  take: number;
}

export function toSkipTake(p: Pagination): SkipTake {
  return { skip: (p.page - 1) * p.pageSize, take: p.pageSize };
}
