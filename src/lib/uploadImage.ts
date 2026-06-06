import { supabase } from './supabase';

const BUCKET = 'palawanmart_images';
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export async function uploadImageToSupabase(file: File, folder: string): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Check environment variables.');
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Unsupported file type. Please use jpg, jpeg, png, or webp.');
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const uniqueName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `${folder}/${uniqueName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
