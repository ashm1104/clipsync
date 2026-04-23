import { supabase } from './supabase';

export type OgData = {
  title: string | null;
  description: string | null;
  image: string | null;
};

export async function fetchOg(url: string): Promise<OgData | null> {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-og', { body: { url } });
    if (error) return null;
    return data as OgData;
  } catch {
    return null;
  }
}
