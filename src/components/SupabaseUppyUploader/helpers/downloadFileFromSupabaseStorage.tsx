import createClient from "../../../utils/supabase/component";

//Helper function to download a file from Supabase Storage using supabase-js
export default async function downloadFileFromSupabaseStorage(
  bucketName: string,
  filePath: string
) {
  console.log('download file')
  const supabase = createClient();
  return await supabase.storage
    .from(bucketName)
    .download(filePath);
}