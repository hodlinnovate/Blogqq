
import React, { useState, useEffect } from 'react';
import { SiteSettings } from '../types';
import { DEFAULT_SETTINGS } from '../constants';
import { fetchSettingsFromCloud } from '../lib/db';
import SEO from '../components/SEO';
// @ts-ignore
import { marked } from 'https://esm.sh/marked@12.0.0';

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
        if (savedSettings) setSettings(JSON.parse(savedSettings));
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  if (isLoading) return <div className="py-20 text-center text-gray-300 font-bold animate-pulse">Loading...</div>;

  return (
    <div className="max-w-xl mx-auto py-12">
      <SEO title="소개" description={settings.mainSubtitle} />
      <header className="mb-16 text-center">
        <div className="inline-block px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">About Me</div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">지식의 기록, <br/>그리고 공유.</h1>
      </header>

      <div 
        className="prose prose-gray max-w-none text-gray-800 leading-relaxed text-[16px]"
        dangerouslySetInnerHTML={{ __html: marked.parse(settings.aboutContent || '') }}
      />
      
      <div className="mt-20 pt-12 border-t border-gray-100">
        <div className="bg-gray-50 p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-lg font-black text-gray-900">질문이나 제안이 있으신가요?</h3>
            <p className="text-sm text-gray-400 font-medium mt-1">함께 성장할 수 있는 모든 대화를 환영합니다.</p>
          </div>
          <a href="mailto:contact@byungjun.org" className="bg-black text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-gray-200">이메일 보내기</a>
        </div>
      </div>
    </div>
  );
};

export default About;
