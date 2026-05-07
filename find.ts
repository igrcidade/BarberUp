import { execSync } from 'child_process';
try {
  const log = execSync('git log -p -n 15 src/pages/Landing.tsx').toString();
  const rawData = execSync('git show HEAD~1:src/pages/Landing.tsx | grep -n -A 30 "const plans"').toString();
  console.log("OLD DATA:", rawData);
} catch (e) {
  console.error((e as Error).message);
}
