
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BlogPost, SiteSettings } from '../types';
// Removed ADSENSE_CONFIG from imports as it does not exist in constants.ts
import { INITIAL_POSTS, DEFAULT_SETTINGS } from '../constants';
import { fetchPostsFromCloud } from '../lib/db';
import SEO from '../components/SEO';
import AdSense from '../components/AdSense';

const Category: React.FC = () => {
  const { categoryName } = useParams<{ categoryName: string }>();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      // 1. Local
      const savedPosts = localStorage.getItem('crypto_blog_posts');
      const allPosts: BlogPost[] = savedPosts ? JSON.parse(savedPosts) : INITIAL_POSTS;
      setPosts(allPosts.filter(p => p.category.toLowerCase() === categoryName?.toLowerCase()));

      // 2. Cloud
      const cloudPosts = await fetchPostsFromCloud();
      if (cloudPosts) {
        setPosts(cloudPosts.filter(p => p.category.toLowerCase() === categoryName?.toLowerCase()));
      }

      const savedSettings = localStorage.getItem('crypto_site_settings');
      if (savedSettings) setSettings(JSON.parse(savedSettings));
      setIsLoading(false);
    };

    loadData();
  }, [categoryName]);

  const seoData = useMemo(() => {
    const brand = `${settings.brandName}${settings.brandSubName}`;
    return {
      title: `${categoryName} 인사이트 | ${brand}`,
      description: `${categoryName} 관련 최신 트렌드와 기술 분석 리포트를 확인하세요.`,
      keywords: Array.from(new Set(posts.flatMap(p => p.tags))).join(', ') || categoryName
    };
  }, [categoryName, posts, settings]);

  return (
    <div className="space-y-12">
      <SEO title={seoData.title} description={seoData.description} keywords={seoData.keywords} />
      
      <header className="mb-12 border-b border-gray-100 pb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">{categoryName}</h1>
        <p className="text-gray-500 mt-2">{isLoading ? '인사이트 동기화 중...' : `총 ${posts.length}개의 분석 리포트`}</p>
      </header>

      {/* Fixed AdSense usage to use settings.adConfig instead of non-existent ADSENSE_CONFIG */}
      <AdSense 
        clientId={settings.adConfig.clientId} 
        slot={settings.adConfig.mainPageSlot} 
      />

      {posts.length > 0 ? (
        <section className="divide-y divide-gray-100">
          {posts.map((post) => (
            <article key={post.id} className="group py-8 first:pt-0 last:pb-0">
              <Link to={`/post/${post.slug}`} className="flex items-start justify-between gap-6">
                <div className="flex-grow flex flex-col">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 uppercase mb-2">
                    <span>{post.category}</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-400 font-normal">{post.date}</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-3 leading-snug">
                    {post.title}
                  </h2>
                  <p className="text-gray-500 text-sm md:text-base leading-relaxed line-clamp-2">{post.excerpt}</p>
                </div>
                <div className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden bg-gray-100">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
              </Link>
            </article>
          ))}
        </section>
      ) : (
        <div className="py-20 text-center text-gray-400 font-bold">인사이트를 동기화하는 중이거나 글이 없습니다.</div>
      )}
    </div>
  );
};

export default Category;
