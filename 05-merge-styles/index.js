const fs = require('fs');
const fsPr = require('fs/promises');
const path = require('path');
const { stdout } = process;
const write = fs.createWriteStream(path.join(__dirname, 'project-dist', 'bundle.css'), 'utf-8');

fsPr.readdir(path.join(__dirname, 'styles'), { withFileTypes: true })
  .then(data => data.forEach(el => {
    const ext = path.extname(path.join(__dirname, 'styles', el.name));
    if (el.isFile() && ext === '.css') {
      const read = fs.createReadStream(path.join(__dirname, 'styles', el.name));
      read.pipe(write);
    };
  }))
  .then(() => stdout.write('Styles are bundled!'))
  .catch(err => console.log(err.message));