import { useCallback } from "react";
import createClient from "../../../utils/supabase/component";
import buildSupabaseQueryWithDynamicFilters from "./buildSupabaseQueryWithDynamicFilters";

type MutationDependencies = {
  tableName: string;
  columns: string;
  uniqueIdentifierField: string;
  addDelayForTesting: boolean;
  simulateRandomMutationErrors: boolean;
};

import type { SupabaseProviderFetchResult, Row, MutationTypes } from "../types";

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
          "Invalid operation type in useSupabaseMutatoins.buildStandardMutator. Use the advanced mutator function instead"
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
                  value2: undefined
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
      dataForSupabase: Row;
      shouldReturnRow: boolean;
    }) => {
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
      dataForSupabase: Row;
      shouldReturnRow: boolean;
    }) => {
      return buildStandardMutator({
        mutationType: "update",
        rowForSupabase,
        runSelectAfterMutate: shouldReturnRow,
      });
    },
    [buildStandardMutator]
  );

  return { addRowMutator, editRowMutator };
}
