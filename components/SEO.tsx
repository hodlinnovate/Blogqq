
import React, { useEffect } from 'react';
import { SITE_CONFIG } from '../constants';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  article?: boolean;
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  keywords, 
  image, 
  url,
  article 
}) => {
  const seoTitle = title ? `${title} | ${SITE_CONFIG.name}` : SITE_CONFIG.name;
  const seoDescription = description || SITE_CONFIG.description;
  const seoKeywords = keywords || SITE_CONFIG.keywords;
  const seoImage = image || 'https://picsum.photos/seed/crypto/1200/630';
  // URL이 명시되지 않은 경우 현재 브라우저의 주소를 사용
  const seoUrl = url || window.location.href;

  useEffect(() => {
    document.title = seoTitle;
    
    const updateMeta = (name: string, content: string, property = false) => {
      let element = document.querySelector(`meta[${property ? 'property' : 'name'}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(property ? 'property' : 'name', name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // [중요] Canonical URL(표준 페이지 주소) 설정
    // 구글 검색 엔진이 중복 페이지로 인식하지 않도록 현재 페이지가 원본임을 명시
    const updateCanonical = (href: string) => {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };

    updateMeta('description', seoDescription);
    updateMeta('keywords', seoKeywords);
    
    // Open Graph
    updateMeta('og:title', seoTitle, true);
    updateMeta('og:description', seoDescription, true);
    updateMeta('og:image', seoImage, true);
    updateMeta('og:url', seoUrl, true);
    updateMeta('og:type', article ? 'article' : 'website', true);

    // Twitter
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', seoTitle);
    updateMeta('twitter:description', seoDescription);
    updateMeta('twitter:image', seoImage);

    // Canonical Tag 적용
    updateCanonical(seoUrl);

  }, [seoTitle, seoDescription, seoKeywords, seoImage, seoUrl, article]);

  return null; // This component doesn't render anything
};

export default SEO;
