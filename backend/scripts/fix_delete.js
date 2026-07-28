const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'src', 'models');

fs.readdirSync(modelsDir).forEach(file => {
  if (file.endsWith('.js')) {
    const filePath = path.join(modelsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    if (content.includes('const delete =')) {
      content = content.replace(/const delete =/g, 'const deleteData =');
      content = content.replace(/delete(\s*\}|\s*,)/g, 'delete: deleteData$1');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed delete keyword in ${file}`);
    }
  }
});
console.log("Fixing complete.");
