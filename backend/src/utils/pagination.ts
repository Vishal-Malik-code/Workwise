export interface PaginationInput {
  page?: number | string;
  limit?: number | string;
}

export interface Pagination {
  page: number;
  limit: number;
  offset: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function getPagination(input: PaginationInput = {}): Pagination {
  let page = Number(input.page) || DEFAULT_PAGE;
  let limit = Number(input.limit) || DEFAULT_LIMIT;

  if (page < 1) page = DEFAULT_PAGE;
  if (limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  return { page, limit, offset: (page - 1) * limit };
}
