// useOptimisticOperations.ts
import { useCallback } from "react";
import clientSideOrderBy from "./clientSideOrderBy";
import type {
  SupabaseProviderFetchResult,
  OptimisticRow,
  ReturnCountOptions
} from "../types";
import type { OrderBy } from "./buildSupabaseQueryWithDynamicFilters";

export type UseOptimisticOperationsProps = {
  returnCount?: ReturnCountOptions;
  memoizedOrderBy: OrderBy[];
};

export function useOptimisticOperations({
  returnCount,
  memoizedOrderBy,
}: UseOptimisticOperationsProps) {
  //Function that just returns the data unchanged
  //To pass in as an optimistic update function when no optimistic update is desired
  //Effectively disabling optimistic updates for the operation
  const returnUnchangedData = (
    currentData: SupabaseProviderFetchResult | undefined,
  ) => {
    if (!currentData) {
      return {
        data: null,
        count: null
      };
    }
    return currentData;
  }

  //Function for optimistic add of a row to existing data
  //Adds a new row to the end of the array
  //This will be sorted automatically by useEffect above
  const addRowOptimistically = useCallback(
    (
      currentData: SupabaseProviderFetchResult | undefined,
      optimisticRow: OptimisticRow
    ) => {

      if(!currentData) {
        currentData = { data: null, count: null}
      }

      const newData = {
        //Build a new array with existing data (if present) and the new optimistic row
        data: clientSideOrderBy(memoizedOrderBy, [
          ...(currentData.data || []),
          optimisticRow,
        ]),
        //Increment the count if count is enabled
        count: returnCount !== "none" ? (currentData.count || 0) + 1 : null,
      };
      return newData;
    },
    [returnCount, memoizedOrderBy]
  );

  return { returnUnchangedData, addRowOptimistically };
}
