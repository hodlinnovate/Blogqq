
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BlogPost, SiteSettings } from '../types';
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
    const brand = `${settings.brandName} ${settings.brandSubName}`;
    return {
      title: `${categoryName} 인사이트 | ${brand}`,
      description: `${categoryName} 관련 최신 트렌드와 기술 분석 리포트를 확인하세요.`,
      keywords: Array.from(new Set(posts.flatMap(p => p.tags))).join(', ') || categoryName,
      url: `${window.location.origin}/category/${categoryName}`
    };
  }, [categoryName, posts, settings]);

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <SEO 
        title={seoData.title} 
        description={seoData.description} 
        keywords={seoData.keywords}
        url={seoData.url}
      />
      
      <header className="mb-8 border-b border-gray-100 pb-6">
        <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">{categoryName}</h1>
        <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-wider">{isLoading ? '인사이트 동기화 중...' : `총 ${posts.length}개의 리포트`}</p>
      </header>

      <AdSense 
        clientId={settings.adConfig.clientId} 
        slot={settings.adConfig.mainPageSlot} 
      />

      {posts.length > 0 ? (
        <section className="divide-y divide-gray-50">
          {posts.map((post) => (
            <article key={post.id} className="group py-6 first:pt-0 last:pb-0">
              <Link to={`/post/${post.slug}`} className="flex items-center justify-between gap-8">
                <div className="flex-grow flex flex-col min-w-0">
                  <div className="flex items-center space-x-2 text-[9px] font-bold text-gray-400 uppercase mb-1 tracking-tight">
                    <span className="text-black bg-gray-100 px-1.5 py-0.5 rounded">{post.category}</span>
                    <span>•</span>
                    <span>{post.date}</span>
                  </div>
                  <h2 className="text-sm md:text-base font-bold text-gray-900 group-hover:text-black group-hover:underline transition-all mb-1 leading-snug line-clamp-1">
                    {post.title}
                  </h2>
                  <p className="text-gray-400 text-xs md:text-sm leading-relaxed line-clamp-1 font-medium">{post.excerpt}</p>
                </div>
                {post.image && (
                  <div className="flex-shrink-0 w-20 h-20 md:w-32 md:h-32 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm">
                    <img src={post.image} alt={post.title} className="w-full h-full object-cover grayscale transition-all group-hover:grayscale-0 group-hover:scale-110 duration-500" />
                  </div>
                )}
              </Link>
            </article>
          ))}
        </section>
      ) : (
        <div className="py-20 text-center text-gray-300 font-bold text-xs uppercase tracking-widest">인사이트를 동기화하는 중이거나 글이 없습니다.</div>
      )}
    </div>
  );
};

export default Category;
