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

  return (
    <div className="min-h-screen flex flex-col bg-white selection:bg-blue-50 selection:text-blue-600">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold tracking-tighter text-gray-900 group">
            {settings.brandName}<span className="text-blue-600 transition-colors group-hover:text-black">{settings.brandSubName}</span>
          </Link>
          
          <nav className="flex items-center space-x-6">
            <Link 
              to="/admin" 
              className={`p-2 rounded-full transition-all ${
                location.pathname === '/admin' 
                ? 'text-blue-600' 
                : 'text-gray-300 hover:text-black'
              }`}
              title="관리자"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-grow max-w-3xl mx-auto w-full px-6 py-12">
        {children}
      </main>

      <footer className="py-20 bg-white mt-12">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-[11px] font-bold text-gray-900 tracking-widest uppercase mb-1">{settings.brandName}{settings.brandSubName}</p>
          <p className="text-[10px] text-gray-300 font-medium tracking-tight">© {new Date().getFullYear()} Minimal Insight Lab. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;