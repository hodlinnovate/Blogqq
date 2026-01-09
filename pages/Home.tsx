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

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <SEO title={settings.brandName + settings.brandSubName} description={settings.mainSubtitle} />
      
      <header className="mb-12 py-8 border-b border-gray-50">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{settings.mainTitle}</h1>
        <p className="text-gray-400 mt-2 text-base font-medium">{settings.mainSubtitle}</p>
      </header>

      <AdSense 
        clientId={settings.adConfig.clientId} 
        slot={settings.adConfig.mainPageSlot} 
        className="!my-4" 
      />

      {isLoading ? (
        <div className="py-20 text-center text-gray-300 font-medium animate-pulse">Syncing...</div>
      ) : (
        <section className="divide-y divide-gray-50">
          {posts.map((post) => (
            <article key={post.id} className="group py-8 first:pt-0 last:pb-0">
              <Link to={`/post/${post.slug}`} className="flex items-start justify-between gap-6">
                <div className="flex-grow flex flex-col min-w-0">
                  <div className="flex items-center space-x-2 text-[11px] font-bold text-blue-500 uppercase mb-2">
                    <span>{post.category}</span>
                    <span className="text-gray-200">•</span>
                    <span className="text-gray-400">{post.date}</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 leading-tight line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 font-medium">
                    {post.excerpt}
                  </p>
                </div>
                
                <div className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                  <img src={post.image} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all group-hover:scale-105" />
                </div>
              </Link>
            </article>
          ))}
        </section>
      )}

      {posts.length > 3 && (
        <AdSense 
          clientId={settings.adConfig.clientId} 
          slot={settings.adConfig.mainPageSlot} 
          className="mt-12" 
        />
      )}
    </div>
  );
};

export default Home;