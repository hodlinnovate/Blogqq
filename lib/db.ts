
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

export const incrementPostViews = async (postId: string) => {
  const supabase = getDbClient();
  if (!supabase) return;

  try {
    // Supabase RPC를 사용하는 것이 좋으나, 간단하게 현재 값 + 1 업데이트
    const { data: currentPost } = await supabase.from('posts').select('views').eq('id', postId).single();
    const newViews = (currentPost?.views || 0) + 1;
    await supabase.from('posts').update({ views: newViews }).eq('id', postId);
  } catch (e) {
    console.error("Increment Views Error:", e);
  }
};

export const recordVisit = async (postId: string, referrer: string) => {
  const supabase = getDbClient();
  if (!supabase) return;

  try {
    // analytics 테이블에 방문 기록 저장
    const source = referrer || 'Direct / Bookmark';
    await supabase.from('analytics').insert({
      post_id: postId,
      referrer: source,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    // analytics 테이블이 없는 경우 조용히 넘어감
  }
};

export const fetchTodayVisitorCount = async (): Promise<number> => {
  const supabase = getDbClient();
  if (!supabase) return 0;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count, error } = await supabase
      .from('analytics')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', today.toISOString());
    
    if (error) return 0;
    return count || 0;
  } catch (e) {
    return 0;
  }
};

export const fetchPostAnalytics = async (postId: string) => {
  const supabase = getDbClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase.from('analytics').select('referrer').eq('post_id', postId);
    if (error || !data) return [];
    
    // 유입 경로별 카운트 계산
    const counts: Record<string, number> = {};
    data.forEach((item: any) => {
      const ref = item.referrer || 'Unknown';
      counts[ref] = (counts[ref] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);
  } catch (e) {
    console.error("Analytics fetch exception:", e);
    return [];
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
