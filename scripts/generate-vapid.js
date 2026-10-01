#!/usr/bin/env node
// Generates the key pair that lets the server send phone push notifications.
// Run once:  npm run vapid   - then paste the 3 lines into .env.local
const webpush = require("web-push");
const keys = webpush.generateVAPIDKeys();
console.log("\nAdd these lines to .env.local (and to your hosting provider's env settings):\n");
console.log("NEXT_PUBLIC_VAPID_PUBLIC_KEY=" + keys.publicKey);
console.log("VAPID_PRIVATE_KEY=" + keys.privateKey);
console.log("VAPID_SUBJECT=mailto:you@example.com\n");
console.log("Keep VAPID_PRIVATE_KEY secret. Restart `npm run dev` afterwards.\n");
