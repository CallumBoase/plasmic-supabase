import { useCallback } from "react";
import createClient from "../../../utils/supabase/component";
import buildSupabaseQueryWithDynamicFilters from "../helpers/buildSupabaseQueryWithDynamicFilters";

type MutationDependencies = {
  tableName: string;
  columns: string;
  uniqueIdentifierField: string;
  addDelayForTesting: boolean;
  simulateRandomMutationErrors: boolean;
};

import type {
  SupabaseProviderFetchResult,
  RpcResponse,
  Row,
  Rows,
  MutationTypes,
  FlexibleMutationOperations,
} from "../types";
import type { Filter } from "../helpers/buildSupabaseQueryWithDynamicFilters";

export function useSupabaseMutations(dependencies: MutationDependencies) {
  const {
    tableName,
    columns,
    uniqueIdentifierField,
    addDelayForTesting,
    simulateRandomMutationErrors,
  } = dependencies;

  // Function to build a simple insert / update / delete mutator function
  const buildStandardMutator = useCallback(
    async ({
      mutationType,
      rowForSupabase,
      runSelectAfterMutate,
    }: {
      mutationType: MutationTypes;
      rowForSupabase: Row;
      runSelectAfterMutate: boolean;
    }): Promise<SupabaseProviderFetchResult> => {
      // Build the supabase query to insert the row with optional return of the new row
      const supabase = createClient();

      // Choose the operation for the query
      let operation;
      if (
        mutationType === "insert" ||
        mutationType === "update" ||
        mutationType === "delete"
      ) {
        operation = mutationType;
      } else {
        throw new Error(
          "Invalid operation type in useSupabaseMutations.buildStandardMutator. Use the advanced mutator function instead"
        );
      }

      const query = buildSupabaseQueryWithDynamicFilters({
        supabase,
        tableName,
        operation: operation,
        columns,
        dataForSupabase: rowForSupabase,
        filters:
          operation === "insert"
            ? undefined
            : [
                {
                  fieldName: uniqueIdentifierField,
                  operator: "eq",
                  value: rowForSupabase[uniqueIdentifierField],
                  value2: undefined,
                },
              ],
        orderBy: null,
        limit: undefined,
        offset: undefined,
        returnCount: "none",
        runSelectAfterMutate,
      });

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

  const addRowMutator = useCallback(
    async ({
      dataForSupabase: rowForSupabase,
      shouldReturnRow,
    }: {
      dataForSupabase: Row | undefined;
      shouldReturnRow: boolean;
    }) => {
      if (!rowForSupabase) {
        throw new Error(
          "Error in addRow: dataForSupabase must be an object but none was provided. (Error from addRowMutator)"
        );
      }

      return buildStandardMutator({
        mutationType: "insert",
        rowForSupabase,
        runSelectAfterMutate: shouldReturnRow,
      });
    },
    [buildStandardMutator]
  );

  const editRowMutator = useCallback(
    async ({
      dataForSupabase: rowForSupabase,
      shouldReturnRow,
    }: {
      dataForSupabase: Row | undefined;
      shouldReturnRow: boolean;
    }) => {
      if (!rowForSupabase) {
        throw new Error(
          "Error in editRow: dataForSupabase must be an object but none was provided. (Error from editRowMutator)"
        );
      }

      return buildStandardMutator({
        mutationType: "update",
        rowForSupabase,
        runSelectAfterMutate: shouldReturnRow,
      });
    },
    [buildStandardMutator]
  );

  const deleteRowMutator = useCallback(
    async ({
      dataForSupabase: rowForSupabase,
      shouldReturnRow,
    }: {
      dataForSupabase: Row | undefined;
      shouldReturnRow: boolean;
    }) => {
      if (!rowForSupabase) {
        throw new Error(
          "Error in deleteRow: the unique identifier value was empty, so we were unable to construct the row to be deleted. (Error from deleteRowMutator)"
        );
      }

      return buildStandardMutator({
        mutationType: "delete",
        rowForSupabase,
        runSelectAfterMutate: shouldReturnRow,
      });
    },
    [buildStandardMutator]
  );

  // Function to perform a flexible (dynamic) mutation in Supabase based on specified settings
  // This differs from standard addRowMutator/editRowMutator/deleteRowMutator in a few ways
  // 1. Allows for more complex operations like upsert
  // 2. User can specify the filters for the update
  // 3. User can specify what table to mutate (can be different from the SupabaseProvider's table)
  // 4. User can specify what optimistic operation to run
  const flexibleMutator = useCallback(
    async ({
      tableName,
      flexibleMutationOperation,
      dataForSupabase,
      filters,
      runSelectAfterMutate,
    }: {
      tableName: string;
      flexibleMutationOperation: FlexibleMutationOperations;
      dataForSupabase: Row | Rows | undefined | null;
      filters?: Filter[];
      runSelectAfterMutate: boolean;
    }): Promise<SupabaseProviderFetchResult> => {
      // Build the supabase query to insert the row with optional return of the new row
      const supabase = createClient();

      // Make sure the operation is valid
      if (
        flexibleMutationOperation !== "insert" &&
        flexibleMutationOperation !== "update" &&
        flexibleMutationOperation !== "upsert" &&
        flexibleMutationOperation !== "delete"
      ) {
        throw new Error(
          "Invalid operation type in useSupabaseMutations.buildFlexibleMutator. You must specify 'insert' or 'update' or ' upsert' or 'delete'"
        );
      }

      const query = buildSupabaseQueryWithDynamicFilters({
        supabase,
        tableName,
        operation: flexibleMutationOperation,
        columns: undefined,
        dataForSupabase,
        filters,
        orderBy: null,
        limit: undefined,
        offset: undefined,
        returnCount: "none",
        runSelectAfterMutate,
      });

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
    [addDelayForTesting, simulateRandomMutationErrors]
  );

  // Function to run a Supabase RPC
  // This notably returns data in any shape, not the predicatble SupabaseProviderFetchResult
  const runRpc = useCallback(
    async ({
      rpcName,
      dataForSupabase,
    }: {
      rpcName: string;
      dataForSupabase: any;
    }): Promise<RpcResponse> => {
      const supabase = createClient();

      // Add delay for testing when indicated
      if (addDelayForTesting)
        await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate random mutation errors for testing when indicated
      if (simulateRandomMutationErrors && Math.random() > 0.5) {
        throw new Error(
          `Simulated random mutation error, timestamp: ${new Date().toISOString()}`
        );
      }

      const { data, count, error } = await supabase.rpc(
        rpcName,
        dataForSupabase
      );

      if (error) {
        throw error;
      }

      return { data, count };
    },
    [addDelayForTesting, simulateRandomMutationErrors]
  );

  return {
    addRowMutator,
    editRowMutator,
    deleteRowMutator,
    flexibleMutator,
    runRpc,
  };
}
