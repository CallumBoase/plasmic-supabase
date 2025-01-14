import type { Row, Rows, MutationTypes, OptimisticOperation } from "../types";

export type GetOptimisticOperation = (
  operation: MutationTypes,
  optimisticRowOrData: Row | Rows | null
) => OptimisticOperation;

export const getOptimisticOperation: GetOptimisticOperation = (
  operation,
  optimisticRowOrData
) => {
  if (
    (operation === "insert" ||
      operation === "update" ||
      operation === "delete") &&
    optimisticRowOrData
  ) {
    return operation;
  } else if (
    (operation === "rpc" || operation === "flexibleMutation") &&
    optimisticRowOrData
  ) {
    return "replaceData";
  } else {
    return null;
  }
};