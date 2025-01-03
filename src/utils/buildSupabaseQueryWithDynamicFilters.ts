import { type SupabaseClient } from "@supabase/supabase-js";
import { PostgrestTransformBuilder, PostgrestFilterBuilder, PostgrestQueryBuilder } from "@supabase/postgrest-js"

import {
  supabaseJsFilterOperators_oneArg,
  supabaseJsFilterOperators_twoArg,
  supabaseJsFilterOperators_threeArg,
  type SupabaseJsFilterOperator_oneArg,
  type SupabaseJsFilterOperator_twoArg,
  type SupabaseJsFilterOperator_threeArg,
} from "../types/supabase-js-filter-ops";

export type Filter = {
  fieldName: any;
  operator: any;
  value: any;
  value2: any; //2nd value needed for some filters
};

export type OrderBy = {
  fieldName: string;
  direction: "asc" | "desc";
};

export type BuildSupabaseQueryWithDynamicFiltersProps = {
  supabase: SupabaseClient;
  tableName: string;
  operation: "select" | "insert" | "update" | "upsert" | "delete";
  columns: string | null | undefined;
  dataForSupabase: any;
  filters: Filter[] | undefined;
  orderBy: OrderBy[] | null;
  limit?: number;
  offset?: number;
  returnCount?: "none" | "exact" | "planned" | "estimated";
};

const buildSupabaseQueryWithDynamicFilters = ({
  supabase,
  tableName,
  operation,
  columns,
  dataForSupabase,
  filters,
  orderBy,
  limit,
  offset,
  returnCount = "none",
} : BuildSupabaseQueryWithDynamicFiltersProps): PostgrestTransformBuilder<any, any, any> | PostgrestFilterBuilder<any, any, null> => {
  //Build the query with dynamic filters passed as props to the component
  //The basic query
  let supabaseQuery: PostgrestTransformBuilder<any, any, any> | PostgrestFilterBuilder<any, any, any, any> | undefined;
  if(operation === "select" ){
    if(!columns) throw new Error("Error in buildSupabaseQueryWithDynamicFilters: columns must be a string like '*' or 'id, name' for select operation.");
    if(returnCount === "none" || !returnCount) {
      supabaseQuery = supabase.from(tableName).select(columns);
    } else if ( ['exact', 'planned', 'estimated'].includes(returnCount) ) {
      supabaseQuery = supabase.from(tableName).select(columns, { count: returnCount });
    }
  } else if (operation === "insert") {
    if(!dataForSupabase) throw new Error("Error in buildSupabaseQueryWithDynamicFilters: dataForSupabase must be an object with key-value pairs for insert operation.");
    supabaseQuery = supabase.from(tableName).insert(dataForSupabase);
  } else if (operation === "update") {
    if(!dataForSupabase) throw new Error("Error in buildSupabaseQueryWithDynamicFilters: dataForSupabase must be an object with key-value pairs for update operation.");
    supabaseQuery = supabase.from(tableName).update(dataForSupabase);
  } else if (operation === "upsert") {
    if(!dataForSupabase) throw new Error("Error in buildSupabaseQueryWithDynamicFilters: dataForSupabase must be an object with key-value pairs for upsert operation.");
    supabaseQuery = supabase.from(tableName).upsert(dataForSupabase);
  } else if (operation === "delete") {
    supabaseQuery = supabase.from(tableName).delete();
  } else {
    throw new Error("Error in buildSupabaseQueryWithDynamicFilters: Invalid operation. Must be select, insert, update, upsert, or delete.");
  }

  
  //The dynamic filters if present
      if (filters && filters.length > 0) {
        filters.forEach((filter) => {
          if (supabaseJsFilterOperators_oneArg.includes(filter.operator)) {
            const operator = filter.operator as SupabaseJsFilterOperator_oneArg;
            //Typescript ignore next line because it doesn't like the dynamic operator and no benefit for enforcing safety
            // @ts-ignore-next-line
            supabaseQuery[operator](filter.fieldName);
          } else if (supabaseJsFilterOperators_twoArg.includes(filter.operator)) {
            const operator = filter.operator as SupabaseJsFilterOperator_twoArg;
            //Typescript ignore next line because it doesn't like the dynamic operator and no benefit for enforcing safety
            // @ts-ignore-next-line
            supabaseQuery[operator](filter.fieldName, filter.value);
          } else if (supabaseJsFilterOperators_threeArg.includes(filter.operator)) {
            const operator = filter.operator as SupabaseJsFilterOperator_threeArg;
            //Typescript ignore next line because it doesn't like the dynamic operator and no benefit for enforcing safety
            // @ts-ignore-next-line
            supabaseQuery[operator](filter.fieldName, filter.value, filter.value2);
          } else {
            throw new Error("Invalid filter operator");
          }
        });
      }

  // we check if supabase query is still undefined to make typescript happy and be safe
    if (supabaseQuery) {

      
      //Order the result if present
      if (operation === "select" && orderBy && orderBy.length > 0) {
        orderBy.forEach((orderField) => {
          //Typescript ignore next line because it doesn't like the dynamic operator and no benefit for enforcing safety
          //@ts-ignore-next-line
          supabaseQuery = supabaseQuery.order(orderField.fieldName, { ascending: (orderField.direction === "asc") })
        })
      }

      //Apply limit and offset if the operation is a select operation. 
      //Whilst limit and offset work where on update and delete (to update a fixed range of records) and work when .select() is appended to a .delete or .insert to return 
      //the result of the operation, it will give unpredicatable results if used incorrectly.
      if(operation === "select" ) {
        if(limit && offset) {
          supabaseQuery = supabaseQuery.range(offset, offset+limit-1) //the range operation takes two zero-based indexes, inclusively.
        } else if (limit) {
          supabaseQuery = supabaseQuery.limit(limit)
        } else if (offset) {
          throw new Error("Invalid combination of Supabase API operations. Offset operation not allowed without limit.")
        }
      }

    } else {
      throw new Error("Supabase query was never initialized.");
    }

  return supabaseQuery;
}

export default buildSupabaseQueryWithDynamicFilters;