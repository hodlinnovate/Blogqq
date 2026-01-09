
import React, { useEffect } from 'react';
import { ADSENSE_CONFIG } from '../constants';

interface AdSenseProps {
  slot: string;
  className?: string;
}

const AdSense: React.FC<AdSenseProps> = ({ slot, className = "" }) => {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense Error:", e);
    }
  }, []);

  return (
    <div className={`my-8 overflow-hidden bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center justify-center min-h-[120px] ${className}`}>
      <div className="w-full px-4 py-2 border-b border-gray-100 flex justify-between items-center">
        <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">ADVERTISEMENT</span>
      </div>
      <div className="p-4 w-full flex justify-center">
        <ins className="adsbygoogle"
             style={{ display: 'block' }}
             data-ad-client={ADSENSE_CONFIG.clientId}
             data-ad-slot={slot}
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
      </div>
    </div>
  );
};

export default AdSense;
