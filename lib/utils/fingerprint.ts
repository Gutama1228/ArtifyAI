/**
 * Generate device fingerprint for anti-abuse tracking
 * Combines multiple device characteristics to create unique identifier
 */

export interface DeviceFingerprint {
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  colorDepth: number;
  hardwareConcurrency: number;
  deviceMemory?: number;
  canvasFingerprint?: string;
  webglFingerprint?: string;
}

export async function generateDeviceFingerprint(): Promise<string> {
  const fingerprint: DeviceFingerprint = {
    userAgent: navigator.userAgent,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    colorDepth: screen.colorDepth,
    hardwareConcurrency: navigator.hardwareConcurrency,
  };

  // Add device memory if available
  if ('deviceMemory' in navigator) {
    fingerprint.deviceMemory = (navigator as any).deviceMemory;
  }

  // Canvas fingerprinting
  try {
    fingerprint.canvasFingerprint = await getCanvasFingerprint();
  } catch (e) {
    console.error('Canvas fingerprint failed:', e);
  }

  // WebGL fingerprinting
  try {
    fingerprint.webglFingerprint = getWebGLFingerprint();
  } catch (e) {
    console.error('WebGL fingerprint failed:', e);
  }

  // Create hash from fingerprint data
  const fingerprintString = JSON.stringify(fingerprint);
  const hash = await hashString(fingerprintString);
  
  return hash;
}

async function getCanvasFingerprint(): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';

  canvas.width = 200;
  canvas.height = 50;

  // Draw text with various styles
  ctx.textBaseline = 'top';
  ctx.font = '14px "Arial"';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#f60';
  ctx.fillRect(125, 1, 62, 20);
  ctx.fillStyle = '#069';
  ctx.fillText('ArtifyAI 🎨', 2, 15);
  ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
  ctx.fillText('Canvas Fingerprint', 4, 17);

  return canvas.toDataURL();
}

function getWebGLFingerprint(): string {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) return '';

  const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
  if (!debugInfo) return '';

  const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
  const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

  return `${vendor}~${renderer}`;
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Send device fingerprint to server for tracking
 */
export async function trackDeviceFingerprint(userId: string): Promise<void> {
  try {
    const fingerprint = await generateDeviceFingerprint();
    
    await fetch('/api/auth/device-fingerprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        fingerprint,
        metadata: {
          userAgent: navigator.userAgent,
          screenResolution: `${screen.width}x${screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language,
          platform: navigator.platform,
        },
      }),
    });
  } catch (error) {
    console.error('Failed to track device fingerprint:', error);
  }
        }
