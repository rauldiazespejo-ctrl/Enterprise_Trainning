// SSRF Validation Module
const PRIVATE_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./ // Blocks 0.0.0.0/8
];

const BLOCKED_HOSTNAMES = [
  'localhost',
  '.local',
  '[::1]',
  '::'
];

function isPrivateIp(ip: string): boolean {
  if (ip === '::1' || ip === '[::1]' || ip === '::') return true;
  for (const regex of PRIVATE_IP_RANGES) {
    if (regex.test(ip)) return true;
  }
  return false;
}

export async function validateUrlForSsrf(urlString: string): Promise<void> {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch (e) {
    throw new Error("URL inválida");
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error("Solo se permiten URLs HTTP y HTTPS");
  }

  const hostname = url.hostname.toLowerCase();

  // 1. String-based hostname checks
  if (BLOCKED_HOSTNAMES.some(b => hostname === b || hostname.endsWith(b))) {
    throw new Error("URL apunta a un host bloqueado");
  }

  if (isPrivateIp(hostname)) {
    throw new Error("URL apunta a una IP privada o local");
  }

  // 2. DNS Resolution checks (against DNS rebinding / nip.io)
  try {
    const addressesA = await Deno.resolveDns(hostname, 'A');
    for (const ip of addressesA) {
      if (isPrivateIp(ip)) {
        throw new Error("El dominio resuelve a una IP privada");
      }
    }
  } catch (e) {
    // If it fails to resolve A record, it might be valid if it's already an IP or AAAA exists
  }

  try {
    const addressesAAAA = await Deno.resolveDns(hostname, 'AAAA');
    for (const ip of addressesAAAA) {
       if (isPrivateIp(ip)) {
        throw new Error("El dominio resuelve a una IP privada");
      }
    }
  } catch (e) {
    // If it fails to resolve AAAA record, ignore.
  }
}
