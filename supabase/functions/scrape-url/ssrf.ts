export const isForbiddenIp = (ip: string): boolean => {
  // IPv4 checks
  if (ip === 'localhost' || ip === '0.0.0.0') return true;
  if (/^127\.\d+\.\d+\.\d+$/.test(ip)) return true;
  if (/^10\.\d+\.\d+\.\d+$/.test(ip)) return true;
  if (/^192\.168\.\d+\.\d+$/.test(ip)) return true;
  if (/^169\.254\.\d+\.\d+$/.test(ip)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+$/.test(ip)) return true;

  // IPv6 checks
  if (ip.includes(':')) {
    const cleanIp = ip.replace(/^\[|\]$/g, '').toLowerCase();
    if (cleanIp === '::1' || cleanIp === '::') return true;
    if (cleanIp.startsWith('fc') || cleanIp.startsWith('fd')) return true;
    if (cleanIp.startsWith('fe80')) return true;
    if (cleanIp.startsWith('::ffff:')) return true;
    if (cleanIp.includes('fd00:ec2::254')) return true;
  }

  return false;
};

export const resolveAndCheckDns = async (hostname: string): Promise<void> => {
  // Check if it's already an IP address
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname) || hostname.includes(':')) {
    if (isForbiddenIp(hostname)) {
      throw new Error("SSRF Protection: Forbidden IP address");
    }
    return;
  }

  const ips: string[] = [];

  // Note: inherent TOCTOU limitation using Deno.resolveDns with standard fetch
  try {
    const aRecords = await Deno.resolveDns(hostname, 'A');
    ips.push(...aRecords);
  } catch (error: any) {
    if (error.name !== 'NotFound' && error.name !== 'NotSupported') {
      throw error;
    }
  }

  try {
    const aaaaRecords = await Deno.resolveDns(hostname, 'AAAA');
    ips.push(...aaaaRecords);
  } catch (error: any) {
    if (error.name !== 'NotFound' && error.name !== 'NotSupported') {
      throw error;
    }
  }

  for (const ip of ips) {
    if (isForbiddenIp(ip)) {
      throw new Error(`SSRF Protection: Hostname resolves to forbidden IP`);
    }
  }
};

export const safeFetch = async (urlStr: string, options: RequestInit = {}): Promise<Response> => {
  let currentUrl = urlStr;
  let maxRedirects = 5;

  while (maxRedirects > 0) {
    const parsedUrl = new URL(currentUrl);

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error("SSRF Protection: Invalid protocol");
    }

    await resolveAndCheckDns(parsedUrl.hostname);

    const response = await fetch(currentUrl, {
      ...options,
      redirect: 'manual'
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (location) {
        response.body?.cancel();
        currentUrl = new URL(location, currentUrl).toString();
        maxRedirects--;
        continue;
      }
    }

    return response;
  }

  throw new Error("SSRF Protection: Too many redirects");
};
