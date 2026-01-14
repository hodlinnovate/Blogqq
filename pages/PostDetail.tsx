
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
    <article className="max-w-5xl mx-auto pb-32">
      <SEO 
        title={post.title} 
        description={post.excerpt} 
        keywords={post.tags?.join(', ') || post.category} 
        image={post.image} 
        article={true} 
      />
      
      <header className="mb-12">
        <div className="flex items-center space-x-3 text-[10px] font-bold text-black uppercase mb-6 tracking-[0.15em]">
          <span className="bg-gray-100 px-3 py-1 rounded"># {post.category}</span>
          <span className="text-gray-200">•</span>
          <span className="text-gray-400 font-medium">{post.date}</span>
          <span className="text-gray-200">•</span>
          <span className="text-gray-400 font-medium italic">Views {post.views || 0}</span>
        </div>
        <h1 className="text-3xl md:text-6xl font-black text-gray-900 leading-[1.2] mb-10 tracking-tight">{post.title}</h1>
      </header>

      <AdSense clientId={settings.adConfig?.clientId || ''} slot={settings.adConfig?.postTopSlot || ''} className="!my-12" />

      {post.image && (
        <div className="mb-16 rounded-3xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm">
          <img src={post.image} alt={post.title} className="w-full h-auto object-cover max-h-[700px]" />
        </div>
      )}

      <div 
        className="ql-editor prose prose-gray max-w-none text-gray-800 leading-[1.8] text-[18px] md:text-[22px] !p-0"
        dangerouslySetInnerHTML={{ __html: post.content || '' }}
      />

      <AdSense clientId={settings.adConfig?.clientId || ''} slot={settings.adConfig?.postBottomSlot || ''} className="mt-24 mb-12" />

      <footer className="mt-24 pt-16 border-t border-gray-100">
        <section>
          <h3 className="text-2xl font-black text-gray-900 mb-10">대화 {post.comments?.length || 0}</h3>
          
          <form onSubmit={handleCommentSubmit} className="mb-16 space-y-6 bg-gray-50 p-10 rounded-[2.5rem]">
            <div className="grid grid-cols-1 gap-6">
              <input 
                required 
                type="text" 
                placeholder="작성자 성함" 
                className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-base focus:border-black outline-none transition-all font-bold" 
                value={commentName} 
                onChange={(e) => setCommentName(e.target.value)} 
              />
              <textarea 
                required 
                rows={4} 
                placeholder="인사이트를 공유해주세요..." 
                className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-base resize-none focus:border-black outline-none transition-all font-medium" 
                value={commentText} 
                onChange={(e) => setCommentText(e.target.value)} 
              />
            </div>
            <button type="submit" className="bg-black text-white px-10 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl shadow-gray-200 active:scale-95">댓글 등록</button>
          </form>

          <div className="space-y-8">
            {!post.comments || post.comments.length === 0 ? (
              <p className="text-center py-16 text-gray-300 text-sm font-bold uppercase tracking-widest">이 글의 첫 번째 대화 상대가 되어주세요.</p>
            ) : (
              post.comments.slice().reverse().map(comment => (
                <div key={comment.id} className="group">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-black text-gray-900 text-base">{comment.author}</span>
                    <span className="text-[11px] text-gray-300 font-bold uppercase tracking-tight">{comment.date}</span>
                  </div>
                  <p className="text-gray-600 text-[16px] leading-relaxed font-medium bg-white group-hover:bg-gray-50 p-6 rounded-2xl border border-transparent group-hover:border-gray-100 transition-all shadow-sm group-hover:shadow-none">
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
