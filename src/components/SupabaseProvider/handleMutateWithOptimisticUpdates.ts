import { v4 as uuid } from "uuid";

import { buildSupabaseProviderError } from "./buildSupabaseProviderErr";
import { getOperationPhrases } from "./getOperationPhrases";
import { getOptimisticOperation } from "./getOptimisticOperation";

import type {
  Row,
  Rows,
  SupabaseProviderMutateResult,
  SupabaseProviderFetchResult,
  SupabaseProviderError,
  OptimisticRow,
  MutationTypes,
} from "./types";
import type { KeyedMutator } from "swr";
import type { BuildOptimisticFunc } from "./useOptimisticOperations";

type HandleMutationWithOptimisticUpdates = (params: {
  operation: MutationTypes;
  dataForSupabase: Row | Rows;
  shouldReturnRow: boolean;
  returnImmediately: boolean;
  optimisticRow?: Row;
  optimisticData?: Rows;
  optimisticCount?: number;
  mutateFromUseMutablePlasmicQueryData: KeyedMutator<SupabaseProviderFetchResult>;
  mutatorFunction: (
    dataForSupabase: Row | Rows,
    shouldReturnRow: boolean
  ) => Promise<SupabaseProviderFetchResult>;
  buildOptimisticFunc: BuildOptimisticFunc;
  setIsMutating: (value: boolean) => void;
  onMutateSuccess: (mutateResult: SupabaseProviderMutateResult) => void;
  onError: (supabaseProviderError: SupabaseProviderError) => void;
}) => Promise<SupabaseProviderFetchResult>;

export const handleMutationWithOptimisticUpdates: HandleMutationWithOptimisticUpdates =
  async ({
    operation,
    dataForSupabase,
    shouldReturnRow,
    returnImmediately,
    optimisticRow,
    optimisticData,
    optimisticCount,
    mutateFromUseMutablePlasmicQueryData: mutate,
    mutatorFunction,
    buildOptimisticFunc,
    setIsMutating,
    onMutateSuccess,
    onError,
  }) => {
    return new Promise((resolve) => {
      setIsMutating(true);

      //Get the phrases for referring to this operation
      //Eg "insert" is from the element action "Add Row", the in progress message is "Add row in progress", etc
      const operationPhrases = getOperationPhrases(operation);

      //Check if we have an optimisticRow or optimisticData
      //Only one is valid at a time
      if (optimisticRow && optimisticData) {
        throw new Error(
          "Error in handleMUtationWithOptimisticUpdates: You can only specify an optimisticRow or optimisticData, not both"
        );
      }

      //Determine the final optimistic data
      //This is either the optimisticRow with an optimisticId added, or the optimisticData as is
      let optimisticDataFinal: OptimisticRow | Rows | null = null;
      if (optimisticRow)
        optimisticDataFinal = {
          ...optimisticRow,
          optimisticId: uuid(),
          isOptimistic: true,
        };
      else if (optimisticData) {
        optimisticDataFinal = optimisticData;
      }

      // Determine the optimistic operation we will be running based on the mutation operation & 
      // whether 
      let optimisticOperation = getOptimisticOperation(
        operation,
        optimisticDataFinal
      );

      const optimisticFunc = buildOptimisticFunc(
        optimisticOperation,
        operationPhrases.elementActionName
      );

      // Resolve immediately if returnImmediately is true
      // The mutation will still run in the background (see below)
      if (returnImmediately) {
        console.log("returning immediately");
        const result: SupabaseProviderMutateResult = {
          data: null,
          count: null,
          optimisticData: optimisticDataFinal,
          optimisticCount: optimisticCount || null,
          action: operation,
          summary: operationPhrases.inProgress,
          status: "pending",
          error: null,
        };
        resolve(result);
      }

      console.log("running mutation");

      // Run the mutation
      mutate(mutatorFunction(dataForSupabase, shouldReturnRow), {
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
            count: response ? response.count : null,
            optimisticData: optimisticDataFinal,
            optimisticCount: optimisticCount || null,
            action: operation,
            summary: operationPhrases.success,
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
            operation: operation,
            summary: operationPhrases.error,
            rowForSupabase: dataForSupabase,
          });

          // Call the onError event handler if it exists
          if (onError && typeof onError === "function") {
            onError(supabaseProviderError);
          }
          //Resolve the promise with the error data (only required if returnImmediately is false)
          //Note we resolve not reject because we want Plasmic studio to receive error data not an exception
          if (!returnImmediately) {
            console.log("returning error after mutation");
            const result: SupabaseProviderMutateResult = {
              data: null,
              count: null,
              optimisticData: optimisticDataFinal,
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
