export interface ParsedUserAgent {
  browser: string;
  os: string;
  deviceType: string;
}

export function parseUserAgent(ua: string | undefined): ParsedUserAgent {
  if (!ua) {
    return {
      browser: 'Unknown Browser',
      os: 'Unknown OS',
      deviceType: 'Desktop',
    };
  }

  const uaLower = ua.toLowerCase();
  
  // OS Detection
  let os = 'Unknown OS';
  if (uaLower.includes('windows')) {
    os = 'Windows';
  } else if (uaLower.includes('macintosh') || uaLower.includes('mac os x')) {
    os = 'macOS';
  } else if (uaLower.includes('android')) {
    os = 'Android';
  } else if (uaLower.includes('iphone') || uaLower.includes('ipad') || uaLower.includes('ipod')) {
    os = 'iOS';
  } else if (uaLower.includes('linux')) {
    os = 'Linux';
  }

  // Device Type Detection
  let deviceType = 'Desktop';
  if (uaLower.includes('ipad')) {
    deviceType = 'Tablet';
  } else if (uaLower.includes('mobile') || uaLower.includes('android') || uaLower.includes('iphone') || uaLower.includes('ipod')) {
    deviceType = 'Mobile';
  }

  // Browser Detection
  let browser = 'Unknown Browser';
  if (uaLower.includes('edg/')) {
    browser = 'Edge';
  } else if (uaLower.includes('opr/') || uaLower.includes('opera')) {
    browser = 'Opera';
  } else if (uaLower.includes('chrome') && !uaLower.includes('chromium')) {
    browser = 'Chrome';
  } else if (uaLower.includes('safari') && !uaLower.includes('chrome') && !uaLower.includes('chromium')) {
    browser = 'Safari';
  } else if (uaLower.includes('firefox')) {
    browser = 'Firefox';
  } else if (uaLower.includes('trident') || uaLower.includes('msie')) {
    browser = 'Internet Explorer';
  }

  return { browser, os, deviceType };
}
