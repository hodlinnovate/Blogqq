
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { BlogPost, SiteSettings } from '../types';
import { SUPABASE_CONFIG } from '../constants';

export const getDbClient = () => {
  // 1. constants.ts의 설정을 먼저 확인 (하드코딩된 경우 전역 공유 가능)
  if (SUPABASE_CONFIG.url && SUPABASE_CONFIG.key) {
    return createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
  }

  // 2. 어드민에서 입력한 브라우저 설정을 확인
  const savedSettings = localStorage.getItem('crypto_site_settings');
  if (!savedSettings) return null;
  
  try {
    const config = JSON.parse(savedSettings);
    if (!config || typeof config !== 'object' || !config.supabaseUrl || !config.supabaseKey) {
      return null;
    }
    return createClient(config.supabaseUrl, config.supabaseKey);
  } catch (e) {
    return null;
  }
};

// 클라우드 연결 상태 확인용
export const isCloudConnected = () => {
  return getDbClient() !== null;
};

export const fetchPostsFromCloud = async (): Promise<BlogPost[] | null> => {
  const supabase = getDbClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('posts').select('*').order('date', { ascending: false });
    if (error) return null;
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
    if (error || !data) return null;
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
    return !error;
  } catch (e) {
    return false;
  }
};

export const deletePostFromCloud = async (id: string) => {
  const supabase = getDbClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    return !error;
  } catch (e) {
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
