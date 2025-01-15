export const validateFlexibleMutationSettings = ({
  tableName,
  operation,
  dataForSupabase,
  filters,
}: {
  tableName: any;
  operation: any;
  dataForSupabase: any;
  filters: any;
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
};


