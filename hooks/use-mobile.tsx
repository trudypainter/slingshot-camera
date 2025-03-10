import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined
  );

  React.useEffect(() => {
    // Check for mobile device based on screen size
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const onChange = () => {
      const isMobileBySize = window.innerWidth < MOBILE_BREAKPOINT;

      // Also check for mobile device based on user agent
      const isMobileByUserAgent =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );

      // Consider it mobile if either condition is true
      const newIsMobile = isMobileBySize || isMobileByUserAgent;

      console.log("📱 useIsMobile hook:");
      console.log(`  - Window width: ${window.innerWidth}px`);
      console.log(`  - Mobile by size: ${isMobileBySize}`);
      console.log(`  - User agent: ${navigator.userAgent}`);
      console.log(`  - Mobile by user agent: ${isMobileByUserAgent}`);
      console.log(`  - Final isMobile value: ${newIsMobile}`);

      setIsMobile(newIsMobile);
    };

    mql.addEventListener("change", onChange);
    onChange(); // Call immediately to set initial value

    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
