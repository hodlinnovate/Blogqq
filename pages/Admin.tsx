
import React, { useState, useEffect, useRef } from 'react';
import { BlogPost, SiteSettings } from '../types';
import { INITIAL_POSTS, DEFAULT_SETTINGS } from '../constants';
import { savePostToCloud, deletePostFromCloud, saveSettingsToCloud, getDbClient } from '../lib/db';
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
  const [activeTab, setActiveTab] = useState<'write' | 'preview' | 'db'>('write');
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

    const savedSettings = localStorage.getItem('crypto_site_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const storedSettings = localStorage.getItem('crypto_site_settings');
    const currentSettings = storedSettings ? JSON.parse(storedSettings) : DEFAULT_SETTINGS;
    
    if (passwordInput === (currentSettings.adminPassword || DEFAULT_SETTINGS.adminPassword)) {
      setIsAuthenticated(true);
      setLoginError(false);
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  const saveToStorage = async (updatedPosts: BlogPost[]) => {
    localStorage.setItem('crypto_blog_posts', JSON.stringify(updatedPosts));
    setPosts(updatedPosts);
  };

  const handleSaveSettings = async () => {
    localStorage.setItem('crypto_site_settings', JSON.stringify(settings));
    
    // Cloud Sync if key exists
    if (settings.supabaseUrl && settings.supabaseKey) {
      const success = await saveSettingsToCloud(settings);
      if (success) setSaveStatus('사이트 설정이 클라우드에 영구 저장되었습니다!');
    } else {
      setSaveStatus('설정이 브라우저에 저장되었습니다. (전체 공개를 위해선 DB 설정 필요)');
    }
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPost.title || !currentPost.content) {
      alert('제목과 본문은 필수 입력 사항입니다.');
      return;
    }

    const slug = (currentPost.title as string).toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '');
    const date = new Date().toISOString().split('T')[0];

    let newPostList: BlogPost[];

    if (isEditing && currentPost.id) {
      const updatedPost = { ...currentPost, slug } as BlogPost;
      newPostList = posts.map(p => p.id === currentPost.id ? updatedPost : p);
      await savePostToCloud(updatedPost);
      setSaveStatus('게시물이 클라우드에 업데이트되었습니다.');
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
      setSaveStatus('새로운 글이 클라우드에 발행되었습니다.');
    }
    
    await saveToStorage(newPostList);
    setTimeout(() => setSaveStatus(null), 3000);
    resetForm();
  };

  const deletePost = async (id: string) => {
    if (window.confirm('정말로 이 글을 삭제하시겠습니까? 클라우드에서도 사라집니다.')) {
      await deletePostFromCloud(id);
      const filtered = posts.filter(p => p.id !== id);
      await saveToStorage(filtered);
      setSaveStatus('글이 완전히 삭제되었습니다.');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setActiveTab('write');
    setCurrentPost({
      title: '', excerpt: '', content: '', category: 'Crypto', author: '김병준', image: '', tags: []
    });
  };

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const newContent = text.substring(0, start) + before + selectedText + after + text.substring(end);
    setCurrentPost({ ...currentPost, content: newContent });
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-2xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">관리자 로그인</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input 
              type="password" 
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="비밀번호"
              className={`w-full px-6 py-5 bg-gray-50 border ${loginError ? 'border-red-400' : 'border-gray-200'} rounded-2xl outline-none text-center text-xl font-bold`}
              autoFocus
            />
            <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-100">입장하기</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16 max-w-4xl mx-auto pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-10">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">블로그 관리 센터</h1>
          <p className="text-gray-500 mt-2 font-medium">실시간 클라우드 DB 연동 중: {settings.supabaseUrl ? '✅ 연결됨' : '❌ 미연결 (로컬 전용)'}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('db')} className="px-5 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100">데이터베이스 설정</button>
          <button onClick={() => setIsAuthenticated(false)} className="px-5 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold text-sm">로그아웃</button>
        </div>
      </div>

      {saveStatus && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-bounce-short">
          <div className="bg-gray-900 text-white px-8 py-4 rounded-full shadow-2xl flex items-center space-x-3">
            <span className="text-sm font-bold">{saveStatus}</span>
          </div>
        </div>
      )}

      {activeTab === 'db' ? (
        <section className="bg-blue-600 text-white p-10 rounded-[2.5rem] shadow-2xl space-y-8">
          <h2 className="text-2xl font-black">전체 공개를 위한 클라우드 DB 설정</h2>
          <p className="text-blue-100 opacity-80 leading-relaxed">
            무료 데이터베이스 서비스인 <strong>Supabase</strong>에 가입하신 후 아래 정보를 입력하세요.<br/>
            이 설정이 완료되어야만 다른 사람들도 귀하의 블로그 글을 볼 수 있습니다.
          </p>
          <div className="space-y-6">
            <div>
              <label className="text-xs font-black uppercase tracking-widest mb-2 block">Supabase Project URL</label>
              <input className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-2xl outline-none focus:bg-white/20 transition-all font-mono" value={settings.supabaseUrl || ''} onChange={e => setSettings({...settings, supabaseUrl: e.target.value})} placeholder="https://xxxx.supabase.co" />
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-widest mb-2 block">Supabase Anon Key</label>
              <input type="password" className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-2xl outline-none focus:bg-white/20 transition-all font-mono" value={settings.supabaseKey || ''} onChange={e => setSettings({...settings, supabaseKey: e.target.value})} placeholder="공용 API 키를 입력하세요" />
            </div>
          </div>
          <button onClick={handleSaveSettings} className="w-full bg-white text-blue-600 py-5 rounded-2xl font-black text-lg hover:bg-gray-100 transition-all">DB 정보 저장 및 블로그 활성화</button>
          <button onClick={() => setActiveTab('write')} className="w-full py-2 text-white/50 text-sm font-bold hover:text-white transition-all">← 다시 글 관리로 돌아가기</button>
        </section>
      ) : (
        <>
          {/* 사이트 브랜딩 설정 */}
          <section className="bg-white border border-gray-100 p-10 rounded-[2rem] shadow-sm space-y-10">
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              사이트 브랜딩 설정
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">상단 로고 텍스트</label>
                <div className="flex gap-2">
                  <input className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold" value={settings.brandName} onChange={e => setSettings({...settings, brandName: e.target.value})} />
                  <input className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-blue-600" value={settings.brandSubName} onChange={e => setSettings({...settings, brandSubName: e.target.value})} />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">메인 타이틀</label>
                <input className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold" value={settings.mainTitle} onChange={e => setSettings({...settings, mainTitle: e.target.value})} />
              </div>
            </div>
            <button onClick={handleSaveSettings} className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-lg hover:scale-[0.99] transition-transform">사이트 정보 업데이트</button>
          </section>

          {/* 글 작성 영역 */}
          <section className="space-y-8">
            <h2 className="text-2xl font-black text-gray-900">{isEditing ? '글 수정하기' : '새로운 글 발행'}</h2>
            <form onSubmit={handleCreateOrUpdate} className="bg-white border border-gray-100 p-10 rounded-[2rem] shadow-sm space-y-8">
              <input required className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-black text-2xl outline-none focus:border-blue-600" value={currentPost.title} onChange={e => setCurrentPost({...currentPost, title: e.target.value})} placeholder="제목을 입력하세요" />
              <div className="flex bg-gray-100 p-1.5 rounded-2xl space-x-1">
                <button type="button" onClick={() => setActiveTab('write')} className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${activeTab === 'write' ? 'bg-white text-blue-600' : 'text-gray-400'}`}>에디터</button>
                <button type="button" onClick={() => setActiveTab('preview')} className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${activeTab === 'preview' ? 'bg-white text-blue-600' : 'text-gray-400'}`}>미리보기</button>
              </div>
              {activeTab === 'write' ? (
                <textarea ref={textareaRef} required rows={15} className="w-full px-6 py-5 bg-gray-50 border-none outline-none resize-none font-sans leading-relaxed text-gray-800" value={currentPost.content} onChange={e => setCurrentPost({...currentPost, content: e.target.value})} placeholder="본문을 작성하세요 (마크다운 지원)" />
              ) : (
                <div className="px-8 py-8 bg-white border border-gray-100 rounded-[1.5rem] prose max-w-none" dangerouslySetInnerHTML={{ __html: marked.parse(currentPost.content || '') }} />
              )}
              <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-blue-700 shadow-xl shadow-blue-50">인사이트 발행하기</button>
              {isEditing && <button type="button" onClick={resetForm} className="w-full py-2 text-gray-400 font-bold">취소하고 새로 쓰기</button>}
            </form>
          </section>

          {/* 목록 관리 */}
          <section className="space-y-8">
            <h2 className="text-2xl font-black text-gray-900">발행된 글 관리</h2>
            <div className="grid grid-cols-1 gap-4">
              {posts.map(post => (
                <div key={post.id} className="flex items-center justify-between p-6 bg-white border border-gray-100 rounded-3xl group shadow-sm">
                  <div className="flex items-center space-x-6">
                    <img src={post.image} className="w-16 h-16 rounded-2xl object-cover" alt="" />
                    <div>
                      <h4 className="font-black text-lg text-gray-900">{post.title}</h4>
                      <p className="text-xs text-gray-400 mt-1">{post.date} • {post.views} views</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => { setCurrentPost(post); setIsEditing(true); window.scrollTo(0,0); }} className="px-6 py-3 bg-gray-50 text-gray-600 rounded-xl font-black text-sm hover:bg-blue-600 hover:text-white transition-all">수정</button>
                    <button onClick={() => deletePost(post.id)} className="px-6 py-3 bg-gray-50 text-red-400 rounded-xl font-black text-sm hover:bg-red-500 hover:text-white transition-all">삭제</button>
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
