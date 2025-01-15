export const validateFlexibleMutationSettings = ({
  tableName,
  operation,
  dataForSupabase,
  filters,
  optimisticData,
  optimisticOperation,
}: {
  tableName: any;
  operation: any;
  dataForSupabase: any;
  filters: any;
  optimisticData: any;
  optimisticOperation: any;
}) => {
  // A tableName must be provided
  if (!tableName || typeof tableName !== "string") {
    throw new Error("Error in flexibleMutation: tableName must be a string");
  }

  // The operations must be one of the valid options
  if (["insert", "update", "upsert", "delete"].includes(operation) === false) {
    throw new Error(
      'Error in flexibleMutation: Invalid operation. Allowed options are "insert", "update", "upsert", or "delete"'
    );
  }

  // If operation is insert, update or upsert, dataForSupabase must be provided
  // And it must be an object
  if (operation !== "delete") {
    if (
      !dataForSupabase ||
      Array.isArray(dataForSupabase) ||
      typeof dataForSupabase !== "object"
    ) {
      throw new Error(
        "Flexible query error: dataForSupabase must be an object for operations: insert, update or upsert."
      );
    }
  }

  // If operation is delete, update or upsert, an array of filters must be provided
  if (
    (operation === "delete" ||
      operation === "update" ||
      operation === "upsert") &&
    (!filters || !Array.isArray(filters) || filters.length === 0)
  ) {
    throw new Error(
      "Flexible query error: You must provide an array filters ([{fieldName: string, operator: supabaseFilterOps, value: any, value2?: any}]) when running operations: delete, update or upsert."
    );
  }

  // optimisticOperation must be one of the valid options
  // Check agains the OptimisticOperation type
  if (optimisticOperation && ["addRow", "editRow", "deleteRow", "replaceData"].includes(optimisticOperation) === false) {
    throw new Error(
      'Error in flexibleMutation: Invalid optimisticOperation. Allowed options are blank, "addRow", "editRow", "deleteRow", or "replaceData"'
    );
  }

  // If optimitsic operation is addRow, editRow or deleteRow: optimisticData must be an object
  if (
    (optimisticOperation === "addRow" || optimisticOperation === "editRow" || optimisticOperation === "deleteRow") &&
    (!optimisticData || Array.isArray(optimisticData) || typeof optimisticData !== "object")
  ) {
    throw new Error(
      "Flexible query error: optimisticData must be an object when running optimistic operation: addRow, editRow or deleteRow"
    );
  }

  // If optimistic operation is replaceData, optimisticData must be an array of objects
  if (
    optimisticOperation === "replaceData" &&
    (!optimisticData || !Array.isArray(optimisticData) || optimisticData.length === 0)
  ) {
    throw new Error(
      "Flexible query error: optimisticData must be an array of objects when running optimistic operation: replaceData"
    );
  }

};
