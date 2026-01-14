
import React, { useState, useEffect } from 'react';
import { SiteSettings } from '../types';
import { DEFAULT_SETTINGS } from '../constants';
import { fetchSettingsFromCloud } from '../lib/db';
import SEO from '../components/SEO';

const About: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const cloudSettings = await fetchSettingsFromCloud();
      if (cloudSettings) {
        setSettings(prev => ({ ...prev, ...cloudSettings }));
      } else {
        const savedSettings = localStorage.getItem('crypto_site_settings');
        if (savedSettings) setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  if (isLoading) return <div className="py-20 text-center text-gray-300 font-bold animate-pulse">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto py-12 md:py-20">
      <SEO 
        title="소개" 
        description={settings.mainSubtitle} 
        url={`${window.location.origin}/about`}
      />
      <header className="mb-20 text-center">
        <div className="inline-block px-4 py-1.5 bg-gray-100 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">About Me</div>
        <h1 className="text-4xl md:text-7xl font-black text-gray-900 tracking-tight leading-[1.1]">지식의 기록, <br/>그리고 성장의 공유.</h1>
      </header>

      <div 
        className="prose prose-gray max-w-none text-gray-800 leading-[1.8] text-[18px] md:text-[22px]"
        dangerouslySetInnerHTML={{ __html: settings.aboutContent || '' }}
      />
      
      <div className="mt-24 pt-16 border-t border-gray-100">
        <div className="bg-gray-50 p-10 md:p-14 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="text-center md:text-left">
            <h3 className="text-3xl font-black text-gray-900">함께 고민하고 계신가요?</h3>
            <p className="text-lg text-gray-400 font-medium mt-2">함께 성장할 수 있는 모든 대화를 진심으로 환영합니다.</p>
          </div>
          <a href="mailto:contact@byungjun.org" className="bg-black text-white px-12 py-5 rounded-2xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-gray-200 active:scale-95">이메일 보내기</a>
        </div>
      </div>
    </div>
  );
};

export default About;
