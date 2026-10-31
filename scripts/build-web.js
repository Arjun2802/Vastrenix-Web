// Builds the hosted website into public/:
//   /          landing page        (site/)
//   /app/      store app           (www/)
//   /admin/    platform admin      (admin/)
//   /privacy/  privacy policy      (site/privacy/)
// Runs automatically before `firebase deploy` and as the Vercel build command.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = path.join(root, 'public');
const skip = (p) => /(^|[\\/])(\.|README|.*\.map$)/.test(path.basename(p));
fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(path.join(root, 'site'), out, { recursive: true, filter: (p) => !skip(p) });
fs.cpSync(path.join(root, 'www'), path.join(out, 'app'), { recursive: true, filter: (p) => !skip(p) });
fs.cpSync(path.join(root, 'admin'), path.join(out, 'admin'), { recursive: true, filter: (p) => !skip(p) });
console.log('Built public/  →  / landing,  /app/ store app,  /admin/ admin console,  /privacy/ policy');
