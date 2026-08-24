import dns from 'dns/promises';

const mockDenoResolveDns = async (hostname, type) => {
  try {
    return await (type === 'A' ? dns.resolve4(hostname) : dns.resolve6(hostname));
  } catch (e) {
    throw new Error('DNS Error');
  }
};

const isPrivateIP = (ip) => {
  return /^(127\.|10\.|192\.168\.|169\.254\.|0\.|::1|\[::1\]|localhost)/.test(ip) ||
         ip.endsWith('.local') ||
         /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip);
};

const validateSSRF = async (urlStr) => {
  const u = new URL(urlStr);
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('Protocolo no permitido');
  if (isPrivateIP(u.hostname)) throw new Error('Destino no permitido');

  for (const recordType of ['A', 'AAAA']) {
    try {
      const ips = await mockDenoResolveDns(u.hostname, recordType);
      if (ips.some(isPrivateIP)) throw new Error('Destino no permitido');
    } catch (err) {
      if (err.message === 'Destino no permitido') throw err;
      // Ignorar errores de resolución DNS
    }
  }
  console.log(urlStr, 'OK');
};

const test = async () => {
  try { await validateSSRF('http://localhost:3000'); console.error('Failed localhost'); } catch(e) { console.log('localhost Blocked'); }
  try { await validateSSRF('http://127.0.0.1.nip.io'); console.error('Failed nip.io'); } catch(e) { console.log('nip.io Blocked'); }
  try { await validateSSRF('http://google.com'); } catch(e) { console.error('Google failed', e); }
};

test();
