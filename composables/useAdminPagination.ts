export const ADMIN_PAGE_SIZE_OPTIONS = [10, 12, 15, 20] as const
export const ADMIN_PAGE_SIZE_DEFAULT = 12

export type AdminSortDir = 'asc' | 'desc'

function parsePageSize(value: unknown) {
  const fromQuery = parseInt(String(value || ADMIN_PAGE_SIZE_DEFAULT), 10)
  if (ADMIN_PAGE_SIZE_OPTIONS.includes(fromQuery as typeof ADMIN_PAGE_SIZE_OPTIONS[number])) {
    return fromQuery
  }
  return ADMIN_PAGE_SIZE_DEFAULT
}

export function useAdminListQuery(
  defaultSortField = 'createdAt',
  defaultSortDir: AdminSortDir = 'desc',
) {
  const route = useRoute()
  const router = useRouter()

  const currentPage = computed(() => Math.max(1, parseInt(String(route.query.page || '1'), 10) || 1))
  const pageSize = computed(() => parsePageSize(route.query.pageSize))

  const sortBy = computed(() => String(route.query.sortBy || defaultSortField))
  const sortDir = computed((): AdminSortDir => {
    if (!route.query.sortBy) return defaultSortDir
    return route.query.sortDir === 'asc' ? 'asc' : 'desc'
  })

  const listQuery = computed(() => ({
    page: currentPage.value,
    pageSize: pageSize.value,
    sortBy: route.query.sortBy || undefined,
    sortDir: route.query.sortDir || undefined,
  }))

  const goPage = (page: number) => {
    router.push({
      path: route.path,
      query: { ...route.query, page },
    })
  }

  const changePageSize = (size: number) => {
    router.push({
      path: route.path,
      query: { ...route.query, pageSize: size, page: 1 },
    })
  }

  const toggleSort = (field: string) => {
    const currentField = String(route.query.sortBy || defaultSortField)
    const currentDir: AdminSortDir = route.query.sortBy
      ? (route.query.sortDir === 'asc' ? 'asc' : 'desc')
      : defaultSortDir

    const nextDir: AdminSortDir = currentField === field && currentDir === 'asc' ? 'desc' : 'asc'

    router.push({
      path: route.path,
      query: {
        ...route.query,
        sortBy: field,
        sortDir: nextDir,
        page: 1,
      },
    })
  }

  return {
    ADMIN_PAGE_SIZE_OPTIONS,
    currentPage,
    pageSize,
    sortBy,
    sortDir,
    listQuery,
    goPage,
    changePageSize,
    toggleSort,
  }
}

export function useAdminPaginationMeta(
  data: Ref<{ total?: number; totalPages?: number } | null | undefined>,
  currentPage: Ref<number>,
  pageSize: Ref<number>,
) {
  const total = computed(() => data.value?.total ?? 0)
  const totalPages = computed(() => data.value?.totalPages ?? 1)

  const rangeStart = computed(() => {
    if (total.value === 0) return 0
    return (currentPage.value - 1) * pageSize.value + 1
  })

  const rangeEnd = computed(() => Math.min(currentPage.value * pageSize.value, total.value))

  return { total, totalPages, rangeStart, rangeEnd }
}
