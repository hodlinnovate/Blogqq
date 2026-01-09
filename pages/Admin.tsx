
import React, { useState, useEffect, useRef } from 'react';
import { BlogPost, SiteSettings } from '../types';
import { INITIAL_POSTS, DEFAULT_SETTINGS } from '../constants';
import { savePostToCloud, deletePostFromCloud, saveSettingsToCloud, fetchSettingsFromCloud, isCloudConnected } from '../lib/db';
// @ts-ignore
import Quill from 'quill';

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
  const [cloudActive, setCloudActive] = useState(false);
  
  const quillRef = useRef<any>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  
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
    setCloudActive(isCloudConnected());
  }, []);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'write' && editorContainerRef.current && !quillRef.current) {
      quillRef.current = new Quill(editorContainerRef.current, {
        theme: 'snow',
        placeholder: '당신의 통찰을 자유롭게 기록해보세요 (이미지 복사/붙여넣기 가능)...',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['link', 'image', 'code-block'],
            ['clean']
          ]
        }
      });

      quillRef.current.on('text-change', () => {
        const html = quillRef.current.root.innerHTML;
        setCurrentPost(prev => ({ ...prev, content: html }));
      });
    }

    if (quillRef.current && currentPost.content) {
      if (quillRef.current.root.innerHTML !== currentPost.content) {
        quillRef.current.root.innerHTML = currentPost.content;
      }
    }
  }, [isAuthenticated, activeTab]);

  const loadAllData = async () => {
    const savedPosts = localStorage.getItem('crypto_blog_posts');
    const localPosts = savedPosts ? JSON.parse(savedPosts) : INITIAL_POSTS;
    setPosts(localPosts);

    const cloudSettings = await fetchSettingsFromCloud();
    if (cloudSettings) {
      const mergedSettings = { ...DEFAULT_SETTINGS, ...cloudSettings };
      setSettings(mergedSettings);
    } else {
      const savedSettings = localStorage.getItem('crypto_site_settings');
      if (savedSettings) setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPassword = settings.adminPassword || DEFAULT_SETTINGS.adminPassword;
    if (passwordInput === adminPassword) {
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
    
    const success = await saveSettingsToCloud(settingsToSave);
    setCloudActive(isCloudConnected());
    
    setSaveStatus(success ? '클라우드 동기화 완료!' : '브라우저 로컬 저장 완료!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPost.title || !currentPost.content) return;

    const slug = (currentPost.title as string).trim().replace(/[^a-zA-Z0-9가-힣\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
    const date = new Date().toISOString().split('T')[0];
    const plainText = stripHtml(currentPost.content || '');
    const excerpt = currentPost.excerpt || (plainText.slice(0, 140) + '...');
    
    let updatedPost: BlogPost;
    let newPostList: BlogPost[];

    if (isEditing && currentPost.id) {
      updatedPost = { ...currentPost, excerpt, slug, date } as BlogPost;
      newPostList = posts.map(p => p.id === currentPost.id ? updatedPost : p);
    } else {
      updatedPost = {
        id: Date.now().toString(),
        title: currentPost.title as string,
        excerpt: excerpt,
        content: currentPost.content as string,
        category: currentPost.category || (settings.categories?.[0] || 'General'),
        author: currentPost.author || '김병준',
        date,
        image: currentPost.image || `https://picsum.photos/seed/${Date.now()}/800/450`,
        slug,
        tags: currentPost.tags || [],
        views: 0,
        comments: []
      };
      newPostList = [updatedPost, ...posts];
    }
    
    const cloudSuccess = await savePostToCloud(updatedPost);
    localStorage.setItem('crypto_blog_posts', JSON.stringify(newPostList));
    setPosts(newPostList);
    setSaveStatus(cloudSuccess ? '발행 및 클라우드 동기화 완료!' : '발행 성공 (로컬 전용)');
    setTimeout(() => setSaveStatus(null), 3000);
    resetForm();
  };

  const resetForm = () => {
    setIsEditing(false);
    setActiveTab('write');
    if (quillRef.current) quillRef.current.root.innerHTML = '';
    setCurrentPost({ title: '', excerpt: '', content: '', category: settings.categories?.[0] || '', author: '김병준', image: '', tags: [] });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white p-10 rounded-3xl border border-gray-100 shadow-xl text-center">
          <h1 className="text-2xl font-black text-gray-900 mb-8 tracking-tighter">Admin Access</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="비밀번호" className={`w-full px-6 py-4 bg-gray-50 border ${loginError ? 'border-red-400' : 'border-gray-100'} rounded-xl outline-none text-center font-bold`} autoFocus />
            <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-bold">로그인</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-4xl mx-auto pb-32">
      <div className="flex justify-between items-end border-b border-gray-100 pb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-gray-900">Console</h1>
            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${cloudActive ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
              {cloudActive ? 'Cloud Online' : 'Local Only'}
            </span>
          </div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">글 관리 및 시스템 설정</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('db')} className={`px-4 py-2 rounded-lg font-bold text-xs ${activeTab === 'db' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>DB 설정</button>
          <button onClick={() => setActiveTab('categories')} className={`px-4 py-2 rounded-lg font-bold text-xs ${activeTab === 'categories' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>주제</button>
          <button onClick={() => setActiveTab('ads')} className={`px-4 py-2 rounded-lg font-bold text-xs ${activeTab === 'ads' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>광고</button>
          <button onClick={() => setIsAuthenticated(false)} className="px-4 py-2 bg-gray-50 text-gray-400 rounded-lg font-bold text-xs">나가기</button>
        </div>
      </div>

      {saveStatus && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-black text-white px-8 py-3 rounded-2xl shadow-2xl text-xs font-black animate-bounce">
          {saveStatus}
        </div>
      )}

      {activeTab === 'db' ? (
        <section className="bg-white border border-gray-100 p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-2 mb-4">
             <h2 className="text-xl font-black">Cloud Database Setup</h2>
             <span className="text-[10px] text-gray-400 font-bold">(Supabase)</span>
          </div>
          <div className="bg-blue-50 p-6 rounded-2xl mb-6">
            <p className="text-xs font-bold text-blue-700 leading-relaxed">
              💡 블로그를 모두에게 공개하려면 Supabase 계정을 만들고 아래 정보를 입력해야 합니다.<br/>
              정보를 입력하면 이 브라우저뿐만 아니라 전 세계 모든 방문자가 당신의 글을 볼 수 있게 됩니다.
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-1">Supabase Project URL</label>
              <input className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-mono text-sm" value={settings.supabaseUrl || ''} onChange={e => setSettings({...settings, supabaseUrl: e.target.value})} placeholder="https://xyz.supabase.co" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-1">Supabase API Key (Anon Key)</label>
              <input className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-mono text-sm" value={settings.supabaseKey || ''} onChange={e => setSettings({...settings, supabaseKey: e.target.value})} placeholder="eyJhbG..." />
            </div>
          </div>
          <button onClick={() => handleSaveSettings()} className="w-full bg-black text-white py-4 rounded-xl font-bold mt-4 shadow-xl shadow-gray-100">클라우드 연결하기</button>
        </section>
      ) : activeTab === 'categories' ? (
        <section className="bg-white border border-gray-100 p-8 rounded-3xl space-y-8">
          <h2 className="text-xl font-black">주제 관리</h2>
          <div className="flex gap-2">
            <input type="text" className="flex-grow px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none" placeholder="새 주제 이름" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
            <button onClick={() => { if(newCategory) { const updated = {...settings, categories: [...(settings.categories||[]), newCategory]}; setSettings(updated); setNewCategory(''); handleSaveSettings(updated); } }} className="px-8 py-4 bg-black text-white rounded-2xl font-black text-xs uppercase">추가</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(settings.categories || []).map(cat => (
              <div key={cat} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                <span className="font-bold text-gray-800 text-sm">{cat}</span>
                <button onClick={() => { const updated = {...settings, categories: settings.categories.filter(c => c !== cat)}; setSettings(updated); handleSaveSettings(updated); }} className="text-gray-300 hover:text-red-500 transition-colors">✕</button>
              </div>
            ))}
          </div>
        </section>
      ) : activeTab === 'ads' ? (
        <section className="bg-white border border-gray-100 p-8 rounded-3xl space-y-8">
          <h2 className="text-xl font-black">AdSense Configuration</h2>
          <div className="space-y-4">
            <input className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl" value={settings.adConfig?.clientId} onChange={e => setSettings({...settings, adConfig: {...settings.adConfig, clientId: e.target.value}})} placeholder="Client ID (ca-pub-...)" />
            <div className="grid grid-cols-3 gap-4">
              <input className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl" value={settings.adConfig?.mainPageSlot} onChange={e => setSettings({...settings, adConfig: {...settings.adConfig, mainPageSlot: e.target.value}})} placeholder="메인 광고 Slot" />
              <input className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl" value={settings.adConfig?.postTopSlot} onChange={e => setSettings({...settings, adConfig: {...settings.adConfig, postTopSlot: e.target.value}})} placeholder="본문 상단 Slot" />
              <input className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl" value={settings.adConfig?.postBottomSlot} onChange={e => setSettings({...settings, adConfig: {...settings.adConfig, postBottomSlot: e.target.value}})} placeholder="본문 하단 Slot" />
            </div>
          </div>
          <button onClick={() => handleSaveSettings()} className="w-full bg-black text-white py-4 rounded-xl font-bold">광고 정보 저장</button>
        </section>
      ) : (
        <>
          <section className="bg-white border border-gray-100 p-8 rounded-3xl space-y-6 shadow-sm">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black">Write Insight</h2>
              {isEditing && <button onClick={resetForm} className="text-xs font-bold text-gray-400 hover:text-black">신규 작성으로 전환</button>}
            </div>
            <form onSubmit={handleCreateOrUpdate} className="space-y-6">
              <input required className="w-full px-4 py-3 bg-gray-50 border-none outline-none font-black text-xl" value={currentPost.title} onChange={e => setCurrentPost({...currentPost, title: e.target.value})} placeholder="제목" />
              <div className="grid grid-cols-2 gap-4">
                <select className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold" value={currentPost.category} onChange={e => setCurrentPost({...currentPost, category: e.target.value})}>
                  {(settings.categories || []).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <input className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold" value={currentPost.image} onChange={e => setCurrentPost({...currentPost, image: e.target.value})} placeholder="커버 이미지 URL" />
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden min-h-[500px] flex flex-col shadow-inner">
                <div ref={editorContainerRef}></div>
              </div>
              <button type="submit" className="w-full bg-black text-white py-5 rounded-2xl font-black shadow-xl shadow-gray-100">
                {isEditing ? '변경사항 저장하기' : '인사이트 발행하기'}
              </button>
            </form>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black">Recent Posts ({posts.length})</h2>
            <div className="grid grid-cols-1 gap-4">
              {posts.map(post => (
                <div key={post.id} className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl group hover:border-black transition-all">
                  <div className="flex items-center space-x-5">
                    <img src={post.image} className="w-12 h-12 rounded-xl object-cover grayscale group-hover:grayscale-0" />
                    <div>
                      <h4 className="font-bold text-sm">{post.title}</h4>
                      <p className="text-[10px] text-gray-300 font-black uppercase">{post.category} • {post.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setCurrentPost(post); setIsEditing(true); setActiveTab('write'); if(quillRef.current) quillRef.current.root.innerHTML = post.content; window.scrollTo({top: 0, behavior:'smooth'}); }} className="p-2 text-gray-400 hover:text-black">수정</button>
                    <button onClick={async () => { if(confirm('삭제?')) { await deletePostFromCloud(post.id); const filtered = posts.filter(p => p.id !== post.id); localStorage.setItem('crypto_blog_posts', JSON.stringify(filtered)); setPosts(filtered); } }} className="p-2 text-gray-400 hover:text-red-500">삭제</button>
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
