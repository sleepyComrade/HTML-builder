const fsPr = require('fs/promises');
const path = require('path');
const { stdout } = process;

const copyDir = (origin, copy) => {
  const root = __dirname;
  const folderNames = [origin];
  const copyFolderNames = [copy];
  
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
    })
  }

  fsPr.mkdir(path.join(__dirname, copy), { recursive: true })
    .then(result => {
      if (result) {
        copyFolder(folderNames, copyFolderNames, () => stdout.write('Copy folder successfully created'));
      }
      else {
        fsPr.rm(path.join(__dirname, copy), { recursive: true, force: true })
          .then(() => {
            fsPr.mkdir(path.join(__dirname, copy), { recursive: true })
              .then(() => copyFolder(folderNames, copyFolderNames, () => stdout.write('Copy folder successfully updated')))
              .catch(err => console.log(err.message));
          })
          .catch(err => console.log(err.message));
      };
    })
    .catch(err => console.log(err.message));
}

copyDir('files', 'files-copy');