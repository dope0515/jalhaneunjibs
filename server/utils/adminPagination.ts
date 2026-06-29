export const ADMIN_PAGE_SIZE_DEFAULT = 12
export const ADMIN_PAGE_SIZE_MAX = 50
export const ADMIN_PAGE_SIZE_OPTIONS = [10, 12, 15, 20] as const

export function parseAdminPagination(query: Record<string, unknown>) {
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1)

  const parsedSize = parseInt(String(query.pageSize ?? ADMIN_PAGE_SIZE_DEFAULT), 10) || ADMIN_PAGE_SIZE_DEFAULT
  const pageSize = ADMIN_PAGE_SIZE_OPTIONS.includes(parsedSize as typeof ADMIN_PAGE_SIZE_OPTIONS[number])
    ? parsedSize
    : ADMIN_PAGE_SIZE_DEFAULT

  return {
    page,
    pageSize: Math.min(ADMIN_PAGE_SIZE_MAX, Math.max(1, pageSize)),
    skip: (page - 1) * pageSize,
  }
}

export function buildAdminPaginationMeta(total: number, page: number, pageSize: number) {
  return {
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  }
}
