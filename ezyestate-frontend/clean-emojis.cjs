const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist') {
        filelist = walkSync(dirFile, filelist);
      }
    } else if (dirFile.endsWith('.jsx')) {
      filelist.push(dirFile);
    }
  });
  return filelist;
};

const files = walkSync('d:/Work Hub/realestate/ezyestate-frontend/src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const replaced = content.replace(/[🏡📍🔍👋✨⭐]/g, '');
  if (content !== replaced) {
    fs.writeFileSync(file, replaced, 'utf8');
    console.log('Cleaned:', file);
  }
});
