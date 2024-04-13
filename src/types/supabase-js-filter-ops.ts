//Appropriate filter operations in supabase-js, manually written from the docs

export const supabaseJsFilterOperators_oneArg = [
  'or',
] as const;

export type SupabaseJsFilterOperator_oneArg = typeof supabaseJsFilterOperators_oneArg[number];

export const supabaseJsFilterOperators_twoArg = [
  'eq',
  'neq',
  'gt',
  'lt',
  'gte',
  'lte',
  'is',
  //Other
  'like',
  'ilike',
  'in',//Array
  'contains',
  'containedBy',
  'rangeGt',
  'rangeGte',
  'rangeLt',
  'rangeLte',
  'rangeAdjacent',
  'overlaps',
  'match',//??
] as const;

export type SupabaseJsFilterOperator_twoArg = typeof supabaseJsFilterOperators_twoArg[number];

export const supabaseJsFilterOperators_threeArg = [
  'textSearch',
  'not',
  // 'filter'
] as const;

export type SupabaseJsFilterOperator_threeArg = typeof supabaseJsFilterOperators_threeArg[number];

export const supabaseJsFilterOperators_all = [
  ...supabaseJsFilterOperators_oneArg,
  ...supabaseJsFilterOperators_twoArg,
  ...supabaseJsFilterOperators_threeArg
]

export type SupabaseJsFilterOperator = typeof supabaseJsFilterOperators_all[number];


