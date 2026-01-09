
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SiteSettings } from '../types';
import { DEFAULT_SETTINGS } from '../constants';
import { fetchSettingsFromCloud } from '../lib/db';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const location = useLocation();

  useEffect(() => {
    const loadSettings = async () => {
      const cloudSettings = await fetchSettingsFromCloud();
      if (cloudSettings) {
        setSettings(prev => ({ ...prev, ...cloudSettings }));
      } else {
        const savedSettings = localStorage.getItem('crypto_site_settings');
        if (savedSettings) setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
      }
    };
    loadSettings();
    setIsMenuOpen(false);
  }, [location.pathname]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="min-h-screen flex flex-col bg-white selection:bg-gray-100 selection:text-black font-sans">
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm z-[60]" onClick={toggleMenu} />
      )}

      <div className={`fixed top-0 left-0 h-full w-72 bg-white z-[70] shadow-2xl transition-transform duration-300 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 h-full flex flex-col overflow-y-auto">
          <div className="flex justify-between items-center mb-10">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">Menu</span>
            <button onClick={toggleMenu} className="p-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          
          <nav className="flex flex-col space-y-8">
            <div className="flex flex-col space-y-3">
              <Link to="/" className="text-2xl font-black text-gray-900 tracking-tighter hover:text-gray-400 transition-colors">전체 글 보기</Link>
              <Link to="/about" className="text-2xl font-black text-gray-900 tracking-tighter hover:text-gray-400 transition-colors">소개</Link>
            </div>

            <div className="pt-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 mb-6">Topics</h3>
              <div className="flex flex-col space-y-4">
                {(settings.categories || []).map((cat) => (
                  <Link key={cat} to={`/category/${cat}`} className="text-lg font-bold text-gray-800 hover:text-black transition-colors flex items-center group">
                    <span className="w-1.5 h-1.5 bg-gray-200 rounded-full mr-3 group-hover:bg-black transition-colors"></span>
                    {cat}
                  </Link>
                ))}
              </div>
            </div>

            <Link to="/admin" className="text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-black transition-colors pt-12">Settings</Link>
          </nav>
        </div>
      </div>

      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-50">
        <div className="max-w-3xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={toggleMenu} className="p-2 -ml-2 group">
              <div className="space-y-1.5">
                <div className="w-5 h-0.5 bg-black"></div>
                <div className="w-6 h-0.5 bg-black"></div>
                <div className="w-4 h-0.5 bg-black group-hover:w-6 transition-all"></div>
              </div>
            </button>
            <Link to="/" className="text-lg font-bold tracking-tighter text-gray-900">
              {settings.brandName} <span className="text-black">{settings.brandSubName}</span>
            </Link>
          </div>
          <Link to="/about" className="text-sm font-bold text-gray-400 hover:text-black transition-colors">About</Link>
        </div>
      </header>

      <main className="flex-grow max-w-3xl mx-auto w-full px-6 py-12">{children}</main>

      <footer className="py-20 bg-white border-t border-gray-50 mt-12 text-center">
        <p className="text-[11px] font-black uppercase tracking-widest text-gray-900">{settings.brandName} {settings.brandSubName}</p>
        <p className="text-[10px] text-gray-300 font-bold mt-1">© {new Date().getFullYear()} Minimal Insight Lab.</p>
      </footer>
    </div>
  );
};

export default Layout;
