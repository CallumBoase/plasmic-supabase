import { orderBy as lodashOrderBy } from "lodash";

import type { OrderBy } from "./buildSupabaseQueryWithDynamicFilters";

import type { Rows } from "../types";

export default function clientSideOrderBy(orderBy: OrderBy[], data: Rows) {
  const orderByFields = orderBy.map((orderBy) => orderBy.fieldName);
  const orderByDirections = orderBy.map((orderBy) => orderBy.direction);
  return lodashOrderBy(data, orderByFields, orderByDirections);
}