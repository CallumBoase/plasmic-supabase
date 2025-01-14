// useMutationWithOptimisticUpdates.ts

import { useState } from "react";
import { v4 as uuid } from "uuid";
import { buildSupabaseProviderError } from "./buildSupabaseProviderErr";
import { getOperationPhrases } from "./getOperationPhrases";
// import { getOptimisticOperation } from "./getOptimisticOperation";
import { useSupabaseMutations } from "./useSupabaseMutations";
import { useOptimisticOperations } from "./useOptimisticOperations";

import type { KeyedMutator } from "swr";

import type {
  Row,
  Rows,
  SupabaseProviderMutateResult,
  SupabaseProviderError,
  SupabaseProviderFetchResult,
  MutationTypes,
  OptimisticRow,
  ReturnCountOptions,
} from "../types";

import { type OrderBy } from "./buildSupabaseQueryWithDynamicFilters";

type UseMutationWithOptimisticUpdatesParams = {
  tableName: string;
  columns: string;
  addDelayForTesting: boolean;
  simulateRandomMutationErrors: boolean;
  returnCount?: ReturnCountOptions;
  memoizedOrderBy: OrderBy[];
  uniqueIdentifierField: string;
  memoizedOnMutateSuccess: (mutateResult: SupabaseProviderMutateResult) => void;
  memoizedOnError: (supabaseProviderError: SupabaseProviderError) => void;
};

export const useMutationWithOptimisticUpdates = ({
  tableName,
  columns,
  addDelayForTesting,
  simulateRandomMutationErrors,
  returnCount,
  uniqueIdentifierField,
  memoizedOrderBy,
  memoizedOnMutateSuccess,
  memoizedOnError,
}: UseMutationWithOptimisticUpdatesParams) => {
  // Custom state to track if the component is currently mutating data
  const [isMutating, setIsMutating] = useState<boolean>(false);

  // Build the mutator functions based on dependencies from our custom useSupabaseMutations hook
  const { addRowMutator, editRowMutator } = useSupabaseMutations({
    tableName,
    columns,
    uniqueIdentifierField,
    addDelayForTesting,
    simulateRandomMutationErrors,
  });

  // Get the buildOptimisticFunc function from our custom useOptimisticOperations hook
  // This function can be run to return the correct optimistic function to run during mutation
  const { addRowOptimistically, returnUnchangedData, editRowOptimistically } =
    useOptimisticOperations({
      returnCount,
      uniqueIdentifierField,
      memoizedOrderBy,
    });

  // Function that can handle all types of mutations (addRow, editRow, deleteRow, runRpc, flexibleMutation)
  // It can be run with various settings:
  // - optional optimistic updates
  // - optional immediate return while mutation is in progress
  // - optional return of the row that was mutated
  // - optional error handling callback
  // - optional success callback
  // mutate is the mutator function from useMutablePlasmicQueryData, linked to the SWR cache
  const handleMutation = async ({
    operation,
    dataForSupabase,
    shouldReturnRow,
    returnImmediately,
    optimisticRow,
    optimisticData,
    optimisticCount,
    mutate,
  }: {
    operation: MutationTypes;
    dataForSupabase: Row | Rows;
    shouldReturnRow: boolean;
    returnImmediately: boolean;
    optimisticRow?: Row;
    optimisticData?: Rows;
    optimisticCount?: number;
    mutate: KeyedMutator<SupabaseProviderFetchResult>;
  }): Promise<SupabaseProviderFetchResult> => {
    return new Promise((resolve) => {
      setIsMutating(true);

      // Get the phrases for referring to this operation
      // Eg "insert" is from the element action "Add Row", the in progress message is "Add row in progress", etc
      const operationPhrases = getOperationPhrases(operation);

      // Check if we have an optimisticRow or optimisticData
      // Only one is valid at a time
      if (optimisticRow && optimisticData) {
        throw new Error(
          "Error in handleMutationWithOptimisticUpdates: You can only specify an optimisticRow or optimisticData, not both"
        );
      }

      //If we have an optimisticRow, add the optimisticId and isOptimistic properties
      //Leave optimisticData as is
      let optimisticRowFinal: OptimisticRow | undefined;
      if (optimisticRow) {
        optimisticRowFinal = {
          ...optimisticRow,
          optimisticId: uuid(),
          isOptimistic: true,
        };
      }

      // Resolve immediately if returnImmediately is true
      // The mutation will still run in the background (see below)
      if (returnImmediately) {
        const result: SupabaseProviderMutateResult = {
          data: null,
          count: null,
          optimisticData: optimisticRowFinal || optimisticData || null,
          optimisticCount: optimisticCount || null,
          action: operation,
          summary: operationPhrases.inProgress,
          status: "pending",
          error: null,
        };
        resolve(result);
      }

      // Select the appropriate mutator & optimistic functions based on operation & presence/absense of optimistic data
      // TODO: add all the other operations
      let mutatorFunction;
      let optimisticFunc;
      switch (operation) {
        case "insert":
          mutatorFunction = addRowMutator;
          optimisticFunc = optimisticRowFinal
            ? addRowOptimistically
            : returnUnchangedData;
          break;
        case "update":
          mutatorFunction = editRowMutator;
          optimisticFunc = optimisticRowFinal
            ? editRowOptimistically
            : returnUnchangedData;
          break;
        default:
          throw new Error(
            "Error in handleMutationWithOptimisticUpdates: Invalid operation"
          );
      }

      // Run the mutation
      mutate(mutatorFunction({ dataForSupabase, shouldReturnRow }), {
        optimisticData: (currentData) =>
          optimisticFunc(
            currentData,
            //Pass in the optimisticRowFinal if it exists, otherwise pass in the optimisticData, otherwise undefined
            //This fits all the possible optimistic functions
            //Logic previously in the component ensures that only the correct optimistic data exists
            //And that the presence or absense of optimistic data has lead to the correct optimistic function being selected
            //Including lack of any optimistic data leading to the returnUnchangedData function
            (optimisticRowFinal as OptimisticRow) ||
              (optimisticData as Rows) ||
              undefined
          ),
        populateCache: false,
        revalidate: true,
        rollbackOnError: true,
      })
        .then((response) => {
          let result: SupabaseProviderMutateResult = {
            data: response ? response.data : null,
            count: response ? response.count : null,
            optimisticData: optimisticRowFinal || optimisticData || null,
            optimisticCount: optimisticCount || null,
            action: operation,
            summary: operationPhrases.success,
            status: "success",
            error: null,
          };

          if (memoizedOnMutateSuccess) {
            memoizedOnMutateSuccess(result);
          }

          if (!returnImmediately) {
            resolve(result);
          }
        })
        .catch((err) => {
          const supabaseProviderError = buildSupabaseProviderError({
            error: err,
            operation: operation,
            summary: operationPhrases.error,
            dataForSupabase,
            optimisticData: optimisticRowFinal || optimisticData || null,
          });

          if (memoizedOnError) {
            memoizedOnError(supabaseProviderError);
          }

          if (!returnImmediately) {
            const result: SupabaseProviderMutateResult = {
              data: null,
              count: null,
              optimisticData: optimisticRowFinal || optimisticData || null,
              optimisticCount: optimisticCount || null,
              action: operation,
              summary: operationPhrases.error,
              status: "error",
              error: supabaseProviderError,
            };
            resolve(result);
          }
        });
    });
  };

  return {
    handleMutation,
    isMutating,
    setIsMutating,
  };
};
