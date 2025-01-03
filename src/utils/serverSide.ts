// Helper function to see if we are currently running on the server ( as opposed in the browser )
// E.g., this will return true if a component is being fake-rendered within getStaticProps via extractPlasmicQueryData
// This is useful for choosing the correct supabase client to create, 
// or for opting-out of prefetching data server-side withih a SupabasePRovider
// Docs on extractPlasmicQueryData: https://docs.plasmic.app/learn/data-code-components/#how-extractplasmicquerydata-works
export default function serverSide() {
  return typeof window === "undefined" &&
    typeof document === "undefined" &&
    typeof localStorage === "undefined";
}