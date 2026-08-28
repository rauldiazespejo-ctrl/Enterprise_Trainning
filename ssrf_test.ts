const isSafeUrl = (urlString: string): boolean => {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }
    const hostname = url.hostname.toLowerCase();

    if (
      hostname === 'localhost' ||
      hostname.endsWith('.local') ||
      hostname === '[::1]' ||
      hostname === '[::]' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('169.254.') ||
      hostname.startsWith('0.')
    ) {
      return false;
    }

    if (hostname.startsWith('172.')) {
      const secondOctet = parseInt(hostname.split('.')[1], 10);
      if (secondOctet >= 16 && secondOctet <= 31) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
};

console.log(isSafeUrl("http://localhost")); // false
console.log(isSafeUrl("http://127.0.0.1")); // false
console.log(isSafeUrl("http://169.254.169.254")); // false
console.log(isSafeUrl("http://example.com")); // true
console.log(isSafeUrl("http://172.16.0.1")); // false
console.log(isSafeUrl("http://172.31.255.255")); // false
console.log(isSafeUrl("http://172.32.0.1")); // true
