
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BlogPost, Comment } from '../types';
import SEO from '../components/SEO';
import AdSense from '../components/AdSense';
import { ADSENSE_CONFIG } from '../constants';
import { fetchPostBySlugFromCloud, savePostToCloud } from '../lib/db';

const PostDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    const loadPost = async () => {
      setIsLoading(true);
      // 1. Try Local first (for speed)
      const savedPosts = localStorage.getItem('crypto_blog_posts');
      if (savedPosts) {
        const allPosts: BlogPost[] = JSON.parse(savedPosts);
        const found = allPosts.find((p) => p.slug === slug);
        if (found) setPost(found);
      }

      // 2. Fetch from Cloud (The truth)
      if (slug) {
        const cloudPost = await fetchPostBySlugFromCloud(slug);
        if (cloudPost) {
          setPost(cloudPost);
          // Increment views in cloud
          const updatedPost = { ...cloudPost, views: (cloudPost.views || 0) + 1 };
          await savePostToCloud(updatedPost);
        } else if (!post) {
          // If not in local AND not in cloud, it doesn't exist
          navigate('/');
        }
      }
      setIsLoading(false);
    };

    loadPost();
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

    const updatedPost = {
      ...post,
      comments: [...(post.comments || []), newComment]
    };

    // Save to Cloud & Local
    await savePostToCloud(updatedPost);
    setPost(updatedPost);
    
    const savedPosts = localStorage.getItem('crypto_blog_posts');
    if (savedPosts) {
      const allPosts: BlogPost[] = JSON.parse(savedPosts);
      const updatedAll = allPosts.map(p => p.id === post.id ? updatedPost : p);
      localStorage.setItem('crypto_blog_posts', JSON.stringify(updatedAll));
    }

    setCommentName('');
    setCommentText('');
  };

  if (isLoading && !post) return <div className="py-20 text-center text-gray-400 font-bold animate-pulse">인사이트를 클라우드에서 불러오는 중...</div>;
  if (!post) return null;

  return (
    <article className="max-w-2xl mx-auto">
      <SEO 
        title={post.title} 
        description={post.excerpt} 
        keywords={post.tags.join(', ')} 
        image={post.image}
        article={true}
      />
      
      <header className="mb-10">
        <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase mb-4">
          <span>{post.category}</span>
          <span className="text-gray-300">•</span>
          <span className="text-gray-400">{post.date}</span>
          <span className="text-gray-300">•</span>
          <span className="text-gray-400 lowercase">{post.views.toLocaleString()} views</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-6">
          {post.title}
        </h1>
        <div className="flex items-center space-x-3 mb-8">
           <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden">
             <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${post.author}`} alt={post.author} />
           </div>
           <span className="text-sm font-medium text-gray-700">{post.author}</span>
        </div>
      </header>

      <AdSense slot={ADSENSE_CONFIG.slots.postContentTop} />

      <div className="prose prose-gray max-w-none prose-img:rounded-xl">
        <div className="mb-10 rounded-2xl overflow-hidden shadow-sm">
          <img src={post.image} alt={post.title} className="w-full h-auto" />
        </div>

        {post.content.split('\n\n').map((para, i) => (
          <React.Fragment key={i}>
            {para.startsWith('###') ? (
              <h3 className="text-xl font-bold text-gray-900 mt-10 mb-4">{para.replace('### ', '')}</h3>
            ) : (
              <p className="text-gray-700 mb-6 leading-relaxed whitespace-pre-wrap">{para}</p>
            )}
            {i === 1 && <AdSense slot={ADSENSE_CONFIG.slots.postContentTop} className="my-10" />}
          </React.Fragment>
        ))}
      </div>

      <footer className="mt-16 pt-8 border-t border-gray-100">
        <div className="flex flex-wrap gap-2 mb-8">
          {post.tags.map(tag => (
            <span key={tag} className="text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
              #{tag}
            </span>
          ))}
        </div>

        <AdSense slot={ADSENSE_CONFIG.slots.postContentBottom} />

        <section className="mt-16">
          <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center">
            댓글 {post.comments?.length || 0}개
          </h3>

          <form onSubmit={handleCommentSubmit} className="mb-12 space-y-4">
            <input required type="text" placeholder="이름" className="w-full max-w-xs px-4 py-2 border border-gray-200 rounded-lg text-sm" value={commentName} onChange={(e) => setCommentName(e.target.value)} />
            <textarea required rows={3} placeholder="의견을 남겨주세요..." className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm resize-none" value={commentText} onChange={(e) => setCommentText(e.target.value)} />
            <button type="submit" className="bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-black transition-colors">댓글 등록</button>
          </form>

          <div className="space-y-6">
            {post.comments && post.comments.length > 0 ? (
              post.comments.slice().reverse().map(comment => (
                <div key={comment.id} className="bg-gray-50/50 p-6 rounded-2xl border border-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-gray-900 text-sm">{comment.author}</span>
                    <span className="text-[10px] text-gray-400 font-semibold">{comment.date}</span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{comment.text}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 text-sm py-10">첫 번째 댓글을 남겨보세요.</p>
            )}
          </div>
        </section>

        <div className="flex justify-between items-center mt-20 border-t border-gray-50 pt-8">
            <button onClick={() => navigate('/')} className="text-sm font-semibold text-gray-900 flex items-center hover:translate-x-[-4px] transition-transform">
               <span className="mr-2">←</span> 리스트로 돌아가기
            </button>
        </div>
      </footer>
    </article>
  );
};

export default PostDetail;
