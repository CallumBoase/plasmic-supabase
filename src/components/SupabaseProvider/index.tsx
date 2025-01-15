//React dependencies
import React, { useState, forwardRef, useImperativeHandle } from "react";

//Plasmic dependencies
import { useMutablePlasmicQueryData } from "@plasmicapp/query";
import { DataProvider } from "@plasmicapp/host";

//Library dependencies
import { useDeepCompareMemo, useDeepCompareCallback } from "use-deep-compare";

//Supabase utility functions (create client)
// import createClient from "../../utils/supabase/component";
import { useMutationWithOptimisticUpdates } from "./helpers/useMutationWithOptimisticUpdates";

//Custom utility functions
import { fetchDataFromSupabase } from "./helpers/fetchDataFromSupabase";

import {
  type Filter,
  type OrderBy,
} from "./helpers/buildSupabaseQueryWithDynamicFilters";

//Types
import type {
  Row,
  SupabaseProviderError,
  SupabaseProviderFetchResult,
  SupabaseProviderMutateResult,
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
  editRow(
    rowForSupabase: Row,
    shouldReturnRow: boolean,
    returnImmediately: boolean,
    optimisticRow?: Row
  ): Promise<SupabaseProviderFetchResult>;
  deleteRow(
    uniqueIdentifierVal: string,
    shouldReturnRow: boolean,
    returnImmediately: boolean,
    shouldRunOptimistically: boolean
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
  uniqueIdentifierField: string;
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
      uniqueIdentifierField,
      onError,
      onMutateSuccess,
      skipServerSidePrefetch,
      addDelayForTesting,
      simulateRandomFetchErrors,
      simulateRandomMutationErrors,
    },
    ref
  ) {
    // Custom state to track any fetch errors
    const [errorFromFetch, setErrorFromFetch] =
      useState<SupabaseProviderError | null>(null);

    // Memoize filters and orderBy to prevent unnecessary re-renders when used a dependencies for hooks/functions
    const memoizedFilters = useDeepCompareMemo(() => filters, [filters]);
    const memoizedOrderBy = useDeepCompareMemo(() => orderBy, [orderBy]);
    const memoizedOnError = useDeepCompareCallback(onError, [onError]);
    const memoizedOnMutateSuccess = useDeepCompareCallback(onMutateSuccess, [
      onMutateSuccess,
    ]);

    const { handleMutation, isMutating, setIsMutating } =
      useMutationWithOptimisticUpdates({
        tableName,
        columns,
        addDelayForTesting,
        simulateRandomMutationErrors,
        returnCount,
        uniqueIdentifierField,
        memoizedOrderBy,
        memoizedOnMutateSuccess,
        memoizedOnError,
      });

    // Build the fetch data function with the current parameters
    const fetcher = async () => {
      return fetchDataFromSupabase({
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
        memoizedOnError,
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
      fetcher,
      {
        shouldRetryOnError: false,
      }
    );

    // Element actions exposed to run in Plasmic Studio
    useImperativeHandle(ref, () => ({
      addRow: async (
        rowForSupabase,
        shouldReturnRow,
        returnImmediately,
        optimisticRow
      ): Promise<SupabaseProviderFetchResult> => {
        return handleMutation({
          operation: "insert",
          dataForSupabase: rowForSupabase,
          shouldReturnRow,
          returnImmediately,
          optimisticRow,
          mutate,
        });
      },

      editRow: async (
        rowForSupabase,
        shouldReturnRow,
        returnImmediately,
        optimisticRow
      ): Promise<SupabaseProviderFetchResult> => {
        return handleMutation({
          operation: "update",
          dataForSupabase: rowForSupabase,
          shouldReturnRow,
          returnImmediately,
          optimisticRow,
          mutate,
        });
      },

      deleteRow: async (
        uniqueIdentifierVal,
        shouldReturnRow,
        returnImmediately,
        shouldRunOptimistically
      ): Promise<SupabaseProviderFetchResult> => {

        return handleMutation({
          operation: "delete",
          // Build an object with the unique identifier field and it's value to match normal Row object
          dataForSupabase: { [uniqueIdentifierField]: uniqueIdentifierVal },
          shouldReturnRow,
          returnImmediately,
          // Build an optimistic row object with the unique identifier field and it's value
          // if shouldRunOptimistically is true
          // otherwise leave it undefined so no optimistic operation runs
          optimisticRow: shouldRunOptimistically
            ? { [uniqueIdentifierField]: uniqueIdentifierVal }
            : undefined,
          mutate,
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
