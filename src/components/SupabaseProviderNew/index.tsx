import React, {
  useState,
  // useEffect,
  forwardRef,
  // useCallback,
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

type Row = {
  [key: string]: any;
};

// type Rows = {
//   count?: number;
//   data: Row[] | null;
// };

type SupabaseProviderError = {
  errorId: string;
  summary: string;
  errorMessage: string;
  actionAttempted: string;
  rowForSupabase: Row | null;
};

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
  skipServerSidePrefetch: boolean;
  addDelayForTesting: boolean;
  simulateRandomFetchErrors: boolean;
}

interface Actions {
  addRow(
    rowForSupabase: any,
    shouldReturnRow: boolean,
    returnImmediately: boolean
  ): Promise<any>;
  refetchRows(): Promise<void>;
}


export const SupabaseProviderNew = forwardRef<Actions, SupabaseProviderNewProps>(
  function SupabaseProvider(props, ref) {

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
      skipServerSidePrefetch,
      addDelayForTesting,
      simulateRandomFetchErrors,
    } = props;

    // console.log(props)

    const [fetchError, setFetchError] = useState<SupabaseProviderError | null>(null);
    const memoizedFilters = useDeepCompareMemo(() => filters, [filters]);
    const memoizedOrderBy = useDeepCompareMemo(() => orderBy, [orderBy]);

    // Function to fetch rows from Supabase
    const fetchData = async () => {

      setFetchError(null);

      // If the user has opted-out of server-side prefetch of data via extractPlasmicQueryData
      // and we are currently in the server-side environment
      // then we return null instead of running the query to fetch data
      // This forces the query to run first in the browser
      if(serverSide() && skipServerSidePrefetch) {
        return null;
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
          returnCount
        });

        // Add a 1 second delay for testing when indicated
        if (addDelayForTesting) await new Promise((resolve) => setTimeout(resolve, 1000));

        // Simulate random fetch errors for testing when indicated
        if (simulateRandomFetchErrors && Math.random() > 0.5) {
          throw new Error(`Simulated random fetch error, timestamp: ${new Date().toISOString()}`);
        }

        const { data, error, count } = await supabaseQuery;

        if (error) {
          throw error;
        }

        return { data, count };

      } catch (err) {
        console.error(err);
        const supabaseProviderError = {
          errorId: uuid(),
          summary: "Error fetching records",
          errorMessage: getErrMsg(err),
          actionAttempted: "read",
          rowForSupabase: null,
        };
        setFetchError(supabaseProviderError);
        if (onError && typeof onError === "function") {
          onError(supabaseProviderError);
        }
        throw err;
      }

    }

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
        returnCount
      ], 
      fetchData,
      {
        shouldRetryOnError: false
      }
    );

    // Element actions
    useImperativeHandle(ref, () => ({
      addRow: async () => console.log("test"),
      //Element action to simply refetch the data with the fetcher
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
            fetchError,
          }}
        >
          {children}
        </DataProvider>
      </div>
    );
  }
);