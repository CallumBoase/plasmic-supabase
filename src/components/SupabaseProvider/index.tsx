//React dependencies
import React, { useState, forwardRef, useImperativeHandle } from "react";

//Plasmic dependencies
import { useMutablePlasmicQueryData } from "@plasmicapp/query";
import { DataProvider } from "@plasmicapp/host";

//Library dependencies
import { v4 as uuid } from "uuid";
import { useDeepCompareMemo } from "use-deep-compare";

//Supabase utility functions (create client)
import createClient from "../../utils/supabase/component";

//Custom utility functions
import serverSide from "../../utils/serverSide";
import getErrMsg from "../../utils/getErrMsg";

import buildSupabaseQueryWithDynamicFilters, {
  type Filter,
  type OrderBy,
} from "../../utils/buildSupabaseQueryWithDynamicFilters";

//Custom hooks
import { useSupabaseMutations } from "./useSupabaseMutations";
import { useOptimisticOperations } from "./useOptimitsicOperations";

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

    //Memoize filters and orderBy to prevent unnecessary re-renders when used a dependencies for hooks/functions
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

    // Function to fetch rows from Supabase
    // This is called by the useMutablePlasmicQueryData hook each time data needs to be fetched
    const fetchData = async (): Promise<SupabaseProviderFetchResult> => {
      setIsMutating(false);
      setErrorFromFetch(null);

      console.log(serverSide(), "serverSide()");

      // If the user has opted-out of server-side prefetch of data via extractPlasmicQueryData
      // and we are currently in the server-side environment
      // then we immediately return null data, count and error
      // This will be passed as initial data, until fetch occurs client-side
      if (serverSide() && skipServerSidePrefetch) {
        console.log("skipping server-side prefetch of data");
        return { data: null, count: null };
      }

      try {
        const supabase = createClient();

        //Build the query with dynamic filters that were passed as props to the component
        const supabaseQuery = buildSupabaseQueryWithDynamicFilters({
          supabase,
          tableName,
          operation: "select",
          columns,
          dataForSupabase: null,
          filters: memoizedFilters,
          orderBy,
          limit,
          offset,
          returnCount,
        });

        // Add a 1 second delay for testing when indicated
        if (addDelayForTesting)
          await new Promise((resolve) => setTimeout(resolve, 1000));

        // Simulate random fetch errors for testing when indicated
        if (simulateRandomFetchErrors && Math.random() > 0.5) {
          throw new Error(
            `Simulated random fetch error, timestamp: ${new Date().toISOString()}`
          );
        }

        const { data, count, error } = await supabaseQuery;

        if (error) {
          throw error;
        }

        console.log("fetch done", data?.length);

        return { data, count };
      } catch (err) {
        console.error(err);
        const supabaseProviderError: SupabaseProviderError = {
          errorId: uuid(),
          summary: "Error fetching records",
          errorMessage: getErrMsg(err),
          actionAttempted: "select",
          rowForSupabase: null,
        };
        setErrorFromFetch(supabaseProviderError);
        if (onError && typeof onError === "function") {
          onError(supabaseProviderError);
        }
        throw err;
      }
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
      fetchData,
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
            ? "addRow"
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
              const supabaseProviderError: SupabaseProviderError = {
                errorId: uuid(),
                summary: "Error adding row",
                errorMessage: getErrMsg(err),
                actionAttempted: "insert",
                rowForSupabase,
              };
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
