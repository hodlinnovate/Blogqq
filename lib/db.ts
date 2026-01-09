
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { BlogPost, SiteSettings } from '../types';
import { SUPABASE_CONFIG } from '../constants';

export const getDbClient = () => {
  if (SUPABASE_CONFIG.url && SUPABASE_CONFIG.key && SUPABASE_CONFIG.key.length > 20) {
    try {
      return createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
    } catch (e) {
      console.error("Supabase Client Init Error (Hardcoded):", e);
    }
  }

  const savedSettings = localStorage.getItem('crypto_site_settings');
  if (!savedSettings) return null;
  
  try {
    const config = JSON.parse(savedSettings);
    if (config?.supabaseUrl && config?.supabaseKey && config.supabaseKey.length > 20) {
      return createClient(config.supabaseUrl, config.supabaseKey);
    }
  } catch (e) {
    console.error("Supabase Client Init Error (LocalStorage):", e);
  }
  return null;
};

export const isCloudConnected = () => {
  const client = getDbClient();
  return client !== null;
};

export const fetchPostsFromCloud = async (): Promise<BlogPost[] | null> => {
  const supabase = getDbClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('posts').select('*').order('date', { ascending: false });
    if (error) {
      console.error("Fetch Posts Error:", error.message);
      return null;
    }
    return data as BlogPost[];
  } catch (e) {
    return null;
  }
};

export const fetchPostBySlugFromCloud = async (slug: string): Promise<BlogPost | null> => {
  const supabase = getDbClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('posts').select('*').or(`slug.eq.${slug},id.eq.${slug}`).single();
    if (error) return null;
    return data as BlogPost;
  } catch (e) {
    return null;
  }
};

export const savePostToCloud = async (post: BlogPost) => {
  const supabase = getDbClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('posts').upsert(post);
    if (error) {
      console.error("Save Post Error:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
};

export const deletePostFromCloud = async (id: string) => {
  const supabase = getDbClient();
  if (!supabase) {
    console.warn("Cloud not connected - deleting locally only.");
    return true;
  }

  try {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) {
      console.error("Delete Post Error (Supabase):", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Delete Post Exception:", e);
    return false;
  }
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

  try {
    const { error } = await supabase.from('settings').upsert({ id: 1, data: settings });
    return !error;
  } catch (e) {
    return false;
  }
};
