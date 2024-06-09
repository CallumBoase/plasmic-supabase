import type { User as SupabaseUser } from "@supabase/supabase-js";

//declare a type to match the function below
export type AuthorizationCheckFunction = (plasmicPath: string, user: SupabaseUser | null) => boolean;

//declare a type to match string starting with "/" then having anything
export type RoutePath = `/${string}`;


