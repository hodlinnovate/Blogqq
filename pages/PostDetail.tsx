import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BlogPost, Comment, SiteSettings } from '../types';
import SEO from '../components/SEO';
import AdSense from '../components/AdSense';
import { DEFAULT_SETTINGS } from '../constants';
import { fetchPostBySlugFromCloud, savePostToCloud, fetchSettingsFromCloud } from '../lib/db';

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
      if (savedPosts) {
        const found = JSON.parse(savedPosts).find((p: BlogPost) => p.slug === slug);
        if (found) setPost(found);
      }

      if (slug) {
        const cloudPost = await fetchPostBySlugFromCloud(slug);
        if (cloudPost) {
          setPost(cloudPost);
        } else if (!post) {
          navigate('/');
        }
      }
      setIsLoading(false);
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

  if (isLoading && !post) return <div className="py-20 text-center text-gray-300 font-medium">Loading...</div>;
  if (!post) return null;

  return (
    <article className="max-w-xl mx-auto">
      <SEO title={post.title} description={post.excerpt} keywords={post.tags.join(', ')} image={post.image} article={true} />
      
      <header className="mb-12">
        <div className="flex items-center space-x-2 text-[10px] font-bold text-blue-500 uppercase mb-4 tracking-wider">
          <span>{post.category}</span>
          <span className="text-gray-200">•</span>
          <span className="text-gray-400">{post.date}</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-8">{post.title}</h1>
      </header>

      <AdSense clientId={settings.adConfig.clientId} slot={settings.adConfig.postTopSlot} className="!my-6" />

      <div className="prose prose-sm prose-gray max-w-none">
        <div className="mb-10 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
          <img src={post.image} alt={post.title} className="w-full h-auto" />
        </div>

        <div className="text-gray-700 space-y-6 leading-relaxed text-[15px]">
          {post.content.split('\n\n').map((para, i) => (
            <React.Fragment key={i}>
              <p className="whitespace-pre-wrap">{para}</p>
              {i === 1 && <AdSense clientId={settings.adConfig.clientId} slot={settings.adConfig.postTopSlot} className="!my-10" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <footer className="mt-16 pt-8 border-t border-gray-50">
        <AdSense clientId={settings.adConfig.clientId} slot={settings.adConfig.postBottomSlot} className="!my-8" />
        {/* Comments section... */}
        <section className="mt-16 border-t border-gray-50 pt-12">
           <h3 className="text-lg font-bold text-gray-900 mb-8">Comments</h3>
           <form onSubmit={handleCommentSubmit} className="mb-12 space-y-3">
            <input required type="text" placeholder="Name" className="w-full max-w-xs px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm" value={commentName} onChange={(e) => setCommentName(e.target.value)} />
            <textarea required rows={3} placeholder="Write a comment..." className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-sm resize-none" value={commentText} onChange={(e) => setCommentText(e.target.value)} />
            <button type="submit" className="bg-black text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest">Post</button>
          </form>
          <div className="space-y-4">
            {post.comments?.slice().reverse().map(comment => (
              <div key={comment.id} className="py-5 border-b border-gray-50">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-gray-800 text-sm">{comment.author}</span>
                  <span className="text-[10px] text-gray-300 font-medium">{comment.date}</span>
                </div>
                <p className="text-gray-500 text-[13px] leading-relaxed">{comment.text}</p>
              </div>
            ))}
          </div>
        </section>
      </footer>
    </article>
  );
};

export default PostDetail;