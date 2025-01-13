//React dependencies
import React, { useState, forwardRef, useImperativeHandle } from "react";

//Plasmic dependencies
import { useMutablePlasmicQueryData } from "@plasmicapp/query";
import { DataProvider } from "@plasmicapp/host";

//Library dependencies
import { v4 as uuid } from "uuid";
import { useDeepCompareMemo } from "use-deep-compare";

//Supabase utility functions (create client)
// import createClient from "../../utils/supabase/component";

//Custom utility functions
import { fetchData } from "./fetchData";
import { buildSupabaseProviderError } from "./buildSupabaseProviderErr";

import {
  type Filter,
  type OrderBy,
} from "../../utils/buildSupabaseQueryWithDynamicFilters";

//Custom hooks
import { useSupabaseMutations } from "./useSupabaseMutations";
import { useOptimisticOperations } from "./useOptimisticOperations";

//Types
import type {
  Row,
  OptimisticRow,
  SupabaseProviderError,
  SupabaseProviderFetchResult,
  SupabaseProviderMutateResult,
  OptimisticOperation,
  ReturnCountOptions,
} from "./types";

// Declare types
// Types for the Element actions that can be run in Plasmic Studio
interface Actions {
  addRow(
    rowForSupabase: Row,
    shouldReturnRow: boolean,
    returnImmediately: boolean,
    optimisticRow?: Row
  ): Promise<SupabaseProviderFetchResult>;
  refetchRows(): Promise<void>;
}

//Props for the SupabaseProvider component
export interface SupabaseProviderProps {
  children: React.ReactNode;
  className?: string;
  queryName: string;
  tableName: string;
  columns: string;
  filters: Filter[];
  orderBy: OrderBy[];
  limit?: number;
  offset?: number;
  returnCount?: ReturnCountOptions;
  onError: (supabaseProviderError: SupabaseProviderError) => void;
  onMutateSuccess: (mutateResult: SupabaseProviderMutateResult) => void;
  skipServerSidePrefetch: boolean;
  addDelayForTesting: boolean;
  simulateRandomFetchErrors: boolean;
  simulateRandomMutationErrors: boolean;
}

// The SupabaseProvider component
export const SupabaseProvider = forwardRef<Actions, SupabaseProviderProps>(
  function SupabaseProvider(
    {
      children,
      className,
      queryName,
      tableName,
      columns,
      filters,
      orderBy,
      limit,
      offset,
      returnCount,
      onError,
      onMutateSuccess,
      skipServerSidePrefetch,
      addDelayForTesting,
      simulateRandomFetchErrors,
      simulateRandomMutationErrors,
    },
    ref
  ) {
    // Custom state to track if the component is currently mutating data
    const [isMutating, setIsMutating] = useState<boolean>(false);

    // Custom state to track any fetch errors
    const [errorFromFetch, setErrorFromFetch] =
      useState<SupabaseProviderError | null>(null);

    // Memoize filters and orderBy to prevent unnecessary re-renders when used a dependencies for hooks/functions
    const memoizedFilters = useDeepCompareMemo(() => filters, [filters]);
    const memoizedOrderBy = useDeepCompareMemo(() => orderBy, [orderBy]);

    // Get the mutator functions from our custom useSupabaseMutations hook
    const { addRowMutator } = useSupabaseMutations({
      tableName,
      columns,
      addDelayForTesting,
      simulateRandomMutationErrors,
    });

    // Get the buildOptimisticFunc function from our custom useOptimisticOperations hook
    // This function can be run to return the correct optimistic function to run during mutation
    const { buildOptimisticFunc } = useOptimisticOperations({
      returnCount,
      memoizedOrderBy,
    });

    // Build the fetch data function with the current parameters
    const fetchDataWithParams = async () => {
      return fetchData({
        skipServerSidePrefetch,
        tableName,
        columns,
        memoizedFilters,
        memoizedOrderBy,
        limit,
        offset,
        returnCount,
        addDelayForTesting,
        simulateRandomFetchErrors,
        setIsMutating,
        setErrorFromFetch,
        onError,
      });
    };

    // useMutablePlasmicQueryData (similar to useSWR) hook to fetch the data from supabase and provide a mutate function to refetch
    // runs on mount, when props or fetcher change, and after mutation
    const {
      data,
      //error - will not use the build in error - we handle errors ourselves in a different way in this component
      mutate,
      isLoading,
    } = useMutablePlasmicQueryData(
      [
        // Make the cache value unique based on all these parameters
        // Ensures that different data from same SupabaseProvider (eg on a dynamic page) is not mixed up in the cache
        // Also ensures that data is refetched when props change (when in Plasmic studio or if app allows dynamic prop values)
        queryName,
        tableName,
        columns,
        JSON.stringify(memoizedFilters),
        JSON.stringify(memoizedOrderBy),
        orderBy,
        limit,
        offset,
        returnCount,
      ],
      fetchDataWithParams,
      {
        shouldRetryOnError: false,
      }
    );

    // Element actions exposed to run in Plasmic Studio
    useImperativeHandle(ref, () => ({
      // addRow element action
      addRow: async (
        rowForSupabase,
        shouldReturnRow,
        returnImmediately,
        optimisticRow
      ): Promise<SupabaseProviderMutateResult> => {
        return new Promise((resolve) => {
          setIsMutating(true);

          // Determine the optimistic operation and function to run
          // If no optimisticRow was provided, the optimistic func will be returnUnchangedData, effectively disabling optimistic ops
          let optimisticOperation: OptimisticOperation = optimisticRow
            ? "insert"
            : null;
          const optimisticFunc = buildOptimisticFunc(
            optimisticOperation,
            "Add Row"
          );

          //Add an optimistic id to the row if present
          let optimisticRowFinal: OptimisticRow | null = null;
          if (optimisticRow)
            optimisticRowFinal = {
              ...optimisticRow,
              optimisticId: uuid(),
              isOptimistic: true,
            };

          // Resolve immediately if returnImmediately is true
          // The mutation will still run in the background (see below)
          if (returnImmediately) {
            console.log("returning immediately");
            resolve({
              data: null,
              optimisticData: optimisticRowFinal,
              count: null,
              action: "insert",
              summary: "Add row in progress",
              status: "pending",
              error: null,
            });
          }

          console.log("running mutation");

          // Run the mutation
          mutate(addRowMutator(rowForSupabase, shouldReturnRow), {
            optimisticData: (currentData) =>
              optimisticFunc(
                //currentData could be undefined, so we default to null SupabaseProviderFetchResult if necessary
                currentData ? currentData : { data: null, count: null },
                //typescript thinks optimisticRow could be undefined, but we know it's not
                optimisticRow as OptimisticRow
              ),
            populateCache: false,
            revalidate: true,
            rollbackOnError: true,
          })
            // If the mutation succeeds
            .then((response) => {
              // Build a custom result object
              let result: SupabaseProviderMutateResult = {
                data: response ? response.data : null,
                optimisticData: optimisticRowFinal,
                count: response ? response.count : null,
                action: "insert",
                summary: "Successfully added row",
                status: "success",
                error: null,
              };

              // Call the onMutateSuccess event handler if it exists
              if (onMutateSuccess && typeof onMutateSuccess === "function") {
                onMutateSuccess(result);
              }

              //Resolve the promise with the result of the mutation (only required if returnImmediately is false)
              if (!returnImmediately) {
                console.log("returning result after mutation");
                resolve(result);
              }
            })
            // If the mutation errors
            .catch((err) => {
              // Build a custom error object

              const supabaseProviderError = buildSupabaseProviderError({
                error: err,
                operation: "insert",
                summary: "Error adding row",
                rowForSupabase,
              });

              // Call the onError event handler if it exists
              if (onError && typeof onError === "function") {
                onError(supabaseProviderError);
              }
              //Resolve the promise with the error data (only required if returnImmediately is false)
              //Note we resolve not reject because we want Plasmic studio to receive error data not an exception
              if (!returnImmediately) {
                console.log("returning error after mutation");
                resolve({
                  data: null,
                  optimisticData: optimisticRowFinal,
                  count: null,
                  action: "insert",
                  summary: "Error adding row",
                  status: "error",
                  error: supabaseProviderError,
                });
              }
            });
        });
      },

      // refetchRows element action
      refetchRows: async () => {
        mutate();
      },
    }));

    return (
      <div className={className}>
        <DataProvider
          name={queryName}
          data={{
            data,
            isLoading,
            isMutating,
            errorFromFetch,
          }}
        >
          {children}
        </DataProvider>
      </div>
    );
  }
);
