
import { BlogPost, SiteSettings } from './types';

// 클라우드 데이터베이스(Supabase) 설정
export const SUPABASE_CONFIG = {
  url: '', // Supabase에서 복사한 Project URL
  key: '', // Supabase에서 복사한 anon public key
};

export const INITIAL_POSTS: BlogPost[] = [
  {
    id: '1',
    title: '비트코인의 미래: L2 확장성 솔루션의 모든 것',
    excerpt: '비트코인은 단순한 가치 저장 수단을 넘어 진화하고 있습니다. Stacks와 Lightning Network 같은 최신 레이어 2 개발 현황을 살펴봅니다.',
    content: '<h1>비트코인 레이어 2의 진화</h1><p>비트코인은 오랫동안 제한된 처리량으로 비판을 받아왔습니다. 하지만 레이어 2 솔루션의 등장은 이 서사를 바꾸고 있습니다.</p><h3>L2가 중요한 이유</h3><p>대중화를 위해서는 확장이 필수적입니다. 확장이 없다면 상승장에서 수수료가 감당할 수 정도로 높아집니다.</p><ul><li>라이트닝 네트워크: 즉각적인 결제</li><li>Stacks: 스마트 컨트랙트 도입</li><li>Rootstock: 비트코인 기반 디파이</li></ul>',
    category: 'Crypto',
    author: '김병준',
    date: '2024-05-20',
    image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=800&q=80',
    slug: '비트코인의-미래-l2-확장성-솔루