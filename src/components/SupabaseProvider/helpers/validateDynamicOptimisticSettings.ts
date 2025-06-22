export function validateDynamicOptimisticSettings({
  optimisticData,
  requestedOptimisticOperation: requestedOptimisticOperation,
}: {
  optimisticData: any;
  requestedOptimisticOperation: any;
}) {
  // optimisticOperation must be one of the valid options
  // Check agains the OptimisticOperation type
  if (
    requestedOptimisticOperation &&
    ["addRow", "editRow", "deleteRow", "replaceData"].includes(
      requestedOptimisticOperation
    ) === false
  ) {
    throw new Error(
      'Error: Invalid optimisticOperation. Allowed options are blank, "addRow", "editRow", "deleteRow", or "replaceData"'
    );
  }

  // If optimitsic operation is addRow, editRow or deleteRow: optimisticData must be an object
  if (
    (requestedOptimisticOperation === "addRow" ||
      requestedOptimisticOperation === "editRow" ||
      requestedOptimisticOperation === "deleteRow") &&
    (!optimisticData ||
      Array.isArray(optimisticData) ||
      typeof optimisticData !== "object")
  ) {
    throw new Error(
      "Error: optimisticData must be an object when running optimistic operation: addRow, editRow or deleteRow"
    );
  }

  // If optimistic operation is replaceData, optimisticData must be an array of objects
  if (
    requestedOptimisticOperation === "replaceData" &&
    (!optimisticData ||
      !Array.isArray(optimisticData) ||
      optimisticData.length === 0)
  ) {
    throw new Error(
      "Error: optimisticData must be an array of objects when running optimistic operation: replaceData"
    );
  }
}