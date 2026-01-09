
import { BlogPost, SiteSettings } from './types';

// 클라우드 데이터베이스(Supabase) 설정
export const SUPABASE_CONFIG = {
  url: '', // Supabase에서 복사한 Project URL
  key: '', // Supabase에서 복사한 anon public key
};

export const INITIAL_POSTS: BlogPost[] = [
  {
    id: "1",
    title: "비트코인의 미래: L2 확장성 솔루션의 모든 것",
    excerpt: "비트코인은 단순한 가치 저장 수단을 넘어 진화하고 있습니다. Stacks와 Lightning Network 같은 최신 레이어 2 개발 현황을 살펴봅니다.",
    content: `<h1>비트코인 레이어 2의 진화</h1><p>비트코인은 오랫동안 제한된 처리량으로 비판을 받아왔습니다. 하지만 레이어 2 솔루션의 등장은 이 서사를 바꾸고 있습니다.</p><h3>L2가 중요한 이유</h3><p>대중화를 위해서는 확장이 필수적입니다. 확장이 없다면 상승장에서 수수료가 감당할 수 정도로 높아집니다.</p><ul><li>라이트닝 네트워크: 즉각적인 결제</li><li>Stacks: 스마트 컨트랙트 도입</li><li>Rootstock: 비트코인 기반 디파이</li></ul>`,
    category: "Crypto",
    author: "김병준",
    date: "2024-05-20",
    image: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=800&q=80",
    slug: "bitcoin-l2-solutions-future",
    tags: ["비트코인", "레이어2", "블록체인"],
    views: 1240,
    comments: []
  }
];

export const DEFAULT_SETTINGS: SiteSettings = {
  brandName: "김병준의",
  brandSubName: "블로그",
  mainTitle: "김병준의 기술 및 금융 인사이트",
  mainSubtitle: "암호화폐, 블록체인 개발 및 글로벌 경제에 대한 기록.",
  adminPassword: "Ilikekimchi!",
  aboutContent: `<h1>안녕하세요, 김병준입니다.</h1><p>이 블로그는 암호화폐 시장의 흐름과 블록체인 기술, 그리고 프론트엔드 개발에 대한 저의 통찰을 기록하는 공간입니다.</p>`,
  categories: ["Crypto", "Coding", "Finance", "Market"],
  socialLinks: {
    twitter: "",
    github: "",
    youtube: "",
    instagram: ""
  },
  adConfig: {
    clientId: "ca-pub-XXXXXXXXXXXXXXXX",
    mainPageSlot: "1234567890",
    postTopSlot: "2345678901",
    postBottomSlot: "3456789012"
  }
};

export const SITE_CONFIG = {
  name: "김병준의 블로그",
  description: "암호화폐, 블록체인 코딩, 글로벌 금융에 대한 김병준의 개인 기술 블로그입니다.",
  baseUrl: "https://blog.byungjun.org", 
  keywords: "김병준, 비트코인, 이더리움, 코인 코딩, 리액트 웹3, 금융 분석, 블록체인 개발, 재테크",
};
