import { CodeComponentMeta } from "@plasmicapp/host";
import { SupabaseProviderProps } from ".";

export const SupabaseProviderMeta : CodeComponentMeta<SupabaseProviderProps> = {
  name: "SupabaseProvider",
  importPath: "./index",
  providesData: true,
  props: {
    children: {
      type: "slot",
      defaultValue: [
        {
          type: "text",
          value:
            `INSTRUCTIONS FOR SUPABASE PROVIDER:
            1. Click the new SupabaseProvider component in the Component tree (LHS of screen) to open it's settings
            2. In settings on RHS of screen, choose a globally unique "Query name" (eg "/pagename/staff")
            3. Enter the correct "table name" from Supabase (eg "staff")
            4. On LHS of screen, change the name of SupabaseProvider to match the query name
            5. Delete this placeholder text (from "children" slot). Then add components to "children" and use the dynamic data as you wish! :)`,
        },
      ],
    },
    queryName: {
      type: "string",
      required: true,
    },
    tableName: {
      type: "string",
      required: true,
    },
    columns: {
      type: "string",
      defaultValue: "*",
    },
    filters: {
      type: "array",
      itemType: {
        type: "object",
        fields: {
          fieldName: "string",
          operator: {
            type: "choice",
            options: [
              {
                value: "eq",
                label: "is equal to (eq)"
              },
              {
                value: "neq",
                label: "not equal to (neq)"
              },
              {
                value: "gt",
                label: "greater than (gt)"
              },
              {
                value: "gte",
                label: "greater than or equal to (gte)"
              },
              {
                value: "lt",
                label: "less than (lt)"
              },
              {
                value: "lte",
                label: "less than or equal to (lte)"
              },
              {
                value: "like",
                label: "matches a case-sensitive pattern (like)"
              },
              {
                value: "ilike",
                label: "matches a case-insensitive pattern (ilike)"
              },
              {
                value: "is",
                label: "is (is)"
              },
              {
                value: "in",
                label: "is in an array (in)"
              },
              {
                value: "contains",
                label: "contains every element in (contains)"
              },
              {
                value: "containedBy",
                label: "contained by (containedby)"
              },
              {
                value: "rangeGt",
                label: "greater than range (rangeGt)"
              },
              {
                value: "rangeGte",
                label: "greater than or equal to range (rangeGte)"
              },
              {
                value: "rangeLt",
                label: "less than range (rangeLt)"
              },
              {
                value: "rangeLte",
                label: "less than or equal to range (rangeLte)"
              },
              {
                value: "rangeAdjacent",
                label: "is mutually exclusive to range (rangeAdjacent)"
              },
              {
                value: "overlaps",
                label: "has an element in common with (overlaps)"
              },
              {
                value: "match",
                label: "where each { column:value, ... } matches (match)"
              },
              {
                value: "or",
                label: "that matches at least one PostgREST filter (or)"
              },
              {
                value: "textSearch",
                label: "matches the query string (textSearch)"
              },
              {
                value: "not",
                label: "that doesn't match the PostgREST filter (not)"
              },
            ]
          },
          value: "string",
          value2: "string",
        },
      },
      description:
        "Filters to execute during the query. Acceptable values are eq, neq, gt, lt, gte, lte.",
    },
    orderBy: {
      type: "array",
      itemType: {
        type: "object",
        fields: {
          fieldName: "string",
          direction: {
            type: "choice",
            options:  [
              {label: "Ascending",value: "asc"}, 
              {label: "Descending",value: "desc"}
            ],
          },
        },
      },
      displayName: "Order by",
      description:
        "Columns to order the results by during the query.",
    },
    limit: {
      type: "number",
      step: 1,
      min: 0,
      required: false,
      description: 'Number of records to fetch',
      advanced: true,
    },
    offset: {
      type: "number",
      step: 1,
      min: 0,
      required: false,
      description: 'Number of records to skip',
      advanced: true,
    },
    returnCount: {
      type: "choice",
      options: ["none", "exact", "planned", "estimated"],
      defaultValue: "none",
      required: false,
      description: 'Count algorithm to use to count rows in the table or view. `"none"`: Don\'t return a count. `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the hood. `"planned"`: Approximated but fast count algorithm. Uses the Postgres statistics under the hood. `"estimated"`: Uses exact count for low numbers and planned count for high numbers.',
      advanced: true,
    },
    uniqueIdentifierField: {
      type: "string",
      required: true,
      defaultValue: "id"
    },
    onError: {
      type: "eventHandler",
      argTypes: [{name: 'supabaseProviderError', type: 'object'}],
      required: false,
      description: 'Event handler for when an error occurs with fetch or mutate of data. Within this handler you can access the error that occured via the variable "supabaseProviderError"'
    },
    onMutateSuccess: {
      type: "eventHandler",
      argTypes: [{name: 'mutateResult', type: 'object'}],
      required: false,
      description: 'Event handler for when a mutation is successful. Within this handler you can access the result of the mutation via the variable "mutateResult"'
    },
    skipServerSidePrefetch: {
      type: "boolean",
      required: false,
      defaultValue: false,
      description: `
        In the standard configuration of Plasmic (NextJS + Loader API), Plasmic will prefetch data form Supabase on the server before the page containing the SupabaseProvider is rendered (if data is not in cache).
        If data is in cache, the stale data will be used (no server-side fetch), before the client-side refetch is triggered.
        This behaviour is normally desirable because of the SEO benefits.
        However, if you wish to disable server-side prefetch, you can set this prop to TRUE.`,
      advanced: true
    },
    addDelayForTesting: {
      type: "boolean",
      required: false,
      defaultValue: false,
      description: `
        Whether to add a 1 second delay when fetching or mutating data from Supabase. Useful for testing.`,
      advanced: true
    },
    simulateRandomFetchErrors: {
      type: "boolean",
      required: false,
      defaultValue: false,
      description: `
        Whether to simulate random fetch errors when fetching data from Supabase. Useful for testing.`,
      advanced: true
    },
    simulateRandomMutationErrors: {
      type: "boolean",
      required: false,
      defaultValue: false,
      description: `
        Whether to simulate random mutation errors when mutating data in Supabase. Useful for testing.`,
      advanced: true
    },
  },
  refActions: {
    addRow: {
      description: "Add a row to the database",
      argTypes: [
        { name: "rowForSupabase", type: "object", displayName: "Row object to send to Supabase" },
        { name: "shouldReturnRow", type: "boolean", displayName: "Return mutated row? (Returns null if false)" },
        { name: "returnImmediately", type: "boolean", displayName: "Run next action immediately without waiting for mutation to finish?" },
        { name: "optimisticRow", type: "object", displayName: "Optimistic new row object (optional)" },
        { name: "customMetadata", type: "object", displayName: "Custom metadata object to pass to pass to onMutateSuccess and onError (optional)" },
      ],
    },
    editRow: {
      description: "Edit a row in the database",
      argTypes: [
        { name: "rowForSupabase", type: "object", displayName: "Edited row object to send to Supabase. Must include the unique identifier field (eg id)" },
        { name: "shouldReturnRow", type: "boolean", displayName: "Return mutated row? (Returns null if false)" },
        { name: "returnImmediately", type: "boolean", displayName: "Run next action immediately without waiting for mutation to finish?" },
        { name: "optimisticRow", type: "object", displayName: "Optimistic edited row object (optional). Must include the unqiue identifier field (eg id)" },
        { name: "customMetadata", type: "object", displayName: "Custom metadata object to pass to pass to onMutateSuccess and onError (optional)" },
      ],
    },
    deleteRow: {
      description: "Delete a row from the database",
      argTypes: [
        { name: "uniqueIdentifierVal", type: "string", displayName: "Id / unique identifier of the row to delete" },
        { name: "shouldReturnRow", type: "boolean", displayName: "Return mutated row? (Returns null if false)" },
        { name: "returnImmediately", type: "boolean", displayName: "Run next action immediately without waiting for mutation to finish?" },
        { name: "shouldRunOptimistically", type: "boolean", displayName: "Delete row optimistically?" },
        { name: "customMetadata", type: "object", displayName: "Custom metadata object to pass to pass to onMutateSuccess and onError (optional)" },
      ],
    },
    flexibleMutation: {
      description: "Perform a flexible mutation in the database",
      argTypes: [
        { name: "tableName", type: "string", displayName: "Table name (to run mutation on)"},
        { name: "operation", type: "string", displayName: "Operation to run in the database (insert / update / upsert / delete)" },
        { name: "dataForSupabase", type: "object", displayName: "Data for Supabase API call (leave blank for delete)" },
        { 
          name: "filters", 
          type: "object", 
          displayName: "Filters for update/delete (array of objects eg {fieldName: 'id', operator: 'eq', value: 1, value2: null})" 
        },
        { name: "shouldReturnRow", type: "boolean", displayName: "Return mutated row? (Returns null if false)" },
        { name: "returnImmediately", type: "boolean", displayName: "Run next action immediately without waiting for mutation to finish?" },
        { 
          name: "optimisticOperation", 
          type: "string", 
          displayName: "Optimistic operation (addRow / editRow / deleteRow / replaceData) (optional)",
        },
        { name: "optimisticData", type: "object", displayName: "Data for optimistic operation  (if doing). For addRow / editRow / deleteRow: must be an object. For editRow / deleteRow the unique identifier field must be present. For replaceData must be array of objects." },
        { name: "optimisticCount", type: "number", displayName: "Optimistic count value (optional, if doing replaceData optimistic operation)" },
        { name: "customMetadata", type: "object", displayName: "Custom metadata object to pass to onMutateSuccess and onError (optional)" },
      ],
    },
    runRpc: {
      description: 'Run a RPC (function) in Supabase',
      argTypes: [
        { name: "rpcName", displayName: 'Name of the RPC', type: "string" },
        { name: "dataForSupabase", displayName: 'Data for to pass to the RPC', type: "object"},
        { name: "returnImmediately", displayName: 'Run next action immediately without waiting for mutation to finish?', type: "boolean"},
        { 
          name: "optimisticOperation", 
          type: "string", 
          displayName: "Optimistic operation (addRow / editRow / deleteRow / replaceData) (optional)",
        },
        { name: "optimisticData", type: "object", displayName: "Data for optimistic operation  (if doing). For addRow / editRow / deleteRow: must be an object. For editRow / deleteRow the unique identifier field must be present. For replaceData must be array of objects." },
        { name: "optimisticCount", type: "number", displayName: "Optimistic count value (optional, if doing replaceData optimistic operation)" },
        { name: "customMetadata", type: "object", displayName: "Custom metadata object to pass to onMutateSuccess and onError (optional)" },
      ]
    },
    refetchRows: {
      description: "refetch rows from the database",
      argTypes: [],
    }
  }
};