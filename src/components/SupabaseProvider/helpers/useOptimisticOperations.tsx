// useOptimisticOperations.ts
import { useCallback } from "react";
import clientSideOrderBy from "./clientSideOrderBy";
import type {
  SupabaseProviderFetchResult,
  OptimisticRow,
  ReturnCountOptions,
} from "../types";
import type { OrderBy } from "./buildSupabaseQueryWithDynamicFilters";

export type UseOptimisticOperationsProps = {
  returnCount?: ReturnCountOptions;
  uniqueIdentifierField: string;
  memoizedOrderBy: OrderBy[];
};

export function useOptimisticOperations({
  returnCount,
  uniqueIdentifierField,
  memoizedOrderBy,
}: UseOptimisticOperationsProps) {
  //Function that just returns the data unchanged
  //To pass in as an optimistic update function when no optimistic update is desired
  //Effectively disabling optimistic updates for the operation
  const returnUnchangedData = (
    currentData: SupabaseProviderFetchResult | undefined
  ) => {
    if (!currentData) {
      return {
        data: null,
        count: null,
      };
    }
    return currentData;
  };

  //Function for optimistic add of a row to existing data
  //Adds a new row to the end of the array
  //This will be sorted automatically by useEffect above
  const addRowOptimistically = useCallback(
    (
      currentData: SupabaseProviderFetchResult | undefined,
      optimisticRow: OptimisticRow
    ) => {
      if (!currentData) {
        currentData = { data: null, count: null };
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

  const editRowOptimistically = useCallback(
    (
      currentData: SupabaseProviderFetchResult | undefined,
      optimisticRow: OptimisticRow
    ) => {
      if (!currentData) {
        return {
          data: null,
          count: null,
        };
      }

      const newData = {
        data: clientSideOrderBy(
          memoizedOrderBy,
          //Map over the data and replace the row with the optimistic row based on the uniqueIdentifierField
          currentData.data?.map((row) =>
            row[uniqueIdentifierField] === optimisticRow[uniqueIdentifierField]
              ? optimisticRow
              : row
          ) || []
        ),
        //Count remains same or is null. No manipulation needed
        count: currentData.count,
      };

      return newData;
    },
    [memoizedOrderBy, uniqueIdentifierField]
  );

  const deleteRowOptimistically = useCallback(
    (
      currentData: SupabaseProviderFetchResult | undefined,
      //optimisticData is either an object with the unique identifier field (usually 'id') present in the first level of the object
      //or a number or string (the actual value of the unique identifier field (id) to filter by)
      optimisticRow: OptimisticRow
    ) => {
      if (!currentData) {
        return {
          data: null,
          count: null,
        };
      }

      //Extract the unique identifier value from the optimistic data
      //So we can filter the row out of the data based on this
      let uniqueIdentifierVal = optimisticRow[uniqueIdentifierField];

      //If the extracted value for the unique identifier is not a number or string, throw an error
      if (
        typeof uniqueIdentifierVal !== "number" &&
        typeof uniqueIdentifierVal !== "string"
      ) {
        throw new Error(`
          Unable to optimistically delete row. The optimistic data passed was invalid so we could not extract a value for uniquely identifying the row to delete.
          Optimistic data for delete row must be a number, a string, or an object with the unique identifier field (usually 'id') present in the first level of the object.
        `);
      }

      const newData = {
        data: clientSideOrderBy(
          memoizedOrderBy,
          //Filter out the row based on the uniqueIdentifierField
          currentData.data?.filter(
            (row) => row[uniqueIdentifierField] !== uniqueIdentifierVal
          ) || []
        ),
        //Decrement the count if count is enabled
        count: returnCount !== "none" ? (currentData.count || 0) - 1 : null,
      };

      return newData;
    },
    [returnCount, memoizedOrderBy, uniqueIdentifierField]
  );

  return {
    returnUnchangedData,
    addRowOptimistically,
    editRowOptimistically,
    deleteRowOptimistically,
  };
}
