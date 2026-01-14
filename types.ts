
export interface Comment {
  id: string;
  author: string;
  text: string;
  date: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  date: string;
  image: string;
  slug: string;
  tags: string[];
  views: number;
  comments: Comment[];
}

export interface AdConfig {
  clientId: string;
  mainPageSlot: string;
  postTopSlot: string;
  postBottomSlot: string;
}

export interface SiteSettings {
  siteUrl?: string; // 블로그 실제 도메인 주소
  brandName: string;
  brandSubName: string;
  mainTitle: string;
  mainSubtitle: string;
  adminPassword?: string;
  aboutContent?: string;
  categories: string[];
  socialLinks: {
    twitter: string;
    github: string;
    youtube: string;
    instagram: string;
  };
  adConfig: AdConfig;
  supabaseUrl?: string;
  supabaseKey?: string;
}