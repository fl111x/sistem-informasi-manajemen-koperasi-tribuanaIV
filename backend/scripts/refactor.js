const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'src', 'models');

fs.readdirSync(modelsDir).forEach(file => {
  if (file.endsWith('.js')) {
    const filePath = path.join(modelsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Extract class name
    const classMatch = content.match(/class (\w+)\s*\{/);
    if (!classMatch) return; // not a class file

    const className = classMatch[1];

    // Replace static async methods with const arrows
    // We match `static async funcName(args) {`
    // And we need to collect the function names
    const funcs = [];
    content = content.replace(/static async (\w+)\((.*?)\)\s*\{/g, (match, p1, p2) => {
      funcs.push(p1);
      return `const ${p1} = async (${p2}) => {`;
    });
    
    // Replace class declaration
    content = content.replace(/class \w+\s*\{/, '');

    // Replace the closing brace of the class which is right before module.exports
    content = content.replace(/\}\s*module\.exports\s*=\s*\w+;/, `\nmodule.exports = {\n  ${funcs.join(',\n  ')}\n};`);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Refactored ${file}`);
  }
});
console.log("Refactoring complete.");
