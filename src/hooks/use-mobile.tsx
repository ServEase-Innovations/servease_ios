import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

// React Native uses different breakpoints - you can adjust these values
const MOBILE_BREAKPOINT = 768; // Width threshold for tablets vs phones
const TABLET_BREAKPOINT = 1024; // Optional: for larger tablets

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Initial check
    const { width } = Dimensions.get('window');
    setIsMobile(width < MOBILE_BREAKPOINT);

    // Handler for dimension changes (orientation changes)
    const handleChange = ({ window }: { window: ScaledSize }) => {
      setIsMobile(window.width < MOBILE_BREAKPOINT);
    };

    // Add event listener for dimension changes
    const subscription = Dimensions.addEventListener('change', handleChange);

    // Cleanup
    return () => {
      subscription.remove();
    };
  }, []);

  return isMobile;
}

// Optional: More comprehensive hook with additional info
export function useDeviceType(): { 
  isMobile: boolean; 
  isTablet: boolean;
  isLandscape: boolean;
  dimensions: { width: number; height: number };
} {
  const [deviceInfo, setDeviceInfo] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return {
      isMobile: width < MOBILE_BREAKPOINT,
      isTablet: width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT,
      isLandscape: width > height,
      dimensions: { width, height },
    };
  });

  useEffect(() => {
    const handleChange = ({ window }: { window: ScaledSize }) => {
      setDeviceInfo({
        isMobile: window.width < MOBILE_BREAKPOINT,
        isTablet: window.width >= MOBILE_BREAKPOINT && window.width < TABLET_BREAKPOINT,
        isLandscape: window.width > window.height,
        dimensions: { width: window.width, height: window.height },
      });
    };

    const subscription = Dimensions.addEventListener('change', handleChange);
    return () => subscription.remove();
  }, []);

  return deviceInfo;
}