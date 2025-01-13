import { v4 as uuid } from "uuid";

import { buildSupabaseProviderError } from "./buildSupabaseProviderErr";

import type { ElementActionName, Row, Rows, SupabaseProviderMutateResult, SupabaseProviderFetchResult, SupabaseProviderError, OptimisticOperation, OptimisticRow, MutationTypes } from './types';
import type { KeyedMutator} from 'swr';
import type { BuildOptimisticFunc } from "./useOptimisticOperations";

type HandleMutationWithOptimisticUpdates = (params: {
  operation: MutationTypes,
  rowForSupabase: Row,
  shouldReturnRow: boolean,
  returnImmediately: boolean,
  optimisticRow?: Row,
  optimisticData?: Rows,
  optimisticCount?: number,
  mutateFromUseMutablePlasmicQueryData: KeyedMutator<SupabaseProviderFetchResult>,
  mutatorFunction: (rowForSupabase: Row, shouldReturnRow: boolean) => Promise<SupabaseProviderFetchResult>,
  buildOptimisticFunc: BuildOptimisticFunc,
  setIsMutating: (value: boolean) => void,
  onMutateSuccess: (mutateResult: SupabaseProviderMutateResult) => void,
  onError: (supabaseProviderError: SupabaseProviderError) => void,
}) => Promise<SupabaseProviderFetchResult>;

type GetOperationPhrases = (operation: MutationTypes) => {
  elementActionName: ElementActionName;
  inProgress: string;
  success: string;
  error: string;
}

const getOperationPhrases : GetOperationPhrases = (operation: MutationTypes) => {
  switch (operation) {
    case "insert":
      return {
        elementActionName: "Add Row",
        inProgress: "Add row in progress",
        success: "Successfully added row",
        error: "Error adding row",
      };
    case "update":
      return {
        elementActionName: "Edit Row",
        inProgress: "Edit row in progress",
        success: "Successfully edited row",
        error: "Error editing row",
      };
    case "delete":
      return {
        elementActionName: "Delete Row",
        inProgress: "Delete row in progress",
        success: "Successfully deleted row",
        error: "Error deleting row",
      };
    case "rpc":
      return {
        elementActionName: "Run RPC",
        inProgress: "Run RPC in progress",
        success: "Successfully ran RPC",
        error: "Error running RPC",
      };
    case "flexibleMutation":
      return {
        elementActionName: "Flexible Mutation",
        inProgress: "Flexible Mutation in progress",
        success: "Successfully ran Flexible Mutation",
        error: "Error running Flexible Mutation",
      };
  }
}

type GetOptimisticOperation = (operation: MutationTypes, optimisticRowOrData: Row | undefined) => OptimisticOperation;

const getOptimisticOperation : GetOptimisticOperation = (operation: MutationTypes, optimisticRowOrData: Row | undefined) => {
  if((operation === "insert" || operation === "update" || operation === "delete") && optimisticRowOrData) {
    return operation;
  } else if((operation === "rpc" || operation === "flexibleMutation") && optimisticRowOrData) {
    return "replaceData";
  } else { 
    return null;
  }
}

export const handleMutationWithOptimisticUpdates: HandleMutationWithOptimisticUpdates = async ({
  operation,
  rowForSupabase,
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

    //Get the phrases for referring to thie operation 
    //Eg "insert" is from the element action "Add Row", the in progress message is "Add row in progress", etc
    const operationPhrases = getOperationPhrases(operation);

    //Check if we have an optimisticRow or optimisticData
    //Only one is valid at a time
    if(optimisticRow && optimisticData) {
      throw new Error("ERror in handleMUtationWithOptimisticUpdates: You can only specify an optimisticRow or optimisticData, not both");
    }

    // Todo: update to handle optimisticData or optimisticRow (running specific optimistic func, or replacing data for rpc or flexibleMutation)
    // Also need to handle optimisticCount when we have optimisticData
    // Consider if optimisticData should be { data: Rows, count: number } or just Rows. (Should they be separate)
    // Determine the optimistic operation and function to run
    // If no optimisticRow or optimisticData was provided, the optimistic func will be returnUnchangedData, effectively disabling optimistic ops
    let optimisticOperation = getOptimisticOperation(operation, optimisticRow);

    const optimisticFunc = buildOptimisticFunc(
      optimisticOperation,
      operationPhrases.elementActionName
    );

    //Add an optimistic id to the row if present
    //Leave optimisticData unchanged
    let optimisticDataFinal: OptimisticRow | Rows | null = null;
    if (optimisticRow)
      optimisticDataFinal = {
        ...optimisticRow,
        optimisticId: uuid(),
        isOptimistic: true,
      };
    else if (optimisticData) {
      optimisticDataFinal = optimisticData
    }

    // Resolve immediately if returnImmediately is true
    // The mutation will still run in the background (see below)
    if (returnImmediately) {
      console.log("returning immediately");
      const result : SupabaseProviderMutateResult = {
        data: null,
        optimisticData: optimisticDataFinal,
        count: null,
        action: operation,
        summary: operationPhrases.inProgress,
        status: "pending",
        error: null,
      };
      resolve(result);
    }

    console.log("running mutation");

    // Run the mutation
    mutate(mutatorFunction(rowForSupabase, shouldReturnRow), {
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
          optimisticData: optimisticDataFinal,
          count: response ? response.count : null,
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
          const result: SupabaseProviderMutateResult = {
            data: null,
            optimisticData: optimisticDataFinal,
            count: null,
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