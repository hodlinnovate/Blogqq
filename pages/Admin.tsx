
import React, { useState, useEffect, useRef } from 'react';
import { BlogPost, SiteSettings } from '../types';
import { INITIAL_POSTS, DEFAULT_SETTINGS } from '../constants';
import { 
  savePostToCloud, 
  deletePostFromCloud, 
  saveSettingsToCloud, 
  fetchSettingsFromCloud, 
  isCloudConnected, 
  fetchPostsFromCloud,
  fetchPostAnalytics
} from '../lib/db';
// @ts-ignore
import Quill from 'quill';

type AdminTab = 'write' | 'manage' | 'settings' | 'db' | 'ads';

const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('write');
  const [cloudActive, setCloudActive] = useState(false);
  
  // 분석 데이터 상태
  const [selectedPostAnalytics, setSelectedPostAnalytics] = useState<{source: string, count: number}[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const postQuillRef = useRef<any>(null);
  const postEditorRef = useRef<HTMLDivElement>(null);
  const aboutQuillRef = useRef<any>(null);
  const aboutEditorRef = useRef<HTMLDivElement>(null);
  
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
    if (isAuthenticated && activeTab === 'write' && postEditorRef.current && !postQuillRef.current) {
      postQuillRef.current = new Quill(postEditorRef.current, {
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

      postQuillRef.current.on('text-change', () => {
        const html = postQuillRef.current.root.innerHTML;
        setCurrentPost(prev => ({ ...prev, content: html }));
      });
      
      if (isEditing && currentPost.content) {
        postQuillRef.current.root.innerHTML = currentPost.content;
      }
    }
  }, [isAuthenticated, activeTab, isEditing]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'settings' && aboutEditorRef.current && !aboutQuillRef.current) {
      aboutQuillRef.current = new Quill(aboutEditorRef.current, {
        theme: 'snow',
        placeholder: '본인에 대한 소개를 적어주세요...',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['link', 'clean']
          ]
        }
      });

      aboutQuillRef.current.on('text-change', () => {
        const html = aboutQuillRef.current.root.innerHTML;
        setSettings(prev => ({ ...prev, aboutContent: html }));
      });

      if (settings.aboutContent) {
        aboutQuillRef.current.root.innerHTML = settings.aboutContent;
      }
    }
  }, [isAuthenticated, activeTab]);

  const loadAllData = async () => {
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
    } else {
      const savedPosts = localStorage.getItem('crypto_blog_posts');
      setPosts(savedPosts ? JSON.parse(savedPosts) : INITIAL_POSTS);
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

  const handleSaveSettings = async () => {
    localStorage.setItem('crypto_site_settings', JSON.stringify(settings));
    const success = await saveSettingsToCloud(settings);
    checkConnection();
    setSaveStatus(success ? '설정 저장 완료!' : '로컬에만 저장됨 (연결 확인)');
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
    resetPostForm();
    setActiveTab('manage');
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('정말로 삭제하시겠습니까?')) return;
    
    const success = await deletePostFromCloud(id);
    const updatedPosts = posts.filter(p => p.id !== id);
    setPosts(updatedPosts);
    localStorage.setItem('crypto_blog_posts', JSON.stringify(updatedPosts));
    
    setSaveStatus(success ? '삭제 완료!' : '삭제 실패 (클라우드 확인)');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleShowAnalytics = async (postId: string) => {
    setIsAnalyzing(true);
    setSelectedPostAnalytics(null);
    const data = await fetchPostAnalytics(postId);
    setSelectedPostAnalytics(data);
    setIsAnalyzing(false);
  };

  const resetPostForm = () => {
    setIsEditing(false);
    setCurrentPost({ title: '', excerpt: '', content: '', category: settings.categories[0], author: '김병준', image: '', tags: [] });
    if (postQuillRef.current) postQuillRef.current.root.innerHTML = '';
  };

  const startEditPost = (post: BlogPost) => {
    setCurrentPost(post);
    setIsEditing(true);
    setActiveTab('write');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white p-10 rounded-3xl border border-gray-100 shadow-xl">
          <h1 className="text-2xl font-black text-center mb-8">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="비밀번호" className="w-full px-6 py-4 bg-gray-50 border rounded-xl outline-none text-center font-bold" autoFocus />
            {loginError && <p className="text-red-500 text-[10px] text-center font-bold uppercase tracking-widest animate-shake">Incorrect Password</p>}
            <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-bold">접속</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-4xl mx-auto pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b pb-8 gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tighter">Admin Console</h1>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${cloudActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {cloudActive ? 'Cloud Online' : 'Cloud Offline'}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['write', 'manage', 'settings', 'db', 'ads'] as AdminTab[]).map(tab => (
            <button 
              key={tab}
              onClick={() => { setActiveTab(tab); setSelectedPostAnalytics(null); }} 
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === tab ? 'bg-black text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
            >
              {tab === 'write' ? '글 작성' : tab === 'manage' ? '글 관리' : tab === 'settings' ? '사이트 설정' : tab === 'db' ? 'DB' : '광고'}
            </button>
          ))}
          <button onClick={() => setIsAuthenticated(false)} className="px-4 py-2 bg-gray-50 text-gray-300 rounded-lg font-bold text-xs ml-4">로그아웃</button>
        </div>
      </div>

      {saveStatus && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-black text-white px-8 py-3 rounded-full text-xs font-black animate-bounce shadow-2xl">
          {saveStatus}
        </div>
      )}

      {activeTab === 'write' && (
        <section className="bg-white border p-8 rounded-3xl space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black">{isEditing ? '글 수정하기' : '새 글 작성하기'}</h2>
            {isEditing && (
              <button onClick={resetPostForm} className="text-[10px] font-black text-red-500 uppercase tracking-widest">취소하고 새로 작성</button>
            )}
          </div>
          <form onSubmit={handleCreateOrUpdate} className="space-y-6">
            <input 
              className="w-full px-4 py-3 bg-gray-50 border-none outline-none font-black text-2xl placeholder:text-gray-200" 
              value={currentPost.title} 
              onChange={e => setCurrentPost({...currentPost, title: e.target.value})} 
              placeholder="제목을 입력하세요" 
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select className="px-4 py-3 bg-gray-50 border rounded-xl font-bold text-sm" value={currentPost.category} onChange={e => setCurrentPost({...currentPost, category: e.target.value})}>
                {settings.categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input className="px-4 py-3 bg-gray-50 border rounded-xl font-bold text-sm" value={currentPost.image} onChange={e => setCurrentPost({...currentPost, image: e.target.value})} placeholder="이미지 URL (선택)" />
            </div>
            <textarea 
              className="w-full px-4 py-3 bg-gray-50 border rounded-xl font-bold text-sm resize-none" 
              value={currentPost.excerpt} 
              onChange={e => setCurrentPost({...currentPost, excerpt: e.target.value})} 
              placeholder="짧은 요약 (글 리스트에 노출됩니다)" 
              rows={2}
            />
            <div className="border rounded-2xl overflow-hidden min-h-[400px]">
              <div ref={postEditorRef}></div>
            </div>
            <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-black shadow-xl shadow-gray-200 active:scale-95 transition-transform">
              {isEditing ? '변경사항 저장하기' : '포스트 발행하기'}
            </button>
          </form>
        </section>
      )}

      {activeTab === 'manage' && (
        <section className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black">발행된 포스트 ({posts.length})</h2>
            <button onClick={loadAllData} className="text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-black">Refresh Data</button>
          </div>
          
          <div className="bg-white border rounded-3xl overflow-hidden divide-y divide-gray-50">
            {posts.length === 0 ? (
              <div className="p-20 text-center text-gray-300 font-bold">작성된 글이 없습니다.</div>
            ) : (
              posts.map(p => (
                <div key={p.id} className="p-6 group hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0 pr-10">
                      <h4 className="font-bold text-sm truncate">{p.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{p.category} • {p.date}</p>
                        <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                        <div className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-400"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          <span className="text-[10px] font-black text-gray-900">{p.views || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4 shrink-0">
                      <button onClick={() => handleShowAnalytics(p.id)} className="text-xs font-black text-blue-500 hover:underline">통계</button>
                      <button onClick={() => startEditPost(p)} className="text-xs font-black text-black hover:underline">수정</button>
                      <button onClick={() => handleDeletePost(p.id)} className="text-xs font-black text-red-500 hover:underline">삭제</button>
                    </div>
                  </div>

                  {/* 해당 포스트의 분석 데이터가 선택되었을 때만 표시 */}
                  {selectedPostAnalytics && selectedPostAnalytics.length > 0 && selectedPostAnalytics[0]?.source && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 animate-in slide-in-from-top-2 duration-300">
                      <h5 className="text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest">Top Traffic Sources</h5>
                      <div className="space-y-2">
                        {selectedPostAnalytics.slice(0, 5).map((stat, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-gray-600 truncate max-w-[200px]">{stat.source}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-black rounded-full" 
                                  style={{ width: `${(stat.count / selectedPostAnalytics[0].count) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-[10px] font-black text-black min-w-[20px] text-right">{stat.count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {isAnalyzing && <div className="mt-2 text-[10px] font-bold text-gray-300 animate-pulse">분석 데이터를 불러오는 중...</div>}
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {activeTab === 'settings' && (
        <section className="bg-white border p-8 rounded-3xl space-y-8 animate-in fade-in duration-300">
          <h2 className="text-xl font-black">사이트 브랜딩 및 소개</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">브랜드 이름 (앞)</label>
              <input className="w-full px-4 py-3 bg-gray-50 border rounded-xl font-bold" value={settings.brandName} onChange={e => setSettings({...settings, brandName: e.target.value})} placeholder="김병준의" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">브랜드 이름 (뒤)</label>
              <input className="w-full px-4 py-3 bg-gray-50 border rounded-xl font-bold" value={settings.brandSubName} onChange={e => setSettings({...settings, brandSubName: e.target.value})} placeholder="블로그" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">메인 부제목</label>
            <input className="w-full px-4 py-3 bg-gray-50 border rounded-xl font-bold" value={settings.mainSubtitle} onChange={e => setSettings({...settings, mainSubtitle: e.target.value})} placeholder="암호화폐 및 개발 인사이트" />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 mb-4 block">소개(About) 페이지 내용</label>
            <div className="border rounded-2xl overflow-hidden min-h-[300px]">
              <div ref={aboutEditorRef}></div>
            </div>
          </div>

          <button onClick={handleSaveSettings} className="w-full bg-black text-white py-4 rounded-xl font-bold shadow-lg shadow-gray-200">사이트 설정 저장</button>
        </section>
      )}

      {activeTab === 'db' && (
        <section className="bg-white border p-8 rounded-3xl space-y-8 animate-in fade-in duration-300">
          <h2 className="text-xl font-black">Database Connection</h2>
          <div className="grid grid-cols-1 gap-6">
            <p className="text-xs text-gray-500 leading-relaxed">
              <strong>안내:</strong> 모든 기기 동기화를 위해 <code>constants.ts</code> 파일에도 동일한 정보를 입력하세요.
            </p>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Supabase URL</label>
              <input className="w-full px-4 py-3 bg-gray-50 border rounded-xl font-mono text-sm" value={settings.supabaseUrl || ''} onChange={e => setSettings({...settings, supabaseUrl: e.target.value})} placeholder="https://your-id.supabase.co" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Supabase Anon Key</label>
              <input className="w-full px-4 py-3 bg-gray-50 border rounded-xl font-mono text-sm" value={settings.supabaseKey || ''} onChange={e => setSettings({...settings, supabaseKey: e.target.value})} placeholder="eyJhbGci..." />
            </div>
            <button onClick={handleSaveSettings} className="w-full bg-black text-white py-4 rounded-xl font-bold">DB 설정 저장</button>
          </div>
        </section>
      )}

      {activeTab === 'ads' && (
        <section className="bg-white border p-8 rounded-3xl space-y-8 animate-in fade-in duration-300">
          <h2 className="text-xl font-black">Google AdSense 설정</h2>
          <div className="space-y-6">
            <div className="p-6 bg-gray-50 rounded-2xl space-y-4">
              <label className="text-[10px] font-black uppercase text-gray-500 block">Publisher ID</label>
              <input className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl font-mono text-sm" value={settings.adConfig?.clientId || ''} onChange={e => setSettings({...settings, adConfig: {...settings.adConfig, clientId: e.target.value}})} placeholder="ca-pub-1719886775143382" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-2xl space-y-3">
                <label className="text-[10px] font-black uppercase text-gray-400 block">메인 리스트 Slot</label>
                <input className="w-full px-4 py-2 bg-gray-50 rounded-lg text-sm font-bold" value={settings.adConfig?.mainPageSlot || ''} onChange={e => setSettings({...settings, adConfig: {...settings.adConfig, mainPageSlot: e.target.value}})} placeholder="1234567890" />
              </div>
              <div className="p-4 border rounded-2xl space-y-3">
                <label className="text-[10px] font-black uppercase text-gray-400 block">본문 상단 Slot</label>
                <input className="w-full px-4 py-2 bg-gray-50 rounded-lg text-sm font-bold" value={settings.adConfig?.postTopSlot || ''} onChange={e => setSettings({...settings, adConfig: {...settings.adConfig, postTopSlot: e.target.value}})} placeholder="2345678901" />
              </div>
              <div className="p-4 border rounded-2xl space-y-3">
                <label className="text-[10px] font-black uppercase text-gray-400 block">본문 하단 Slot</label>
                <input className="w-full px-4 py-2 bg-gray-50 rounded-lg text-sm font-bold" value={settings.adConfig?.postBottomSlot || ''} onChange={e => setSettings({...settings, adConfig: {...settings.adConfig, postBottomSlot: e.target.value}})} placeholder="3456789012" />
              </div>
            </div>
            <button onClick={handleSaveSettings} className="w-full bg-black text-white py-4 rounded-xl font-bold shadow-lg shadow-gray-200">광고 설정 저장</button>
          </div>
        </section>
      )}
    </div>
  );
};

export default Admin;
