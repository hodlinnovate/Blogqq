
import React, { useState, useEffect, useRef } from 'react';
import { BlogPost, SiteSettings } from '../types';
import { INITIAL_POSTS, DEFAULT_SETTINGS } from '../constants';
import { savePostToCloud, deletePostFromCloud, saveSettingsToCloud, fetchSettingsFromCloud, isCloudConnected, fetchPostsFromCloud } from '../lib/db';
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
  const [activeTab, setActiveTab] = useState<'write' | 'preview' | 'db' | 'ads' | 'categories'>('write');
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
    checkConnection();
  }, []);

  const checkConnection = () => {
    setCloudActive(isCloudConnected());
  };

  useEffect(() => {
    if (isAuthenticated && activeTab === 'write' && editorContainerRef.current && !quillRef.current) {
      quillRef.current = new Quill(editorContainerRef.current, {
        theme: 'snow',
        placeholder: '당신의 통찰을 자유롭게 기록해보세요...',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
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
  }, [isAuthenticated, activeTab]);

  const loadAllData = async () => {
    const savedPosts = localStorage.getItem('crypto_blog_posts');
    setPosts(savedPosts ? JSON.parse(savedPosts) : INITIAL_POSTS);

    const cloudSettings = await fetchSettingsFromCloud();
    if (cloudSettings) {
      setSettings(prev => ({ ...prev, ...cloudSettings }));
    } else {
      const savedSettings = localStorage.getItem('crypto_site_settings');
      if (savedSettings) setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
    }

    const cloudPosts = await fetchPostsFromCloud();
    if (cloudPosts && cloudPosts.length > 0) {
      setPosts(cloudPosts);
      localStorage.setItem('crypto_blog_posts', JSON.stringify(cloudPosts));
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPassword = settings.adminPassword || DEFAULT_SETTINGS.adminPassword;
    if (passwordInput === adminPassword) {
      setIsAuthenticated(true);
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  const handleSaveSettings = async (customSettings?: SiteSettings) => {
    const settingsToSave = customSettings || settings;
    localStorage.setItem('crypto_site_settings', JSON.stringify(settingsToSave));
    const success = await saveSettingsToCloud(settingsToSave);
    checkConnection();
    setSaveStatus(success ? '클라우드 저장 성공!' : '로컬에만 저장되었습니다.');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPost.title || !currentPost.content) return;

    const slug = (currentPost.title as string).trim().replace(/[^a-zA-Z0-9가-힣\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
    const date = new Date().toISOString().split('T')[0];
    
    let updatedPost: BlogPost;
    if (isEditing && currentPost.id) {
      updatedPost = { ...currentPost, slug, date } as BlogPost;
    } else {
      updatedPost = {
        id: Date.now().toString(),
        title: currentPost.title as string,
        excerpt: currentPost.excerpt || "새로운 인사이트가 업데이트되었습니다.",
        content: currentPost.content as string,
        category: currentPost.category || settings.categories[0],
        author: currentPost.author || '김병준',
        date,
        image: currentPost.image || `https://picsum.photos/seed/${Date.now()}/800/450`,
        slug,
        tags: currentPost.tags || [],
        views: 0,
        comments: []
      };
    }
    
    const success = await savePostToCloud(updatedPost);
    const newPosts = isEditing ? posts.map(p => p.id === updatedPost.id ? updatedPost : p) : [updatedPost, ...posts];
    setPosts(newPosts);
    localStorage.setItem('crypto_blog_posts', JSON.stringify(newPosts));
    
    setSaveStatus(success ? '발행 성공!' : '발행 성공 (클라우드 오류)');
    setTimeout(() => setSaveStatus(null), 3000);
    resetForm();
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentPost({ title: '', excerpt: '', content: '', category: settings.categories[0], author: '김병준', image: '', tags: [] });
    if (quillRef.current) quillRef.current.root.innerHTML = '';
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white p-10 rounded-3xl border border-gray-100 shadow-xl">
          <h1 className="text-2xl font-black text-center mb-8">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="비밀번호" className="w-full px-6 py-4 bg-gray-50 border rounded-xl outline-none text-center font-bold" autoFocus />
            <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-bold">접속</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-4xl mx-auto pb-32">
      <div className="flex justify-between items-end border-b pb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black">Admin Console</h1>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${cloudActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {cloudActive ? 'Cloud Online' : 'Cloud Offline'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('db')} className={`px-4 py-2 rounded-lg font-bold text-xs ${activeTab === 'db' ? 'bg-black text-white' : 'bg-gray-100'}`}>DB 설정</button>
          <button onClick={() => setActiveTab('ads')} className={`px-4 py-2 rounded-lg font-bold text-xs ${activeTab === 'ads' ? 'bg-black text-white' : 'bg-gray-100'}`}>광고</button>
          <button onClick={() => setIsAuthenticated(false)} className="px-4 py-2 bg-gray-50 text-gray-400 rounded-lg font-bold text-xs">로그아웃</button>
        </div>
      </div>

      {saveStatus && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-black text-white px-8 py-3 rounded-full text-xs font-black animate-bounce shadow-2xl">
          {saveStatus}
        </div>
      )}

      {activeTab === 'db' ? (
        <section className="bg-white border p-8 rounded-3xl space-y-8">
          <h2 className="text-xl font-black">Database Connection</h2>
          <div className="grid grid-cols-1 gap-6">
            <p className="text-xs text-gray-500 leading-relaxed">
              <strong>중요:</strong> 모든 기기에서 글을 공유하려면 <code>constants.ts</code> 파일의 <code>SUPABASE_CONFIG</code> 섹션에도 아래 정보를 입력해야 합니다.
            </p>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Supabase URL</label>
              <input className="w-full px-4 py-3 bg-gray-50 border rounded-xl font-mono text-sm" value={settings.supabaseUrl || ''} onChange={e => setSettings({...settings, supabaseUrl: e.target.value})} placeholder="https://your-id.supabase.co" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Supabase Anon Key</label>
              <input className="w-full px-4 py-3 bg-gray-50 border rounded-xl font-mono text-sm" value={settings.supabaseKey || ''} onChange={e => setSettings({...settings, supabaseKey: e.target.value})} placeholder="eyJhbGci..." />
            </div>
            <button onClick={() => handleSaveSettings()} className="w-full bg-black text-white py-4 rounded-xl font-bold">현재 기기에만 적용</button>
          </div>

          <div className="mt-12 p-6 bg-blue-50 rounded-2xl border border-blue-100">
            <h3 className="text-sm font-black text-blue-800 mb-4">안내: 테이블이 이미 있다고 나오나요?</h3>
            <p className="text-xs text-blue-700 leading-relaxed mb-4">
              "relation posts already exists" 에러는 <strong>성공</strong>을 의미합니다! 이미 테이블이 만들어졌다는 뜻이니 아래 명령어를 다시 실행할 필요가 없습니다.
            </p>
            <pre className="bg-white p-4 rounded-xl text-[10px] font-mono text-gray-600 overflow-x-auto border border-blue-100 mb-4">
{`/* 이미 테이블이 있는 경우 에러를 무시하는 안전한 쿼리 */
create table if not exists posts (
  id text primary key,
  title text,
  excerpt text,
  content text,
  category text,
  author text,
  date text,
  image text,
  slug text unique,
  tags text[],
  views int default 0,
  comments jsonb default '[]'::jsonb
);

create table if not exists settings (
  id int primary key,
  data jsonb
);`}
            </pre>
          </div>
        </section>
      ) : activeTab === 'ads' ? (
        <section className="bg-white border p-8 rounded-3xl space-y-6">
          <h2 className="text-xl font-black">AdSense Configuration</h2>
          <input className="w-full px-4 py-3 bg-gray-50 border rounded-xl" value={settings.adConfig?.clientId} onChange={e => setSettings({...settings, adConfig: {...settings.adConfig, clientId: e.target.value}})} placeholder="Client ID (ca-pub-...)" />
          <button onClick={() => handleSaveSettings()} className="w-full bg-black text-white py-4 rounded-xl font-bold">저장</button>
        </section>
      ) : (
        <>
          <section className="bg-white border p-8 rounded-3xl space-y-6">
            <h2 className="text-xl font-black">{isEditing ? 'Edit Post' : 'New Post'}</h2>
            <form onSubmit={handleCreateOrUpdate} className="space-y-6">
              <input className="w-full px-4 py-3 bg-gray-50 border-none outline-none font-black text-xl" value={currentPost.title} onChange={e => setCurrentPost({...currentPost, title: e.target.value})} placeholder="제목을 입력하세요" />
              <div className="grid grid-cols-2 gap-4">
                <select className="px-4 py-3 bg-gray-50 border rounded-xl font-bold" value={currentPost.category} onChange={e => setCurrentPost({...currentPost, category: e.target.value})}>
                  {settings.categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input className="px-4 py-3 bg-gray-50 border rounded-xl font-bold" value={currentPost.image} onChange={e => setCurrentPost({...currentPost, image: e.target.value})} placeholder="이미지 URL" />
              </div>
              <div className="border rounded-2xl overflow-hidden min-h-[400px]">
                <div ref={editorContainerRef}></div>
              </div>
              <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-black">발행하기</button>
            </form>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black">Recent Posts</h2>
            <div className="divide-y divide-gray-50">
              {posts.map(p => (
                <div key={p.id} className="py-4 flex justify-between items-center group">
                  <div>
                    <h4 className="font-bold text-sm group-hover:underline">{p.title}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{p.category} • {p.date}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setCurrentPost(p); setIsEditing(true); if(quillRef.current) quillRef.current.root.innerHTML = p.content; window.scrollTo(0,0); }} className="text-xs font-bold text-gray-400 hover:text-black">Edit</button>
                    <button onClick={async () => { if(confirm('Delete?')) { await deletePostFromCloud(p.id); loadAllData(); } }} className="text-xs font-bold text-gray-400 hover:text-red-500">Delete</button>
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
