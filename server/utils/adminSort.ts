export type AdminSortDir = 'asc' | 'desc'

export function parseAdminSortDir(value: unknown): AdminSortDir {
  return value === 'asc' ? 'asc' : 'desc'
}

type OrderByBuilder = (dir: AdminSortDir) => Record<string, unknown>

export function buildAdminOrderBy(
  query: Record<string, unknown>,
  fields: Record<string, OrderByBuilder>,
  defaultField: string,
  defaultDir: AdminSortDir = 'desc',
) {
  const sortBy = String(query.sortBy ?? '')
  const hasExplicitSort = Boolean(sortBy && sortBy in fields)
  const field = hasExplicitSort ? sortBy : defaultField
  const dir = hasExplicitSort ? parseAdminSortDir(query.sortDir) : defaultDir

  return fields[field](dir)
}

export const RESTAURANT_SORT_FIELDS: Record<string, OrderByBuilder> = {
  id: (dir) => ({ id: dir }),
  name: (dir) => ({ name: dir }),
  foodCategory: (dir) => ({ foodCategory: dir }),
  region2: (dir) => ({ region2: dir }),
  status: (dir) => ({ status: dir }),
  averageRating: (dir) => ({ averageRating: dir }),
  reviewCount: (dir) => ({ reviewCount: dir }),
  viewCount: (dir) => ({ viewCount: dir }),
  createdAt: (dir) => ({ createdAt: dir }),
  registeredBy: (dir) => ({ registeredBy: { nickname: dir } }),
}

export const USER_SORT_FIELDS: Record<string, OrderByBuilder> = {
  id: (dir) => ({ id: dir }),
  nickname: (dir) => ({ nickname: dir }),
  email: (dir) => ({ email: dir }),
  role: (dir) => ({ role: dir }),
  status: (dir) => ({ status: dir }),
  createdAt: (dir) => ({ createdAt: dir }),
  registeredRestaurants: (dir) => ({ registeredRestaurants: { _count: dir } }),
  reviews: (dir) => ({ reviews: { _count: dir } }),
  comments: (dir) => ({ comments: { _count: dir } }),
  posts: (dir) => ({ posts: { _count: dir } }),
}

export const REVIEW_SORT_FIELDS: Record<string, OrderByBuilder> = {
  id: (dir) => ({ id: dir }),
  rating: (dir) => ({ rating: dir }),
  createdAt: (dir) => ({ createdAt: dir }),
  restaurant: (dir) => ({ restaurant: { name: dir } }),
  user: (dir) => ({ user: { nickname: dir } }),
}

export const COMMENT_SORT_FIELDS: Record<string, OrderByBuilder> = {
  id: (dir) => ({ id: dir }),
  createdAt: (dir) => ({ createdAt: dir }),
  restaurant: (dir) => ({ restaurant: { name: dir } }),
  user: (dir) => ({ user: { nickname: dir } }),
  replies: (dir) => ({ replies: { _count: dir } }),
}

export const POST_SORT_FIELDS: Record<string, OrderByBuilder> = {
  id: (dir) => ({ id: dir }),
  title: (dir) => ({ title: dir }),
  createdAt: (dir) => ({ createdAt: dir }),
  user: (dir) => ({ user: { nickname: dir } }),
  reply: (dir) => ({ reply: dir }),
}
