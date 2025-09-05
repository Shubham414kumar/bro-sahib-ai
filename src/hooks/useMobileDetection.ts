import { useState, useEffect } from 'react';

export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      
      // Check if mobile
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const mobile = mobileRegex.test(userAgent);
      setIsMobile(mobile);
      
      // Check for iOS
      const ios = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
      setIsIOS(ios);
      
      // Check for Android
      const android = /Android/.test(userAgent);
      setIsAndroid(android);
      
      // Check for Safari
      const safari = /^((?!chrome|android).)*safari/i.test(userAgent);
      setIsSafari(safari);
    };

    checkDevice();
    
    // Re-check on window resize
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { isMobile, isIOS, isAndroid, isSafari };
};