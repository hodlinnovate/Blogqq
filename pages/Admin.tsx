import React, { useState, useEffect, useRef } from 'react';
import { BlogPost, SiteSettings } from '../types';
import { INITIAL_POSTS, DEFAULT_SETTINGS } from '../constants';
import { savePostToCloud, deletePostFromCloud, saveSettingsToCloud, fetchSettingsFromCloud } from '../lib/db';
// @ts-ignore
import { marked } from 'https://esm.sh/marked@12.0.0';

const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'write' | 'preview' | 'db' | 'ads'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [currentPost, setCurrentPost] = useState<Partial<BlogPost>>({
    title: '',
    excerpt: '',
    content: '',
    category: 'Crypto',
    author: '김병준',
    image: '',
    tags: []
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    const savedPosts = localStorage.getItem('crypto_blog_posts');
    const localPosts = savedPosts ? JSON.parse(savedPosts) : INITIAL_POSTS;
    setPosts(localPosts);

    const cloudSettings = await fetchSettingsFromCloud();
    if (cloudSettings) {
      setSettings(prev => ({ ...prev, ...cloudSettings }));
    } else {
      const savedSettings = localStorage.getItem('crypto_site_settings');
      if (savedSettings) setSettings(JSON.parse(savedSettings));
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === (settings.adminPassword || DEFAULT_SETTINGS.adminPassword)) {
      setIsAuthenticated(true);
      setLoginError(false);
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  const handleSaveSettings = async () => {
    localStorage.setItem('crypto_site_settings', JSON.stringify(settings));
    
    if (settings.supabaseUrl && settings.supabaseKey) {
      const success = await saveSettingsToCloud(settings);
      if (success) setSaveStatus('설정이 클라우드에 영구 저장되었습니다!');
    } else {
      setSaveStatus('설정이 브라우저에 임시 저장되었습니다.');
    }
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPost.title || !currentPost.content) return;

    const slug = (currentPost.title as string).toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '');
    const date = new Date().toISOString().split('T')[0];

    let newPostList: BlogPost[];

    if (isEditing && currentPost.id) {
      const updatedPost = { ...currentPost, slug } as BlogPost;
      newPostList = posts.map(p => p.id === currentPost.id ? updatedPost : p);
      await savePostToCloud(updatedPost);
      setSaveStatus('게시물이 업데이트되었습니다.');
    } else {
      const newPost: BlogPost = {
        id: Date.now().toString(),
        title: currentPost.title as string,
        excerpt: currentPost.excerpt || '',
        content: currentPost.content as string,
        category: currentPost.category as any || 'Crypto',
        author: currentPost.author || '김병준',
        date,
        image: currentPost.image || `https://picsum.photos/seed/${Date.now()}/800/450`,
        slug,
        tags: currentPost.tags || [],
        views: 0,
        comments: []
      };
      newPostList = [newPost, ...posts];
      await savePostToCloud(newPost);
      setSaveStatus('새로운 글이 발행되었습니다.');
    }
    
    localStorage.setItem('crypto_blog_posts', JSON.stringify(newPostList));
    setPosts(newPostList);
    setTimeout(() => setSaveStatus(null), 3000);
    resetForm();
  };

  const deletePost = async (id: string) => {
    if (window.confirm('삭제하시겠습니까?')) {
      await deletePostFromCloud(id);
      const filtered = posts.filter(p => p.id !== id);
      localStorage.setItem('crypto_blog_posts', JSON.stringify(filtered));
      setPosts(filtered);
      setSaveStatus('삭제되었습니다.');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setActiveTab('write');
    setCurrentPost({ title: '', excerpt: '', content: '', category: 'Crypto', author: '김병준', image: '', tags: [] });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white p-10 rounded-3xl border border-gray-100 shadow-xl">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight text-center mb-8">Admin Access</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="비밀번호" className={`w-full px-6 py-4 bg-gray-50 border ${loginError ? 'border-red-400' : 'border-gray-200'} rounded-xl outline-none text-center font-bold`} autoFocus />
            <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-bold">Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-4xl mx-auto pb-32">
      <div className="flex justify-between items-end border-b border-gray-100 pb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">{settings.supabaseUrl ? 'Connected to Cloud' : 'Local Mode'}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('ads')} className={`px-4 py-2 rounded-lg font-bold text-xs ${activeTab === 'ads' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>애드센스 설정</button>
          <button onClick={() => setActiveTab('db')} className={`px-4 py-2 rounded-lg font-bold text-xs ${activeTab === 'db' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>DB 설정</button>
          <button onClick={() => setIsAuthenticated(false)} className="px-4 py-2 bg-gray-100 text-gray-400 rounded-lg font-bold text-xs">나가기</button>
        </div>
      </div>

      {saveStatus && (
        <div className="fixed bottom-10 right-10 z-50">
          <div className="bg-gray-900 text-white px-6 py-3 rounded-xl shadow-2xl text-xs font-bold">{saveStatus}</div>
        </div>
      )}

      {activeTab === 'ads' ? (
        <section className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm space-y-8">
          <h2 className="text-xl font-black flex items-center gap-2">
             <span className="w-2 h-2 bg-yellow-400 rounded-full"></span> 구글 애드센스 수익화 설정
          </h2>
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">AdSense Client ID</label>
              <input className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-mono text-sm" value={settings.adConfig.clientId} onChange={e => setSettings({...settings, adConfig: {...settings.adConfig, clientId: e.target.value}})} placeholder="ca-pub-xxxxxxxxxxxx" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Main Page Slot</label>
                <input className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-mono text-sm" value={settings.adConfig.mainPageSlot} onChange={e => setSettings({...settings, adConfig: {...settings.adConfig, mainPageSlot: e.target.value}})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Post Top Slot</label>
                <input className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-mono text-sm" value={settings.adConfig.postTopSlot} onChange={e => setSettings({...settings, adConfig: {...settings.adConfig, postTopSlot: e.target.value}})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Post Bottom Slot</label>
                <input className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-mono text-sm" value={settings.adConfig.postBottomSlot} onChange={e => setSettings({...settings, adConfig: {...settings.adConfig, postBottomSlot: e.target.value}})} />
              </div>
            </div>
          </div>
          <button onClick={handleSaveSettings} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors">광고 설정 저장</button>
        </section>
      ) : activeTab === 'db' ? (
        <section className="bg-gray-900 text-white p-8 rounded-3xl shadow-xl space-y-6">
          <h2 className="text-xl font-black">Database Cloud Sync</h2>
          <div className="space-y-4">
            <input className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl font-mono text-sm outline-none" value={settings.supabaseUrl || ''} onChange={e => setSettings({...settings, supabaseUrl: e.target.value})} placeholder="Supabase URL" />
            <input type="password" className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl font-mono text-sm outline-none" value={settings.supabaseKey || ''} onChange={e => setSettings({...settings, supabaseKey: e.target.value})} placeholder="Supabase Anon Key" />
          </div>
          <button onClick={handleSaveSettings} className="w-full bg-white text-black py-4 rounded-xl font-bold">연결 정보 저장</button>
        </section>
      ) : (
        <>
          <section className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm space-y-6">
            <h2 className="text-xl font-black">Branding</h2>
            <div className="grid grid-cols-2 gap-4">
              <input className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold" value={settings.brandName} onChange={e => setSettings({...settings, brandName: e.target.value})} />
              <input className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-blue-600" value={settings.brandSubName} onChange={e => setSettings({...settings, brandSubName: e.target.value})} />
            </div>
            <button onClick={handleSaveSettings} className="w-full bg-black text-white py-4 rounded-xl font-bold">업데이트</button>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-black">{isEditing ? 'Edit Post' : 'New Post'}</h2>
            <form onSubmit={handleCreateOrUpdate} className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm space-y-6">
              <input required className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-black text-xl" value={currentPost.title} onChange={e => setCurrentPost({...currentPost, title: e.target.value})} placeholder="Title" />
              <div className="flex bg-gray-100 p-1 rounded-xl space-x-1 w-fit">
                <button type="button" onClick={() => setActiveTab('write')} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${activeTab === 'write' ? 'bg-white text-black' : 'text-gray-400'}`}>Editor</button>
                <button type="button" onClick={() => setActiveTab('preview')} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${activeTab === 'preview' ? 'bg-white text-black' : 'text-gray-400'}`}>Preview</button>
              </div>
              {activeTab === 'write' ? (
                <textarea ref={textareaRef} required rows={12} className="w-full px-4 py-3 bg-gray-50 border-none outline-none resize-none font-sans text-sm" value={currentPost.content} onChange={e => setCurrentPost({...currentPost, content: e.target.value})} placeholder="Markdown content..." />
              ) : (
                <div className="p-4 bg-white border border-gray-50 rounded-xl prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: marked.parse(currentPost.content || '') }} />
              )}
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-100">Publish</button>
              {isEditing && <button type="button" onClick={resetForm} className="w-full py-2 text-gray-400 text-xs font-bold">Cancel</button>}
            </form>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black">Manage Posts</h2>
            <div className="grid grid-cols-1 gap-3">
              {posts.map(post => (
                <div key={post.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl">
                  <div className="flex items-center space-x-4">
                    <img src={post.image} className="w-12 h-12 rounded-lg object-cover" />
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{post.title}</h4>
                      <p className="text-[10px] text-gray-400">{post.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setCurrentPost(post); setIsEditing(true); window.scrollTo(0,0); }} className="p-2 text-gray-400 hover:text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                    <button onClick={() => deletePost(post.id)} className="p-2 text-gray-400 hover:text-red-500"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default Admin;