const fs = require('fs');
const fsPr = require('fs/promises');
const path = require('path');
const { stdout } = process;

fsPr.readdir(path.join(__dirname, 'secret-folder'), { withFileTypes: true })
  .then(data => data.forEach(el => {
    if (el.isFile()) {
      const ext = path.extname(path.join(__dirname, 'secret-folder', el.name));
      const trimmedExt = ext.slice(-(ext.length - 1));
      const name = path.basename(path.join(__dirname, 'secret-folder', el.name), ext);
      fs.stat(path.join(__dirname, 'secret-folder', el.name), (err, stats) => {
        if (err) throw err.message;
        stdout.write(`${name} - ${trimmedExt} - ${stats.size}\n`);
      });
    };
  }))
  .catch(err => console.log(err.message));
