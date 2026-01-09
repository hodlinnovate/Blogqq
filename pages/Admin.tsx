
import React, { useState, useEffect, useRef } from 'react';
import { BlogPost, SiteSettings } from '../types';
import { INITIAL_POSTS, DEFAULT_SETTINGS } from '../constants';
import { savePostToCloud, deletePostFromCloud, saveSettingsToCloud, fetchSettingsFromCloud } from '../lib/db';
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

    // 에디터 내용 초기화 (수정 시)
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
      if (!currentPost.category && mergedSettings.categories?.length > 0) {
        setCurrentPost(curr => ({ ...curr, category: mergedSettings.categories[0] }));
      }
    } else {
      const savedSettings = localStorage.getItem('crypto_site_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
        if (!currentPost.category && parsed.categories?.length > 0) {
          setCurrentPost(curr => ({ ...curr, category: parsed.categories[0] }));
        }
      }
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
    
    if (settingsToSave.supabaseUrl && settingsToSave.supabaseKey) {
      const success = await saveSettingsToCloud(settingsToSave);
      if (success) setSaveStatus('클라우드 저장 완료!');
    } else {
      setSaveStatus('브라우저 임시 저장 완료!');
    }
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const addCategory = () => {
    if (!newCategory || (settings.categories || []).includes(newCategory)) return;
    const updated = { ...settings, categories: [...(settings.categories || []), newCategory] };
    setSettings(updated);
    setNewCategory('');
    handleSaveSettings(updated);
  };

  const removeCategory = (cat: string) => {
    const updated = { ...settings, categories: (settings.categories || []).filter(c => c !== cat) };
    setSettings(updated);
    handleSaveSettings(updated);
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
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

    const plainText = stripHtml(currentPost.content || '');
    const excerpt = currentPost.excerpt || (plainText.slice(0, 140) + '...');

    if (isEditing && currentPost.id) {
      const updatedPost = { ...currentPost, excerpt, slug, date } as BlogPost;
      newPostList = posts.map(p => p.id === currentPost.id ? updatedPost : p);
      await savePostToCloud(updatedPost);
      setSaveStatus('업데이트 완료');
    } else {
      const newPost: BlogPost = {
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
      newPostList = [newPost, ...posts];
      await savePostToCloud(newPost);
      setSaveStatus('발행 완료');
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
      setSaveStatus('삭제됨');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setActiveTab('write');
    if (quillRef.current) quillRef.current.root.innerHTML = '';
    setCurrentPost({ 
      title: '', 
      excerpt: '', 
      content: '', 
      category: settings.categories?.[0] || '', 
      author: '김병준', 
      image: '', 
      tags: [] 
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white p-10 rounded-3xl border border-gray-100 shadow-xl text-center">
          <h1 className="text-2xl font-black text-gray-900 mb-8">Admin Access</h1>
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
          <h1 className="text-3xl font-black text-gray-900">Console</h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">김병준의 블로그 관리</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('categories')} className={`px-4 py-2 rounded-lg font-bold text-xs ${activeTab === 'categories' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>주제 관리</button>
          <button onClick={() => setActiveTab('about')} className={`px-4 py-2 rounded-lg font-bold text-xs ${activeTab === 'about' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>소개 수정</button>
          <button onClick={() => setActiveTab('ads')} className={`px-4 py-2 rounded-lg font-bold text-xs ${activeTab === 'ads' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>광고</button>
          <button onClick={() => setIsAuthenticated(false)} className="px-4 py-2 bg-gray-50 text-gray-400 rounded-lg font-bold text-xs">나가기</button>
        </div>
      </div>

      {saveStatus && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-black text-white px-8 py-3 rounded-2xl shadow-2xl text-xs font-black animate-bounce">
          {saveStatus}
        </div>
      )}

      {activeTab === 'categories' ? (
        <section className="bg-white border border-gray-100 p-8 rounded-3xl space-y-8">
          <h2 className="text-xl font-black">새 주제 추가</h2>
          <div className="flex gap-2">
            <input type="text" className="flex-grow px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:border-black" placeholder="예: Bitcoin, NFT, Daily" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
            <button onClick={addCategory} className="px-8 py-4 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest">추가</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(settings.categories || []).map(cat => (
              <div key={cat} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                <span className="font-bold text-gray-800 text-sm">{cat}</span>
                <button onClick={() => removeCategory(cat)} className="text-gray-300 hover:text-red-500 transition-colors">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : activeTab === 'about' ? (
        <section className="bg-white border border-gray-100 p-8 rounded-3xl space-y-6">
          <h2 className="text-xl font-black">소개 페이지 편집</h2>
          <textarea rows={15} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-medium outline-none focus:border-black" value={settings.aboutContent} onChange={e => setSettings({...settings, aboutContent: e.target.value})} />
          <button onClick={() => handleSaveSettings()} className="w-full bg-black text-white py-4 rounded-2xl font-bold">저장</button>
        </section>
      ) : activeTab === 'ads' ? (
        <section className="bg-white border border-gray-100 p-8 rounded-3xl space-y-8">
          <h2 className="text-xl font-black">AdSense Configuration</h2>
          <div className="space-y-4">
            <input className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl" value={settings.adConfig?.clientId} onChange={e => setSettings({...settings, adConfig: {...settings.adConfig, clientId: e.target.value}})} placeholder="Client ID" />
            <div className="grid grid-cols-3 gap-4">
              <input className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl" value={settings.adConfig?.mainPageSlot} onChange={e => setSettings({...settings, adConfig: {...settings.adConfig, mainPageSlot: e.target.value}})} placeholder="Main Slot" />
              <input className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl" value={settings.adConfig?.postTopSlot} onChange={e => setSettings({...settings, adConfig: {...settings.adConfig, postTopSlot: e.target.value}})} placeholder="Top Slot" />
              <input className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl" value={settings.adConfig?.postBottomSlot} onChange={e => setSettings({...settings, adConfig: {...settings.adConfig, postBottomSlot: e.target.value}})} placeholder="Bottom Slot" />
            </div>
          </div>
          <button onClick={() => handleSaveSettings()} className="w-full bg-black text-white py-4 rounded-xl font-bold">광고 정보 저장</button>
        </section>
      ) : (
        <>
          <section className="bg-white border border-gray-100 p-8 rounded-3xl space-y-6 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-black">Write Insight</h2>
              {isEditing && <button onClick={resetForm} className="text-xs font-bold text-gray-400 hover:text-black">신규 작성으로 전환</button>}
            </div>
            <form onSubmit={handleCreateOrUpdate} className="space-y-6">
              <input required className="w-full px-4 py-3 bg-gray-50 border-none outline-none font-black text-xl" value={currentPost.title} onChange={e => setCurrentPost({...currentPost, title: e.target.value})} placeholder="제목" />
              <div className="grid grid-cols-2 gap-4">
                <select className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold" value={currentPost.category} onChange={e => setCurrentPost({...currentPost, category: e.target.value})}>
                  {(settings.categories || []).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <input className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold" value={currentPost.image} onChange={e => setCurrentPost({...currentPost, image: e.target.value})} placeholder="커버 이미지 URL (비워두면 자동)" />
              </div>
              
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden min-h-[500px] flex flex-col">
                <div ref={editorContainerRef}></div>
              </div>

              <button type="submit" className="w-full bg-black text-white py-5 rounded-2xl font-black shadow-xl shadow-gray-100 hover:scale-[1.01] transition-all">
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
                    <img src={post.image} className="w-12 h-12 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all" />
                    <div>
                      <h4 className="font-bold text-sm">{post.title}</h4>
                      <p className="text-[10px] text-gray-300 font-black uppercase">{post.category} • {post.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { 
                      setCurrentPost(post); 
                      setIsEditing(true); 
                      setActiveTab('write');
                      if (quillRef.current) quillRef.current.root.innerHTML = post.content;
                      window.scrollTo({top: 0, behavior: 'smooth'}); 
                    }} className="p-2 text-gray-400 hover:text-black">수정</button>
                    <button onClick={() => deletePost(post.id)} className="p-2 text-gray-400 hover:text-red-500">삭제</button>
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
