// useOptimisticOperations.ts
import { useCallback } from "react";
import clientSideOrderBy from "../../utils/clientSideOrderBy";
import type {
  SupabaseProviderFetchResult,
  OptimisticRow,
  OptimisticOperation,
  ReturnCountOptions,
  ElementActionName
} from "./types";
import type { OrderBy } from "../../utils/buildSupabaseQueryWithDynamicFilters";

export type UseOptimisticOperationsProps = {
  returnCount?: ReturnCountOptions;
  memoizedOrderBy: OrderBy[];
};

export type OptimisticMutateFunction = (
  currentData: SupabaseProviderFetchResult | undefined,
  optimisticRow: OptimisticRow
) => SupabaseProviderFetchResult;

export type BuildOptimisticFunc = (
  optimisticOperation: OptimisticOperation,
  elementActionName: ElementActionName
) => OptimisticMutateFunction;

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

      // Determine whether we are dealing with

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

  //Helper function to choose the correct optimistic operation function to run
  const buildOptimisticFunc : BuildOptimisticFunc  = useCallback(
    (
      optimisticOperation,
      elementActionName
    ) => {
      if (optimisticOperation === "insert") {
        return addRowOptimistically;
      } else if (optimisticOperation === "update") {
        return returnUnchangedData;
        // return editRowOptimistically;
      } else if (optimisticOperation === "delete") {
        return returnUnchangedData;
        // return deleteRowOptimistically;
      } else if (optimisticOperation === "replaceData") {
        return returnUnchangedData;
        // return replaceDataOptimistically;
      } else {
        //None of the above, but something was specified
        if (optimisticOperation) {
          throw new Error(`
              Invalid optimistic operation specified in "${elementActionName}" element action.
              You specified  "${optimisticOperation}" but the allowed values are "addRow", "editRow", "deleteRow", "replaceData" or left blank for no optimistic operation.
          `);
        }

        //Nothing specified, function that does not change data (ie no optimistic operation)
        return returnUnchangedData;
      }
    },
    [addRowOptimistically]
  );

  return { buildOptimisticFunc, returnUnchangedData, addRowOptimistically };
}
