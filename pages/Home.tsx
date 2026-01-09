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
    <div className="max-w-2xl mx-auto">
      <SEO title={settings.brandName + " " + settings.brandSubName} description={settings.mainSubtitle} />
      
      {isLoading ? (
        <div className="py-20 text-center text-gray-300 font-medium animate-pulse">Syncing...</div>
      ) : (
        <section className="divide-y divide-gray-50">
          {posts.map((post, index) => (
            <React.Fragment key={post.id}>
              <article className="group py-10 first:pt-0 last:pb-0">
                <Link to={`/post/${post.slug}`} className="flex items-start justify-between gap-6">
                  <div className="flex-grow flex flex-col min-w-0">
                    <div className="flex items-center space-x-2 text-[11px] font-bold text-black uppercase mb-2">
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded">{post.category}</span>
                      <span className="text-gray-200">•</span>
                      <span className="text-gray-400 font-medium">{post.date}</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 group-hover:text-black group-hover:underline transition-all mb-2 leading-tight line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 font-medium">
                      {post.excerpt}
                    </p>
                  </div>
                  
                  <div className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="w-full h-full object-cover grayscale transition-all group-hover:grayscale-0 group-hover:scale-105" 
                    />
                  </div>
                </Link>
              </article>

              {/* 글과 글 사이 광고 (매 2번째 글 뒤에 삽입) */}
              {(index + 1) % 2 === 0 && index !== posts.length - 1 && (
                <div className="py-8 border-t border-gray-50">
                  <AdSense 
                    clientId={settings.adConfig.clientId} 
                    slot={settings.adConfig.mainPageSlot} 
                    className="!my-0" 
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </section>
      )}

      {/* 리스트 최하단 광고 */}
      {posts.length > 0 && (
        <div className="mt-12 pt-12 border-t border-gray-50">
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