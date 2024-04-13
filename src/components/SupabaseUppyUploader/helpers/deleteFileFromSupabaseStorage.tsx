import createClient from "../../../utils/supabase/component";
import getErrMsg from "../../../utils/getErrMsg";

//Helper function to delete a file from Supabase Storage using supabase-js
export default async function deleteFileFromSupabaseStorage (bucketName: string, path: string) {
  const supabase = createClient();

  const { data, error } = await supabase.storage.from(bucketName).remove([path]);

  if(error) {
    throw Error(getErrMsg(error));
  }

  if(data?.length === 0) {
    throw Error("No file was deleted (0 length data returned)");
  }

  return { data, error };

}

export type DeleteFileFromSupabaseStorage = typeof deleteFileFromSupabaseStorage;