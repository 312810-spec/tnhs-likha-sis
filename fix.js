const fs=require('fs');
const p='src/components/stakeholder/StakeholderPortal.tsx';
let s=fs.readFileSync(p);
s=s.toString('utf8');
fs.writeFileSync(p, s);
console.log('fixed', s.length);
