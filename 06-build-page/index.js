const fs = require('fs');
const fsPr = require('fs/promises');
const path = require('path');
const readline = require('readline');
const { stdout } = process;

const buildProject = (distName) => {
  const root = __dirname;
  const dist = path.join(root, distName);
  const components = [];
  const compList = [];

  const copyDir = (origin, copy, onEnd) => {
    const root = __dirname;
    const folderNames = [origin];
    const copyFolderNames = [copy, 'assets'];
    
    const copyItem = (item, folderNames, copyFolderNames, onCopy) => {
      fsPr.copyFile(path.join(root, ...folderNames, item.name), path.join(root, ...copyFolderNames, item.name))
        .catch(err => console.log(err.message));
      onCopy();
    }
  
    const iterateFolder = (arr, folderNames, copyFolderNames, onEnd) => {
      const array = [...arr].reverse();
  
      const copyFile = (current, onCopy) => {
        if (current.isFile()) {
          copyItem(current, folderNames, copyFolderNames, onCopy)
        }
        if (current.isDirectory()) {
          const originPath = [...folderNames, current.name];
          const copyPath = [...copyFolderNames, current.name];
          fsPr.mkdir(path.join(root, ...copyPath), { recursive: true })
            .then(() => copyFolder(originPath, copyPath, onCopy))
            .catch(err => console.log(err.message));
        }
      }
  
      const copyDirectory = (arr, onEnd) => {
        if (arr.length) {
          const current = arr.pop();
          copyFile(current, () => copyDirectory(arr, onEnd));
        } else {
          onEnd();
        }
      }
      copyDirectory(array, onEnd);
    }
    
    const copyFolder = (folderNames, copyFolderNames, onEnd) => {
      fsPr.readdir(path.join(root, ...folderNames), { withFileTypes: true })
      .then(data => {
        const files = data;
        iterateFolder(files, folderNames, copyFolderNames, onEnd);
      }).catch(err => console.log(err.message));
    }
  
    fsPr.mkdir(path.join(__dirname, ...copyFolderNames), { recursive: true })
      .then(result => {
        if (result) {
          copyFolder(folderNames, copyFolderNames, onEnd);
        }
        else {
          fsPr.rm(path.join(__dirname, ...copyFolderNames), { recursive: true, force: true })
            .then(() => {
              fsPr.mkdir(path.join(__dirname, ...copyFolderNames), { recursive: true })
                .then(() => copyFolder(folderNames, copyFolderNames, onEnd))
                .catch(err => console.log(err.message));
            })
            .catch(err => console.log(err.message));
        };
      })
      .catch(err => console.log(err.message));
  }

  const handleStyle = (current, writeStyles, onHandle) => {
    const ext = path.extname(path.join(root, 'styles', current.name));
    if (current.isFile() && ext === '.css') {
      const readStyles = fs.createReadStream(path.join(root, 'styles', current.name));
      readStyles.on('data', data => writeStyles.write(data.toString() + '\n'));
      readStyles.on('error', err => console.log(err.message));
    };
    onHandle();
  }

  const mergeStyles = (data, writeStyles, onEnd) => {
    if (data.length) {
      const current = data.shift();
      handleStyle(current, writeStyles, () => {
        mergeStyles(data, writeStyles, onEnd);
      })
    } else {
      copyDir('assets', 'project-dist', onEnd);
    }
  }

  const bundleStyles = (onEnd) => {
    fsPr.readdir(path.join(root, 'styles'), { withFileTypes: true })
      .then(data => {
        data.forEach((el, i) => {
          if (el.name === 'header.css') {
            let temp = el;
            data[i] = data[0];
            data[0] = temp;
          }
          if (el.name === 'footer.css') {
            let temp = el;
            data[i] = data[data.length - 1];
            data[data.length - 1] = temp;
          }
        })
        const writeStyles = fs.createWriteStream(path.join(root, 'project-dist', 'style.css'), 'utf-8');
        mergeStyles(data, writeStyles, onEnd);
      })
      .catch(err => console.log(err.message));
  }

  const handleFile = (current, onResume) => {
    const ext = path.extname(path.join(root, 'components', current.name));
    if (current.isFile() && ext === '.html') {
      const compData = {};
      const name = path.basename(path.join(root, 'components', current.name), ext);
      components.push(`{{${name}}}`);
      compData.name = `{{${name}}}`;
      const stream = fs.createReadStream(path.join(root, 'components', current.name), 'utf-8');
      stream.on('error', () => console.log(err.message));
      stream.on('data', data => {
        compData.comp = data;
        compList.push(compData);
      })
    }
    onResume();
  }

  const writeLayout = (components, compList, onEnd) => {
    const read = fs.createReadStream(path.join(root, 'template.html'), 'utf-8');
    const write = fs.createWriteStream(path.join(dist, 'index.html'));
    const rl = readline.createInterface({
      input: read,
      output: write
    });

    rl.on('error', err => console.log(err.message));
    rl.on('line', data => {
      if (components.includes(data.trim())) {
        const spaces = data.length - data.trim().length;
        const indent = new Array(spaces).fill(' ').join('');
        let comp;
        compList.forEach(el => {
          if (el.name === data.trim()) {
            comp = el.comp.split('\n').join(`\n${indent}`);
          }
        })
        write.write(indent + comp + '\n');
      } else {
        write.write(data + '\n');
      }
    })
    rl.on('close', () => {
      bundleStyles(onEnd);
    })
  }

  const buildLayout = (data, onEnd) => {
    if (data.length > 1) {
      const current = data.shift();
      handleFile(current, () => {
        buildLayout(data, onEnd);
      })
    }
    if (data.length === 1) {
      const current = data.shift();
      const ext = path.extname(path.join(root, 'components', current.name));
      if (current.isFile() && ext === '.html') {
        const compData = {};
        const name = path.basename(path.join(root, 'components', current.name), ext);
        components.push(`{{${name}}}`);
        compData.name = `{{${name}}}`;
        const stream = fs.createReadStream(path.join(root, 'components', current.name), 'utf-8');
        stream.on('data', data => {
          compData.comp = data;
          compList.push(compData);
        })
        stream.on('end', () => {
          writeLayout(components, compList, onEnd);
        })
      }
    }
  }

  const copyTemplate = (onEnd) => {
    fsPr.readdir(path.join(root, 'components'), { withFileTypes: true })
      .then(data => {
        buildLayout(data, onEnd);
      })
      .catch(err => console.log(err.message))
  }

  fsPr.mkdir(dist, { recursive: true })
    .then(result => {
      if (result) {
        copyTemplate(() => stdout.write('Project is built!'));
      } else {
        fsPr.rm(dist, { recursive: true, force: true })
          .then(() => {
            fsPr.mkdir(dist, { recursive: true })
              .then(() => copyTemplate(() => stdout.write('Project is built!')))
              .catch(err => console.log(err.message));
          })
          .catch(err => console.log(err.message));
      };
    })
    .catch(err => console.log(err.message));
}

buildProject('project-dist');