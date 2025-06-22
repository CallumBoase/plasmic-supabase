import type { PostgrestResponseSuccess } from "@supabase/postgrest-js";

// Useful type for empty string
export type EmptyString = "";

// Type for a single Supabase row - an object with key-value pairs
export type Row = {
  [key: string]: any;
};

// Type for a single Optimistic Supabase row - an object with key-value pairs plus optimisticId and isOptimistic
export type OptimisticRow = Row & {
  optimisticId: string;
  isOptimistic: boolean;
}

// Type for multiple Supabase rows - an array of objects with key-value pairs
export type Rows = Row[];

export type MutationTypes = "insert" | "update" | "delete" | "rpc" | "flexibleMutation";
export type OptimisticOperation = "addRow" | "editRow" | "deleteRow" | "replaceData" | null;
export type FlexibleMutationOperations = "insert" | "update" | "upsert" | "delete";
export type ElementActionName = "Add Row" | "Edit Row" | "Delete Row" | "Run RPC" | "Flexible Mutation";
export type ReturnCountOptions = "none" | "exact" | "planned" | "estimated";

// Custom error object for SupabaseProvider
export type SupabaseProviderError = {
  errorId: string;
  summary: string;
  errorMessage: string;
  actionAttempted: "select" | MutationTypes;
  dataForSupabase: Row | Rows | null;
  optimisticData: OptimisticRow | Rows | null;
  customMetadata: Object | undefined;
};

// Type for the response from a fetch of data from Supabase
// Uses { data, count } from supabase.select() response
export type SupabaseProviderFetchResult = {
  data: PostgrestResponseSuccess<Rows>["data"] |null;
  count: PostgrestResponseSuccess<Rows>["count"] | null;
};

// Type for the response from an RPC call to Supabase
// The format is less predictable because it depends on what the user configures the RPC to return
export type RpcResponse = {
  data: PostgrestResponseSuccess<any>["data"] | null;
  count: PostgrestResponseSuccess<any>["count"] | null;
}

// Type for the response from a mutate function
// Uses { data, count } from supabase.insert/update/delete/rpc/select() response
// And we include an error object (or null)
export type SupabaseProviderMutateResult = {
  // data: PostgrestResponseSuccess<Rows>["data"] |  null;
  data: PostgrestResponseSuccess<Rows>["data"] |  null;
  count: PostgrestResponseSuccess<Rows>["count"] | null;
  //optimisticData may be a single row (eg from addRow or editRow) or multiple rows ie the entire optimisticData (eg from runRpc or fleixbleMutaiton)
  optimisticData: OptimisticRow | Rows | null;
  //for runRPC and flexibleMutation, the user can specify an optimisticCount
  //this is the count that will be displayed optimistically
  //for addRow, editRow and deleteRow, we automatically adjuts the count optimistically so there will be no optimistic count
  optimisticCount: number | null;
  dataForSupabase: Row | Rows | undefined;
  action: MutationTypes;
  summary: string;
  status: "success" | "error" | "pending";
  error: SupabaseProviderError | null;
  customMetadata: Object | undefined;
};