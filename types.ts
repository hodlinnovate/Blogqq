
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
  category: 'Crypto' | 'Coding' | 'Finance' | 'Market';
  author: string;
  date: string;
  image: string;
  slug: string;
  tags: string[];
  views: number;
  comments: Comment[];
}

export interface SiteSettings {
  brandName: string;
  brandSubName: string;
  mainTitle: string;
  mainSubtitle: string;
  adminPassword?: string;
  socialLinks: {
    twitter: string;
    github: string;
    youtube: string;
    instagram: string;
  };
  supabaseUrl?: string; // 클라우드 DB 주소
  supabaseKey?: string; // 클라우드 DB 키
}

export interface AdConfig {
  clientId: string;
  slots: {
    mainPage: string;
    postContentTop: string;
    postContentBottom: string;
  };
}
