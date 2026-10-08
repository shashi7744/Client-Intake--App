const os = require("os");

// Let phones on the same Wi-Fi open the dev server via this PC's network IP
// (e.g. http://192.168.0.106:3000). Next.js blocks dev resources from other
// hosts by default; the IP changes per network, so read it at startup.
const lanIps = Object.values(os.networkInterfaces())
  .flat()
  .filter((i) => i && i.family === "IPv4" && !i.internal)
  .map((i) => i.address);

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: lanIps,
};

module.exports = nextConfig;
