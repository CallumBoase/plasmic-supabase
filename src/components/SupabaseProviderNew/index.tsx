import React, {
  useState,
  // useEffect,
  forwardRef,
  useCallback,
  useImperativeHandle,
} from "react";

import { useMutablePlasmicQueryData } from "@plasmicapp/query";
import { DataProvider } from "@plasmicapp/host";
import { v4 as uuid } from "uuid";
import { useDeepCompareMemo } from "use-deep-compare";

import serverSide from "../../utils/serverSide";
import getErrMsg from "../../utils/getErrMsg";

//Import custom createClient that creates the Supabase client based on component render within Plasmic vs Browser
import createClient from "../../utils/supabase/component";

import buildSupabaseQueryWithDynamicFilters, {
  type Filter,
  type OrderBy,
} from "../../utils/buildSupabaseQueryWithDynamicFilters";

import type {
  PostgrestResponseSuccess,
} from "@supabase/postgrest-js";

// Type for a single Supabase row - an object with key-value pairs
type Row = {
  [key: string]: any;
};

// Type for multiple Supabase rows - an array of objects with key-value pairs
type Rows = Row[];

// Custom error object for SupabaseProvider
type SupabaseProviderError = {
  errorId: string;
  summary: string;
  errorMessage: string;
  actionAttempted: "select" | "insert" | "update" | "delete" | "rpc" | "flexibleMutation";
  rowForSupabase: Row | null;
};

// Type for the response from the fetcher function
// Uses { data, count } from supabase.select() response
// And we add our own version of error (or null)
type SupabaseProviderFetchResult = {
  data: PostgrestResponseSuccess<Rows>["data"] | null,
  count: PostgrestResponseSuccess<Rows>["count"] | null
}

// Type for the response from a mutate function
// Uses { data, count } from supabase.insert/update/delete/rpc/select() response
// And we include an error object (or null)
type SupabaseProviderMutateResult = {
  data: PostgrestResponseSuccess<Rows>["data"] | null;
  count: PostgrestResponseSuccess<Rows>["count"] | null;
  action: "insert" | "update" | "delete" | "rpc" | "flexibleMutation";
  summary: string;
  status: 'success' | 'error' | 'pending';
  error: SupabaseProviderError | null;
}

// Types for the element actions (useImperativeHandle) exposed to run in Plasmic Studio
interface Actions {
  addRow(
    rowForSupabase: Row,
    shouldReturnRow: boolean,
    returnImmediately: boolean
  ): Promise<SupabaseProviderFetchResult>;
  refetchRows(): Promise<void>;
}

//Props the SupabaseProvider component accepts (configured in Plasmic studio)
export interface SupabaseProviderNewProps {
  children: React.ReactNode;
  className?: string;
  queryName: string;
  tableName: string;
  columns: string;
  filters: Filter[];
  orderBy: OrderBy[];
  limit?: number;
  offset?: number;
  returnCount?: "none" | "exact" | "planned" | "estimated";
  onError: (supabaseProviderError: SupabaseProviderError) => void;
  onMutateSuccess: (mutateResult: SupabaseProviderMutateResult) => void;
  skipServerSidePrefetch: boolean;
  addDelayForTesting: boolean;
  simulateRandomFetchErrors: boolean;
  simulateRandomMutationErrors: boolean;
}

// The SupabaseProvider component itself
export const SupabaseProviderNew = forwardRef<
  Actions,
  SupabaseProviderNewProps
>(function SupabaseProvider(props, ref) {
  const {
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
  } = props;

  // Custom state to track if the component is currently mutating data
  const [isMutating, setIsMutating] = useState<boolean>(false);

  // Custom state to track any fetch errors
  const [errorFromFetch, setErrorFromFetch] = useState<SupabaseProviderError | null>(
    null
  );
  const memoizedFilters = useDeepCompareMemo(() => filters, [filters]);
  const memoizedOrderBy = useDeepCompareMemo(() => orderBy, [orderBy]);

  // Function to fetch rows from Supabase
  const fetchData = async (): Promise<SupabaseProviderFetchResult> => {
    setIsMutating(false);
    setErrorFromFetch(null);

    console.log(serverSide(), 'serverSide()')

    // If the user has opted-out of server-side prefetch of data via extractPlasmicQueryData
    // and we are currently in the server-side environment
    // then we immediately return null data, count and error
    // This will be passed as initial data, until fetch occurs client-side
    if (serverSide() && skipServerSidePrefetch) {
      console.log('skipping server-side prefetch of data')
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

      console.log('fetch done', data?.length)

      return { data, count};
    } catch (err) {
      console.error(err);
      const supabaseProviderError : SupabaseProviderError = {
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

  // hook to actually fetch the data, and provide a mutate function to refetch
  // runs on mount, when props or fetcher change, and after mutation
  const {
    data,
    //error - will not use see notes in KnackProvider
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

  // Function to add a row in Supabase
  const addRowMutator = useCallback(
    async (rowForSupabase: Row, shouldReturnRow: boolean) : Promise<SupabaseProviderFetchResult> => {
      // Build the supabase query to insert the row with optional return of the new row
      const supabase = createClient();

      let query = supabase.from(tableName).insert(rowForSupabase);

      if (shouldReturnRow) {
        //@ts-ignore - Typescript doesn't like the dynamic query with select but we know it's OK
        query = query.select(columns);
      }

      // Add delay for testing when indicated
      if (addDelayForTesting)
        await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate random mutation errors for testing when indicated
      if (simulateRandomMutationErrors && Math.random() > 0.5) {
        throw new Error(
          `Simulated random mutation error, timestamp: ${new Date().toISOString()}`
        );
      }

      // Run the query
      const { data, count, error } = await query;

      // If there is an error, throw it
      if (error) {
        throw error;
      }

      // Return the data and count
      // Count is not technically needed because we aren't counting rows, 
      // however, the return type of this function needs to match the fetcher,  so we include it anyway
      return { data, count };

    },
    [tableName, columns, addDelayForTesting, simulateRandomMutationErrors]
  );

  // Element actions exposed to run in Plasmic Studio
  useImperativeHandle(ref, () => ({

    // addRow element action
    addRow: async (rowForSupabase, shouldReturnRow, returnImmediately) : Promise<SupabaseProviderMutateResult> => {
      return new Promise((resolve) => {

        setIsMutating(true);

        // Resolve immediately if returnImmediately is true
        // The mutation will still run in the background (see below)
        if (returnImmediately) {
          console.log('returning immediately')
          resolve({
            data: null,
            count: null,
            action: "insert",
            summary: "Add row in progress",
            status: 'pending',
            error: null,
          });
        }

        console.log('running mutation')

        // Run the mutation
        mutate(addRowMutator(rowForSupabase, shouldReturnRow), {
          populateCache: false,
          revalidate: true,
          rollbackOnError: true,
        })
        // If the mutation succeeds
        .then((response) => {

          // Build a custom result object
          let result : SupabaseProviderMutateResult = {
            data: response ? response.data : null,
            count: response ? response.count : null,
            action: "insert",
            summary: "Successfully added row",
            status: 'success',
            error: null,
          };
          
          // Call the onMutateSuccess event handler if it exists
          if(onMutateSuccess && typeof onMutateSuccess === "function") {
            onMutateSuccess(result);
          }

          //Resolve the promise with the result of the mutation (only required if returnImmediately is false)
          if (!returnImmediately) {
            console.log('returning result after mutation')
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
          if(!returnImmediately) {
            console.log('returning error after mutation')
            resolve({
              data: null,
              count: null,
              action: "insert",
              summary: "Error adding row",
              status: 'error',
              error: supabaseProviderError
            });
          }
        })

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
});
