
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BlogPost, SiteSettings } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const location = useLocation();

  useEffect(() => {
    const savedPosts = localStorage.getItem('crypto_blog_posts');
    if (savedPosts) setPosts(JSON.parse(savedPosts));

    const savedSettings = localStorage.getItem('crypto_site_settings');
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, [location.pathname]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const categories = Array.from(new Set(posts.map(post => post.category)));

  const SocialIcons = {
    twitter: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
    ),
    github: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
    ),
    youtube: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
    ),
    instagram: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
    )
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleMenu}
              className="p-2 -ml-2 hover:bg-gray-50 rounded-lg transition-colors"
              aria-label="Menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
            <Link to="/" className="text-xl font-bold tracking-tight text-gray-900">
              {settings.brandName}<span className="text-blue-600">{settings.brandSubName}</span>
            </Link>
          </div>
          
          <nav className="flex items-center space-x-2 md:space-x-6">
            <Link to="/" className="hidden md:block text-sm font-medium text-gray-500 hover:text-black transition-colors">홈</Link>
            <Link 
              to="/admin" 
              className={`flex items-center space-x-1 px-3 py-1.5 md:px-4 md:py-2 rounded-full border text-sm font-bold transition-all ${
                location.pathname === '/admin' 
                ? 'bg-blue-600 border-blue-600 text-white' 
                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-900'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
              <span className="hidden xs:inline">관리자</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Sidebar Drawer */}
      <div className={`fixed inset-0 z-[60] transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={toggleMenu} />
        <aside className={`absolute top-0 left-0 w-80 h-full bg-white shadow-2xl transition-transform duration-300 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <span className="text-lg font-bold text-gray-900">메뉴</span>
              <button onClick={toggleMenu} className="p-2 hover:bg-gray-50 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto space-y-8">
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">기본 메뉴</h3>
                <div className="space-y-1">
                  <Link to="/" onClick={toggleMenu} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    <span>홈으로</span>
                  </Link>
                  <Link to="/admin" onClick={toggleMenu} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-blue-50 text-blue-600 transition-colors font-bold">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                    <span>관리 대시보드</span>
                  </Link>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">주제별 보기</h3>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map(cat => (
                    <Link 
                      key={cat} 
                      to={`/category/${cat}`}
                      onClick={toggleMenu}
                      className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors text-center"
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">최신 포스트</h3>
                <div className="space-y-1">
                  {posts.slice(0, 5).map(post => (
                    <Link 
                      key={post.id} 
                      to={`/post/${post.slug}`} 
                      onClick={toggleMenu}
                      className="block p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <span className="text-xs text-blue-500 font-bold uppercase mb-1 block">{post.category}</span>
                      <span className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 line-clamp-1">{post.title}</span>
                    </Link>
                  ))}
                </div>
              </section>
            </div>

            <div className="mt-auto pt-6 border-t border-gray-100 flex items-center justify-center space-x-2">
              {settings.socialLinks.twitter && (
                <a href={settings.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-blue-400 transition-colors">
                  {SocialIcons.twitter}
                </a>
              )}
              {settings.socialLinks.github && (
                <a href={settings.socialLinks.github} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-black transition-colors">
                  {SocialIcons.github}
                </a>
              )}
              {settings.socialLinks.youtube && (
                <a href={settings.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                  {SocialIcons.youtube}
                </a>
              )}
              {settings.socialLinks.instagram && (
                <a href={settings.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-pink-600 transition-colors">
                  {SocialIcons.instagram}
                </a>
              )}
            </div>
          </div>
        </aside>
      </div>

      <main className="flex-grow max-w-4xl mx-auto w-full px-6 py-12">
        {children}
      </main>

      <footer className="border-t border-gray-100 py-16 bg-gray-50 mt-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex justify-center items-center space-x-6 mb-8">
            {settings.socialLinks.twitter && (
              <a href={settings.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors" title="Twitter">
                {SocialIcons.twitter}
              </a>
            )}
            {settings.socialLinks.github && (
              <a href={settings.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black transition-colors" title="GitHub">
                {SocialIcons.github}
              </a>
            )}
            {settings.socialLinks.youtube && (
              <a href={settings.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-600 transition-colors" title="YouTube">
                {SocialIcons.youtube}
              </a>
            )}
            {settings.socialLinks.instagram && (
              <a href={settings.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-600 transition-colors" title="Instagram">
                {SocialIcons.instagram}
              </a>
            )}
          </div>
          <p className="text-sm font-bold text-gray-900 tracking-tight">{settings.brandName}{settings.brandSubName}</p>
          <p className="text-xs text-gray-400 mt-2 font-medium tracking-wide italic">© {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
