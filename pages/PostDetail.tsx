import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BlogPost, Comment, SiteSettings } from '../types';
import SEO from '../components/SEO';
import AdSense from '../components/AdSense';
import { DEFAULT_SETTINGS } from '../constants';
import { fetchPostBySlugFromCloud, savePostToCloud, fetchSettingsFromCloud } from '../lib/db';
// @ts-ignore
import { marked } from 'https://esm.sh/marked@12.0.0';

const PostDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // Load Settings
      const cloudSettings = await fetchSettingsFromCloud();
      if (cloudSettings) setSettings(prev => ({ ...prev, ...cloudSettings }));

      // Load Post - Local first
      const savedPosts = localStorage.getItem('crypto_blog_posts');
      let foundPost: BlogPost | null = null;
      if (savedPosts) {
        foundPost = JSON.parse(savedPosts).find((p: BlogPost) => p.slug === slug || p.id === slug);
        if (foundPost) setPost(foundPost);
      }

      // Load Post - Cloud sync
      if (slug) {
        try {
          const cloudPost = await fetchPostBySlugFromCloud(slug);
          if (cloudPost) {
            setPost(cloudPost);
            foundPost = cloudPost;
          }
        } catch (e) {
          console.error("Cloud fetch failed", e);
        }
      }

      if (!foundPost && !isLoading) {
        // Only navigate if we've finished loading and still have no post
        setTimeout(() => { if (!post) navigate('/'); }, 2000);
      }
      
      setIsLoading(false);
      window.scrollTo(0, 0);
    };

    loadData();
  }, [slug]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName || !commentText || !post) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      author: commentName,
      text: commentText,
      date: new Date().toISOString().split('T')[0]
    };

    const updatedPost = { ...post, comments: [...(post.comments || []), newComment] };
    await savePostToCloud(updatedPost);
    setPost(updatedPost);
    
    setCommentName('');
    setCommentText('');
  };

  if (isLoading && !post) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 font-medium text-sm">콘텐츠를 불러오는 중...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="py-32 text-center">
        <p className="text-gray-400 font-bold">존재하지 않는 게시물입니다.</p>
        <button onClick={() => navigate('/')} className="mt-4 text-blue-600 font-bold underline">홈으로 돌아가기</button>
      </div>
    );
  }

  return (
    <article className="max-w-xl mx-auto pb-20">
      <SEO title={post.title} description={post.excerpt} keywords={post.tags.join(', ')} image={post.image} article={true} />
      
      <header className="mb-10">
        <div className="flex items-center space-x-2 text-[10px] font-bold text-black uppercase mb-4 tracking-wider">
          <span className="bg-gray-100 px-2 py-1 rounded">{post.category}</span>
          <span className="text-gray-200">•</span>
          <span className="text-gray-400 font-medium">{post.date}</span>
        </div>
        <h1 className="text-2xl md:text-4xl font-black text-gray-900 leading-tight mb-6">{post.title}</h1>
      </header>

      {/* 상단 광고 */}
      <AdSense clientId={settings.adConfig.clientId} slot={settings.adConfig.postTopSlot} className="!my-8" />

      <div className="mb-12 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm">
        <img src={post.image} alt={post.title} className="w-full h-auto object-cover max-h-[400px]" />
      </div>

      {/* 본문 마크다운 렌더링 */}
      <div 
        className="prose prose-sm prose-gray max-w-none text-gray-800 leading-relaxed text-[16px] space-y-1"
        dangerouslySetInnerHTML={{ __html: marked.parse(post.content || '') }}
      />

      {/* 하단 광고 */}
      <AdSense clientId={settings.adConfig.clientId} slot={settings.adConfig.postBottomSlot} className="mt-16 mb-8" />

      <footer className="mt-16 pt-12 border-t border-gray-100">
        <section>
          <h3 className="text-xl font-black text-gray-900 mb-8">댓글 {post.comments?.length || 0}</h3>
          
          <form onSubmit={handleCommentSubmit} className="mb-12 space-y-4 bg-gray-50 p-6 rounded-2xl">
            <div className="grid grid-cols-1 gap-4">
              <input 
                required 
                type="text" 
                placeholder="작성자 성함" 
                className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm focus:border-black outline-none transition-all font-bold" 
                value={commentName} 
                onChange={(e) => setCommentName(e.target.value)} 
              />
              <textarea 
                required 
                rows={3} 
                placeholder="의견을 남겨주세요..." 
                className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm resize-none focus:border-black outline-none transition-all font-medium" 
                value={commentText} 
                onChange={(e) => setCommentText(e.target.value)} 
              />
            </div>
            <button type="submit" className="bg-black text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg shadow-gray-100">댓글 등록</button>
          </form>

          <div className="space-y-6">
            {post.comments?.length === 0 ? (
              <p className="text-center py-10 text-gray-400 text-sm font-medium">첫 번째 댓글을 남겨보세요.</p>
            ) : (
              post.comments?.slice().reverse().map(comment => (
                <div key={comment.id} className="group">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-black text-gray-900 text-sm">{comment.author}</span>
                    <span className="text-[10px] text-gray-300 font-bold">{comment.date}</span>
                  </div>
                  <p className="text-gray-600 text-[14px] leading-relaxed font-medium bg-white group-hover:bg-gray-50 p-4 rounded-xl border border-transparent group-hover:border-gray-100 transition-all">
                    {comment.text}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </footer>
    </article>
  );
};

export default PostDetail;