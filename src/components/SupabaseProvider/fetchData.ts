import { v4 as uuid } from "uuid";
import createClient from "../../utils/supabase/component";
import serverSide from "../../utils/serverSide";
import getErrMsg from "../../utils/getErrMsg";

import type {
  SupabaseProviderError,
  SupabaseProviderFetchResult,
  ReturnCountOptions,
} from "./types";

import buildSupabaseQueryWithDynamicFilters, {
  type Filter,
  type OrderBy,
} from "../../utils/buildSupabaseQueryWithDynamicFilters";

type FetchDataParams = {
  skipServerSidePrefetch: boolean;
  tableName: string;
  columns: string;
  memoizedFilters: Filter[];
  memoizedOrderBy: OrderBy[];
  limit?: number;
  offset?: number;
  returnCount?: ReturnCountOptions;
  addDelayForTesting: boolean;
  simulateRandomFetchErrors: boolean;
  setIsMutating: (value: boolean) => void;
  setErrorFromFetch: (error: SupabaseProviderError | null) => void;
  onError?: (error: SupabaseProviderError) => void;
};

// Function to fetch rows from Supabase
// This is called by the useMutablePlasmicQueryData hook each time data needs to be fetched
export const fetchData = async ({
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
}: FetchDataParams): Promise<SupabaseProviderFetchResult> => {
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
      orderBy: memoizedOrderBy,
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
