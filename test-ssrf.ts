const isInternalIP = (ip: string) => {
  const ipv4 = /^(127\.\d{1,3}\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|169\.254\.\d{1,3}\.\d{1,3}|0\.\d{1,3}\.\d{1,3}\.\d{1,3})$/;
  const ipv6 = /^(::1|fd[0-9a-f]{2}:.+|fe80::.+)$/i;
  return ipv4.test(ip) || ipv6.test(ip);
};

console.log(isInternalIP("127.0.0.1"));
console.log(isInternalIP("169.254.169.254"));
console.log(isInternalIP("10.0.0.1"));
console.log(isInternalIP("8.8.8.8"));
