
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
  const [activeTab, setActiveTab] = useState<'write' | 'preview' | 'db' | 'ads' | 'about' | 'categories'>('write');
  const [newCategory, setNewCategory] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [currentPost, setCurrentPost] = useState<Partial<BlogPost>>({
    title: '',
    excerpt: '',
    content: '',
    category: '',
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
      if (!currentPost.category && cloudSettings.categories?.length > 0) {
        setCurrentPost(curr => ({ ...curr, category: cloudSettings.categories[0] }));
      }
    } else {
      const savedSettings = localStorage.getItem('crypto_site_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        if (!currentPost.category && parsed.categories?.length > 0) {
          setCurrentPost(curr => ({ ...curr, category: parsed.categories[0] }));
        }
      }
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

  const handleSaveSettings = async (customSettings?: SiteSettings) => {
    const settingsToSave = customSettings || settings;
    localStorage.setItem('crypto_site_settings', JSON.stringify(settingsToSave));
    
    if (settingsToSave.supabaseUrl && settingsToSave.supabaseKey) {
      const success = await saveSettingsToCloud(settingsToSave);
      if (success) setSaveStatus('설정이 클라우드에 영구 저장되었습니다!');
    } else {
      setSaveStatus('설정이 브라우저에 임시 저장되었습니다.');
    }
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const addCategory = () => {
    if (!newCategory || settings.categories.includes(newCategory)) return;
    const updated = { ...settings, categories: [...settings.categories, newCategory] };
    setSettings(updated);
    setNewCategory('');
    handleSaveSettings(updated);
  };

  const removeCategory = (cat: string) => {
    const updated = { ...settings, categories: settings.categories.filter(c => c !== cat) };
    setSettings(updated);
    handleSaveSettings(updated);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPost.title || !currentPost.content) return;

    const slug = (currentPost.title as string)
      .trim()
      .replace(/[^a-zA-Z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();

    const date = new Date().toISOString().split('T')[0];
    let newPostList: BlogPost[];

    if (isEditing && currentPost.id) {
      const updatedPost = { ...currentPost, slug, date } as BlogPost;
      newPostList = posts.map(p => p.id === currentPost.id ? updatedPost : p);
      await savePostToCloud(updatedPost);
      setSaveStatus('게시물이 업데이트되었습니다.');
    } else {
      const newPost: BlogPost = {
        id: Date.now().toString(),
        title: currentPost.title as string,
        excerpt: currentPost.excerpt || currentPost.content?.slice(0, 100) + '...',
        content: currentPost.content as string,
        category: currentPost.category || (settings.categories[0] || 'Uncategorized'),
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
    if (window.confirm('정말로 이 글을 삭제하시겠습니까?')) {
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
    setCurrentPost({ 
      title: '', 
      excerpt: '', 
      content: '', 
      category: settings.categories[0] || '', 
      author: '김병준', 
      image: '', 
      tags: [] 
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white p-10 rounded-3xl border border-gray-100 shadow-xl text-center">
          <div className="mb-8 inline-flex items-center justify-center w-16 h-16 bg-gray-50 rounded-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Admin Security</h1>
          <p className="text-xs text-gray-400 font-bold uppercase mb-8 tracking-widest">Restricted Area</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="비밀번호 입력" className={`w-full px-6 py-4 bg-gray-50 border ${loginError ? 'border-red-400 animate-shake' : 'border-gray-100'} rounded-xl outline-none text-center font-bold transition-all`} autoFocus />
            <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-bold shadow-lg shadow-gray-100">Unlock Dashboard</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-4xl mx-auto pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-100 pb-8 gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Console</h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">{settings.supabaseUrl ? 'Cloud (Online)' : 'Browser (Local)'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setActiveTab('categories')} className={`px-4 py-2 rounded-lg font-bold text-xs ${activeTab === 'categories' ? 'bg-black text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>주제 관리</button>
          <button onClick={() => setActiveTab('about')} className={`px-4 py-2 rounded-lg font-bold text-xs ${activeTab === 'about' ? 'bg-black text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>소개 수정</button>
          <button onClick={() => setActiveTab('ads')} className={`px-4 py-2 rounded-lg font-bold text-xs ${activeTab === 'ads' ? 'bg-black text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>광고</button>
          <button onClick={() => setActiveTab('db')} className={`px-4 py-2 rounded-lg font-bold text-xs ${activeTab === 'db' ? 'bg-black text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>서버</button>
          <button onClick={() => setIsAuthenticated(false)} className="px-4 py-2 bg-gray-50 text-gray-400 rounded-lg font-bold text-xs hover:text-red-500 transition-colors">로그아웃</button>
        </div>
      </div>

      {saveStatus && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100]">
          <div className="bg-black text-white px-8 py-3 rounded-2xl shadow-2xl text-xs font-black animate-bounce">{saveStatus}</div>
        </div>
      )}

      {activeTab === 'categories' ? (
        <section className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black">주제(카테고리) 관리</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{settings.categories.length} Topics</p>
          </div>
          
          <div className="flex gap-2">
            <input 
              type="text" 
              className="flex-grow px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:border-black transition-all"
              placeholder="새로운 주제 이름 (예: AI, Life, News)" 
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCategory()}
            />
            <button onClick={addCategory} className="px-8 py-4 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-gray-100">추가</button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            {settings.categories.map(cat => (
              <div key={cat} className="group relative bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                <span className="font-bold text-gray-800 text-sm">{cat}</span>
                <button 
                  onClick={() => removeCategory(cat)}
                  className="text-gray-300 hover:text-red-500 transition-colors p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            ))}
          </div>
          
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-start space-x-4">
            <div className="p-2 bg-blue-500 text-white rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </div>
            <p className="text-[13px] text-blue-700 font-medium leading-relaxed">주제를 추가하면 사이드바 메뉴에 자동으로 반영되며, 글 작성 시 해당 주제를 선택하여 분류할 수 있습니다.</p>
          </div>
        </section>
      ) : activeTab === 'about' ? (
        <section className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm space-y-6">
          <h2 className="text-xl font-black">소개 페이지 편집</h2>
          <textarea 
            rows={15} 
            className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-medium text-sm leading-relaxed outline-none focus:border-black transition-colors"
            value={settings.aboutContent}
            onChange={e => setSettings({...settings, aboutContent: e.target.value})}
            placeholder="마크다운으로 소개글을 작성하세요..."
          />
          <button onClick={() => handleSaveSettings()} className="w-full bg-black text-white py-4 rounded-2xl font-bold shadow-lg shadow-gray-100">소개 내용 업데이트</button>
        </section>
      ) : activeTab === 'ads' ? (
        <section className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm space-y-8">
          <h2 className="text-xl font-black">AdSense Configuration</h2>
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Client ID</label>
              <input className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-mono text-sm" value={settings.adConfig.clientId} onChange={e => setSettings({...settings, adConfig: {...settings.adConfig, clientId: e.target.value}})} placeholder="ca-pub-xxxxxxxxxxxx" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['mainPageSlot', 'postTopSlot', 'postBottomSlot'].map(slot => (
                <div key={slot} className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{slot.replace(/([A-Z])/g, ' $1')}</label>
                  <input className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-mono text-sm" value={(settings.adConfig as any)[slot]} onChange={e => setSettings({...settings, adConfig: {...settings.adConfig, [slot]: e.target.value}})} />
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => handleSaveSettings()} className="w-full bg-black text-white py-4 rounded-xl font-bold">광고 정보 저장</button>
        </section>
      ) : activeTab === 'db' ? (
        <section className="bg-gray-900 text-white p-8 rounded-3xl shadow-xl space-y-6">
          <h2 className="text-xl font-black text-white">Supabase Cloud Sync</h2>
          <div className="space-y-4">
            <input className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl font-mono text-sm outline-none focus:border-white/30" value={settings.supabaseUrl || ''} onChange={e => setSettings({...settings, supabaseUrl: e.target.value})} placeholder="URL" />
            <input type="password" className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl font-mono text-sm outline-none focus:border-white/30" value={settings.supabaseKey || ''} onChange={e => setSettings({...settings, supabaseKey: e.target.value})} placeholder="Anon Key" />
          </div>
          <button onClick={() => handleSaveSettings()} className="w-full bg-white text-black py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors">클라우드 연결 정보 저장</button>
        </section>
      ) : (
        <>
          <section className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm space-y-6">
            <h2 className="text-xl font-black">Content Editor</h2>
            <form onSubmit={handleCreateOrUpdate} className="space-y-6">
              <input required className="w-full px-4 py-3 bg-gray-50 border-none outline-none font-black text-xl placeholder:text-gray-300" value={currentPost.title} onChange={e => setCurrentPost({...currentPost, title: e.target.value})} placeholder="여기에 제목을 입력하세요" />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">주제 선택</label>
                  <select className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs outline-none focus:border-black transition-colors" value={currentPost.category} onChange={e => setCurrentPost({...currentPost, category: e.target.value})}>
                    {settings.categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    {settings.categories.length === 0 && <option value="">주제 없음 (주제 관리에서 추가하세요)</option>}
                  </select>
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">커버 이미지</label>
                  <input className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs outline-none focus:border-black transition-colors" value={currentPost.image} onChange={e => setCurrentPost({...currentPost, image: e.target.value})} placeholder="URL (선택사항)" />
                </div>
              </div>

              <div className="flex bg-gray-100 p-1 rounded-xl space-x-1 w-fit">
                <button type="button" onClick={() => setActiveTab('write')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest ${activeTab === 'write' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}>Write</button>
                <button type="button" onClick={() => setActiveTab('preview')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest ${activeTab === 'preview' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}>Preview</button>
              </div>

              {activeTab === 'write' ? (
                <textarea ref={textareaRef} required rows={15} className="w-full px-6 py-4 bg-gray-50 border-none outline-none resize-none font-sans text-sm leading-relaxed rounded-2xl" value={currentPost.content} onChange={e => setCurrentPost({...currentPost, content: e.target.value})} placeholder="당신의 통찰을 마크다운으로 기록해보세요..." />
              ) : (
                <div className="p-10 bg-white border border-gray-50 rounded-2xl prose prose-sm max-w-none min-h-[400px]" dangerouslySetInnerHTML={{ __html: marked.parse(currentPost.content || '') }} />
              )}
              
              <div className="flex gap-4">
                <button type="submit" className="flex-grow bg-black text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-xl shadow-gray-100 hover:scale-[1.01] transition-all">{isEditing ? '글 수정 완료' : '새로운 글 발행'}</button>
                {isEditing && <button type="button" onClick={resetForm} className="px-8 py-4 bg-gray-100 text-gray-400 rounded-xl font-bold text-sm">취소</button>}
              </div>
            </form>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-black">Manage Insights <span className="text-gray-300 font-bold ml-2">{posts.length}</span></h2>
            <div className="grid grid-cols-1 gap-4">
              {posts.map(post => (
                <div key={post.id} className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl group hover:border-black hover:shadow-lg transition-all">
                  <div className="flex items-center space-x-5">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      <img src={post.image} className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm group-hover:text-black">{post.title}</h4>
                      <p className="text-[10px] text-gray-300 font-black uppercase tracking-wider mt-1">{post.category} • {post.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { setCurrentPost(post); setIsEditing(true); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="p-2.5 bg-gray-50 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => deletePost(post.id)} className="p-2.5 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
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
