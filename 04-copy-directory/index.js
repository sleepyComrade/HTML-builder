const fsPr = require('fs/promises');
const path = require('path');
const { stdout } = process;

const copyDir = (origin, copy) => {
  fsPr.mkdir(path.join(__dirname, copy), { recursive: true })
  .then(result => {
    if (result) {
      stdout.write(`Copy folder successfully created`);
    } else stdout.write('Copy folder successfully updated');
  })
  .catch(err => console.log(err.message));

  const root = __dirname;
  const folderNames = [origin];
  const copyFolderNames = [copy];

  const copyFolder = (folderNames, copyFolderNames) => {
    fsPr.readdir(path.join(root, ...folderNames), { withFileTypes: true })
      .then(data => data.forEach(el => {
        if (el.isFile()) {
          fsPr.copyFile(path.join(root, ...folderNames, el.name), path.join(root, ...copyFolderNames, el.name))
            .catch(err => console.log(err.message));
        }
        if (el.isDirectory()) {
          const originPath = [...folderNames, el.name];
          const copyPath = [...copyFolderNames, el.name];
          fsPr.mkdir(path.join(root, ...copyPath), { recursive: true })
            .catch(err => console.log(err.message));

          copyFolder(originPath, copyPath);
        }
      }))
      .catch(err => console.log(err.message));
  }
  copyFolder(folderNames, copyFolderNames);
}

copyDir('files', 'files-copy');