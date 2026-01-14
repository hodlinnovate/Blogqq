
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BlogPost, Comment, SiteSettings } from '../types';
import SEO from '../components/SEO';
import AdSense from '../components/AdSense';
import { DEFAULT_SETTINGS } from '../constants';
import { fetchPostBySlugFromCloud, savePostToCloud, fetchSettingsFromCloud, incrementPostViews, recordVisit } from '../lib/db';

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
      
      const cloudSettings = await fetchSettingsFromCloud();
      if (cloudSettings) setSettings(prev => ({ ...prev, ...cloudSettings }));

      const savedPosts = localStorage.getItem('crypto_blog_posts');
      let foundPost: BlogPost | null = null;
      if (savedPosts) {
        foundPost = JSON.parse(savedPosts).find((p: BlogPost) => p.slug === slug || p.id === slug);
        if (foundPost) setPost(foundPost);
      }

      if (slug) {
        try {
          const cloudPost = await fetchPostBySlugFromCloud(slug);
          if (cloudPost) {
            setPost(cloudPost);
            foundPost = cloudPost;
            incrementPostViews(cloudPost.id);
            recordVisit(cloudPost.id, document.referrer);
          }
        } catch (e) {
          console.error("Cloud fetch failed", e);
        }
      }

      if (!foundPost && !isLoading) {
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

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('링크가 복사되었습니다.');
    }
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
    <article className="max-w-5xl mx-auto pb-20 px-6 md:px-8">
      <SEO 
        title={post.title} 
        description={post.excerpt} 
        keywords={post.tags?.join(', ') || post.category} 
        image={post.image} 
        article={true} 
      />
      
      <header className="mb-6 mt-8 border-b border-gray-100 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex-1">
                <div className="flex items-center space-x-2 text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wide">
                    <span className="bg-gray-100 text-black px-2 py-0.5 rounded-sm">{post.category}</span>
                    <span className="text-gray-300">/</span>
                    <span>{post.date}</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight tracking-tight">
                    {post.title}
                </h1>
            </div>
            <button onClick={handleShare} className="shrink-0 p-2 text-gray-400 hover:text-black transition-colors self-start md:self-end">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            </button>
        </div>
      </header>

      <AdSense clientId={settings.adConfig?.clientId || ''} slot={settings.adConfig?.postTopSlot || ''} className="!my-6" />

      {post.image && (
        <div className="mb-8 rounded-lg overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
          {/* 이미지가 너무 세로로 길지 않게 높이를 고정(h-48 ~ h-80)하고 cover 처리하여 가로로 긴 비율 유지 */}
          <img src={post.image} alt={post.title} className="w-full h-48 md:h-80 object-cover" />
        </div>
      )}

      <div 
        className="ql-editor prose prose-gray max-w-none text-gray-900 leading-relaxed text-base md:text-[17px] !p-0 tracking-normal"
        dangerouslySetInnerHTML={{ __html: post.content || '' }}
      />

      <AdSense clientId={settings.adConfig?.clientId || ''} slot={settings.adConfig?.postBottomSlot || ''} className="mt-12 mb-8" />

      <footer className="mt-12 pt-8 border-t border-gray-100">
        <section>
          <h3 className="text-lg font-bold text-gray-900 mb-6">댓글 {post.comments?.length || 0}</h3>
          
          <form onSubmit={handleCommentSubmit} className="mb-10">
            <div className="flex flex-col md:flex-row gap-3">
              <input 
                required 
                type="text" 
                placeholder="이름" 
                className="md:w-32 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-black outline-none transition-all font-bold" 
                value={commentName} 
                onChange={(e) => setCommentName(e.target.value)} 
              />
              <input 
                required 
                placeholder="의견을 남겨주세요..." 
                className="flex-grow px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-black outline-none transition-all font-medium" 
                value={commentText} 
                onChange={(e) => setCommentText(e.target.value)} 
              />
              <button type="submit" className="bg-black text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase hover:bg-gray-800 transition-all shrink-0">등록</button>
            </div>
          </form>

          <div className="space-y-4">
            {!post.comments || post.comments.length === 0 ? (
              <p className="py-4 text-gray-300 text-xs">등록된 댓글이 없습니다.</p>
            ) : (
              post.comments.slice().reverse().map(comment => (
                <div key={comment.id} className="group border-b border-gray-50 pb-4 last:border-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-gray-900 text-sm">{comment.author}</span>
                    <span className="text-[10px] text-gray-400">{comment.date}</span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
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
