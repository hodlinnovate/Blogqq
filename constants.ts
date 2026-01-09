
import { BlogPost, SiteSettings } from './types';

export const INITIAL_POSTS: BlogPost[] = [
  {
    id: '1',
    title: '비트코인의 미래: L2 확장성 솔루션의 모든 것',
    excerpt: '비트코인은 단순한 가치 저장 수단을 넘어 진화하고 있습니다. Stacks와 Lightning Network 같은 최신 레이어 2 개발 현황을 살펴봅니다.',
    content: '비트코인은 오랫동안 제한된 처리량으로 비판을 받아왔습니다. 하지만 레이어 2 솔루션의 등장은 이 서사를 바꾸고 있습니다.\n\n### L2가 중요한 이유\n대중화를 위해서는 확장이 필수적입니다. 확장이 없다면 상승장에서 수수료가 감당할 수 정도로 높아집니다. 현재 개발의 초점은 보안을 유지하면서 유틸리티를 높이는 데 있습니다.\n\n* **라이트닝 네트워크**: 즉각적인 결제\n* **Stacks**: 스마트 컨트랙트 도입\n* **Rootstock**: 비트코인 기반 디파이\n\n### 개발자 관점\n비트코인 위에서 개발하려면 Script와 UTXO 모델에 대한 이해가 필요합니다. 하지만 최근 현대적인 도구들이 출시되면서 기존 웹 개발자들도 쉽게 접근할 수 있게 되었습니다.',
    category: 'Crypto',
    author: '김병준',
    date: '2024-05-20',
    image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=800&q=80',
    slug: '비트코인의-미래-l2-확장성-솔루션',
    tags: ['비트코인', '레이어2', '블록체인'],
    views: 1240,
    comments: []
  },
  {
    id: '2',
    title: '크립토 대시보드를 위한 React 19 가이드',
    excerpt: '최신 React 기능과 동시성 렌더링을 사용하여 고성능 실시간 크립토 대시보드를 구축하는 방법.',
    content: '크립토 대시보드는 고주파 데이터 업데이트를 처리해야 합니다. React 19는 이를 더 매끄럽게 만드는 몇 가지 최적화 기능을 도입했습니다.\n\n### React 19 주요 기능\n1. **useTransition**: UI 블로킹 없는 상태 업데이트\n2. **Actions**: 비동기 데이터 처리 간소화\n3. **New Hooks**: 최적화된 렌더링 성능\n\n시장 변동성이 극심한 상황에서도 UI 반응성을 유지하는 방법을 알아봅니다.',
    category: 'Coding',
    author: '김병준',
    date: '2024-05-18',
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80',
    slug: 'react-19-크립토-대시보드-가이드',
    tags: ['리액트', '프론트엔드', '웹3'],
    views: 856,
    comments: []
  }
];

export const DEFAULT_SETTINGS: SiteSettings = {
  brandName: '김병준의',
  brandSubName: '블로그',
  mainTitle: '김병준의 기술 및 금융 인사이트',
  mainSubtitle: '암호화폐, 블록체인 개발 및 글로벌 경제에 대한 기록.',
  adminPassword: 'Ilikekimchi!',
  aboutContent: '# 안녕하세요, 김병준입니다.\n\n이 블로그는 암호화폐 시장의 흐름과 블록체인 기술, 그리고 프론트엔드 개발에 대한 저의 통찰을 기록하는 공간입니다.\n\n미니멀한 디자인을 통해 오직 콘텐츠 본질에 집중할 수 있는 환경을 지향합니다.',
  categories: ['Crypto', 'Coding', 'Finance', 'Market'],
  socialLinks: {
    twitter: '',
    github: '',
    youtube: '',
    instagram: ''
  },
  adConfig: {
    clientId: 'ca-pub-XXXXXXXXXXXXXXXX',
    mainPageSlot: '1234567890',
    postTopSlot: '2345678901',
    postBottomSlot: '3456789012'
  }
};

export const SITE_CONFIG = {
  name: '김병준의 블로그',
  description: '암호화폐, 블록체인 코딩, 글로벌 금융에 대한 김병준의 개인 기술 블로그입니다.',
  baseUrl: 'https://blog.byungjun.org',
  keywords: '김병준, 비트코인, 이더리움, 코인 코딩, 리액트 웹3, 금융 분석, 블록체인 개발, 재테크',
};
