
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BlogPost, SiteSettings } from '../types';
import { INITIAL_POSTS, ADSENSE_CONFIG, DEFAULT_SETTINGS } from '../constants';
import { fetchPostsFromCloud, fetchSettingsFromCloud } from '../lib/db';
import SEO from '../components/SEO';
import AdSense from '../components/AdSense';

const Home: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      // 1. Load Local
      const savedSettings = localStorage.getItem('crypto_site_settings');
      if (savedSettings) setSettings(JSON.parse(savedSettings));

      const savedPosts = localStorage.getItem('crypto_blog_posts');
      const localPosts = savedPosts ? JSON.parse(savedPosts) : INITIAL_POSTS;
      setPosts(localPosts);

      // 2. Load Cloud (if available)
      const cloudPosts = await fetchPostsFromCloud();
      if (cloudPosts && cloudPosts.length > 0) {
        setPosts(cloudPosts);
        localStorage.setItem('crypto_blog_posts', JSON.stringify(cloudPosts));
      }

      const cloudSettings = await fetchSettingsFromCloud();
      if (cloudSettings) {
        const mergedSettings = { ...settings, ...cloudSettings };
        setSettings(mergedSettings as SiteSettings);
        localStorage.setItem('crypto_site_settings', JSON.stringify(mergedSettings));
      }
      
      setIsLoading(false);
    };

    loadData();
  }, []);

  return (
    <div className="space-y-12">
      <SEO title={settings.brandName + settings.brandSubName} description={settings.mainSubtitle} />
      
      <header className="mb-12 border-b border-gray-100 pb-8 text-center md:text-left">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">{settings.mainTitle}</h1>
        <p className="text-gray-500 mt-3 text-lg font-medium">{settings.mainSubtitle}</p>
      </header>

      <AdSense slot={ADSENSE_CONFIG.slots.mainPage} />

      {isLoading ? (
        <div className="py-20 text-center text-gray-400 font-bold animate-pulse">최신 인사이트 동기화 중...</div>
      ) : (
        <section className="divide-y divide-gray-100">
          {posts.map((post) => (
            <article key={post.id} className="group py-10 first:pt-0 last:pb-0">
              <Link to={`/post/${post.slug}`} className="flex flex-col md:flex-row items-start justify-between gap-8">
                <div className="flex-grow flex flex-col order-2 md:order-1">
                  <div className="flex items-center space-x-2 text-xs font-black text-blue-600 uppercase mb-3">
                    <span>{post.category}</span>
                    <span className="text-gray-200">•</span>
                    <span className="text-gray-400 font-bold">{post.date}</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-gray-900 group-hover:text-blue-600 transition-colors mb-4 leading-tight">
                    {post.title}
                  </h2>
                  <p className="text-gray-500 text-sm md:text-base leading-relaxed line-clamp-2 font-medium">
                    {post.excerpt}
                  </p>
                  <div className="mt-6 flex items-center text-[10px] font-black text-gray-300 uppercase tracking-widest">
                    <span>{post.views?.toLocaleString() || 0} VIEWS</span>
                    <span className="mx-2">/</span>
                    <span className="text-blue-500">READ MORE →</span>
                  </div>
                </div>
                
                <div className="flex-shrink-0 w-full md:w-48 h-48 md:h-48 rounded-[2rem] overflow-hidden bg-gray-100 order-1 md:order-2">
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
              </Link>
            </article>
          ))}
        </section>
      )}

      {posts.length > 3 && <AdSense slot={ADSENSE_CONFIG.slots.mainPage} className="mt-12" />}
    </div>
  );
};

export default Home;
