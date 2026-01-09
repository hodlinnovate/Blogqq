
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { BlogPost, SiteSettings } from '../types';

export const getDbClient = () => {
  const savedSettings = localStorage.getItem('crypto_site_settings');
  if (!savedSettings) return null;
  
  try {
    const { supabaseUrl, supabaseKey } = JSON.parse(savedSettings);
    if (!supabaseUrl || !supabaseKey) return null;
    return createClient(supabaseUrl, supabaseKey);
  } catch (e) {
    console.error("DB Connection Error:", e);
    return null;
  }
};

export const fetchPostsFromCloud = async (): Promise<BlogPost[] | null> => {
  const supabase = getDbClient();
  if (!supabase) return null;

  const { data, error } = await supabase.from('posts').select('*').order('date', { ascending: false });
  if (error) {
    console.error("Fetch Error:", error);
    return null;
  }
  return data as BlogPost[];
};

export const fetchPostBySlugFromCloud = async (slug: string): Promise<BlogPost | null> => {
  const supabase = getDbClient();
  if (!supabase) return null;

  const { data, error } = await supabase.from('posts').select('*').eq('slug', slug).single();
  if (error || !data) return null;
  return data as BlogPost;
};

export const savePostToCloud = async (post: BlogPost) => {
  const supabase = getDbClient();
  if (!supabase) return false;

  const { error } = await supabase.from('posts').upsert(post);
  return !error;
};

export const deletePostFromCloud = async (id: string) => {
  const supabase = getDbClient();
  if (!supabase) return false;

  const { error } = await supabase.from('posts').delete().eq('id', id);
  return !error;
};

export const fetchSettingsFromCloud = async (): Promise<Partial<SiteSettings> | null> => {
  const supabase = getDbClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('settings').select('data').eq('id', 1).single();
    if (error || !data || !data.data) return null;
    return data.data;
  } catch (e) {
    return null;
  }
};

export const saveSettingsToCloud = async (settings: SiteSettings) => {
  const supabase = getDbClient();
  if (!supabase) return false;

  const { error } = await supabase.from('settings').upsert({ id: 1, data: settings });
  return !error;
};
