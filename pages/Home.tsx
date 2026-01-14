
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BlogPost, SiteSettings } from '../types';
import { INITIAL_POSTS, DEFAULT_SETTINGS } from '../constants';
import { fetchPostsFromCloud, fetchSettingsFromCloud } from '../lib/db';
import SEO from '../components/SEO';
import AdSense from '../components/AdSense';

const Home: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const cloudSettings = await fetchSettingsFromCloud();
      if (cloudSettings) {
        setSettings(prev => ({ ...prev, ...cloudSettings }));
      } else {
        const savedSettings = localStorage.getItem('crypto_site_settings');
        if (savedSettings) setSettings(JSON.parse(savedSettings));
      }

      const savedPosts = localStorage.getItem('crypto_blog_posts');
      setPosts(savedPosts ? JSON.parse(savedPosts) : INITIAL_POSTS);

      const cloudPosts = await fetchPostsFromCloud();
      if (cloudPosts && cloudPosts.length > 0) {
        setPosts(cloudPosts);
        localStorage.setItem('crypto_blog_posts', JSON.stringify(cloudPosts));
      }
      
      setIsLoading(false);
    };

    loadData();
  }, []);

  // HTML 태그를 제거하고 순수 텍스트만 추출하는 함수
  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>?/gm, '');
  };

  const EXCLUDED_PHRASE = "새로운 인사이트가 업데이트되었습니다.";

  return (
    <div className="max-w-6xl mx-auto">
      <SEO title={settings.brandName + " " + settings.brandSubName} description={settings.mainSubtitle} />
      
      {isLoading ? (
        <div className="py-20 text-center text-gray-300 font-medium animate-pulse">Syncing...</div>
      ) : (
        <section className="divide-y divide-gray-50">
          {posts.map((post, index) => (
            <React.Fragment key={post.id}>
              <article className="group py-3 first:pt-0 last:pb-0">
                <Link to={`/post/${post.slug}`} className="flex items-center justify-between gap-6 md:gap-10">
                  <div className="flex-grow flex flex-col min-w-0">
                    <div className="flex items-center space-x-2 text-[8px] md:text-[9px] font-bold text-gray-400 uppercase mb-0.5 tracking-tight">
                      <span className="text-black bg-gray-100 px-1.5 py-0.5 rounded">{post.category}</span>
                      <span>•</span>
                      <span>{post.date}</span>
                    </div>
                    <h2 className="text-base md:text-lg font-black text-gray-900 group-hover:text-black group-hover:underline transition-all mb-0.5 leading-tight line-clamp-1 tracking-tighter">
                      {post.title}
                    </h2>
                    {/* 본문 내용 미리보기: 높이와 크기를 대폭 축소 (25% 수준) */}
                    <p className="text-gray-500 text-[11px] md:text-xs leading-tight line-clamp-1 font-medium mb-1">
                      {stripHtml(post.content)}
                    </p>
                    {/* 기존 excerpt 표시 (특정 문구는 제외 및 축소) */}
                    {post.excerpt && post.excerpt !== EXCLUDED_PHRASE && (
                      <p className="text-gray-300 text-[8px] md:text-[9px] font-bold uppercase tracking-widest opacity-60">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                  
                  {post.image && (
                    <div className="flex-shrink-0 w-16 h-16 md:w-24 md:h-24 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm">
                      <img 
                        src={post.image} 
                        alt={post.title}
                        className="w-full h-full object-cover grayscale transition-all group-hover:grayscale-0 group-hover:scale-105 duration-700" 
                      />
                    </div>
                  )}
                </Link>
              </article>

              {(index + 1) % 4 === 0 && index !== posts.length - 1 && (
                <div className="py-4 border-t border-gray-50">
                  <AdSense 
                    clientId={settings.adConfig.clientId} 
                    slot={settings.adConfig.mainPageSlot} 
                    className="!my-0 !min-h-[60px]" 
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </section>
      )}

      {posts.length > 0 && (
        <div className="mt-10 pt-10 border-t border-gray-100">
          <AdSense 
            clientId={settings.adConfig.clientId} 
            slot={settings.adConfig.mainPageSlot} 
          />
        </div>
      )}
    </div>
  );
};

export default Home;
