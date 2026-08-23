export interface PageInfo {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PageResult<T> extends PageInfo {
  items: T[];
  totalItems: number;
  perPage: number;
}

export function paginate<T>(items: T[], page: number, perPage = 8): PageResult<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const start = (currentPage - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    currentPage,
    totalPages,
    totalItems: items.length,
    perPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
}
