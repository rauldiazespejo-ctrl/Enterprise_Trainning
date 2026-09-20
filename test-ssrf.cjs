const checkIp = (ip) => {
  if (ip.includes(':')) {
    const i = ip.toLowerCase();
    if (i === '::1' || i === '::' || i.startsWith('fc') || i.startsWith('fd') || i.startsWith('fe80') || i.startsWith('::ffff:')) {
      throw new Error('Blocked IPv6: ' + ip);
    }
  } else {
    if (/^127\.\d+\.\d+\.\d+$/.test(ip) || /^10\.\d+\.\d+\.\d+$/.test(ip) || /^0\.\d+\.\d+\.\d+$/.test(ip) || /^169\.254\.\d+\.\d+$/.test(ip) || /^192\.168\.\d+\.\d+$/.test(ip) || /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+$/.test(ip)) {
      throw new Error('Blocked IPv4: ' + ip);
    }
  }
};

const ips = ['127.0.0.1', '10.0.0.1', '192.168.1.1', '172.16.0.0', '172.31.255.255', '0.0.0.0', '169.254.169.254', '::1', 'fc00::1', 'fd00:ec2::254', 'fe80::1', '::ffff:127.0.0.1'];
ips.forEach(ip => {
  try { checkIp(ip); console.log('FAIL: Did not block', ip); }
  catch(e) { console.log('SUCCESS: Blocked', ip); }
});

const safe = ['8.8.8.8', '1.1.1.1', '172.32.0.1', '172.15.0.1', '192.169.1.1', '2001:4860:4860::8888'];
safe.forEach(ip => {
  try { checkIp(ip); console.log('SUCCESS: Allowed', ip); }
  catch(e) { console.log('FAIL: Blocked', ip); }
});
