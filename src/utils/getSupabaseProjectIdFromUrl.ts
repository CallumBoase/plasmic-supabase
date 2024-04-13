export default function getSupabaseProjectIdFromUrl(url: string) {
  return url
    .split("//")[1]
    .split(".")[0];
}