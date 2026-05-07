const { execSync } = require('child_process');
try {
  const log = execSync('git log -p -n 10 src/pages/Landing.tsx').toString();
  const prices = log.split('\n').filter(line => line.includes('price:'));
  console.log(prices);
} catch (e) {
  console.error(e.message);
}
