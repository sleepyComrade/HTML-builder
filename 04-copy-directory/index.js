const fsPr = require('fs/promises');
const path = require('path');
const { stdout } = process;

const copyDir = async (origin, copy) => {
  const root = __dirname;
  const folderNames = [origin];
  const copyFolderNames = [copy];

  const copyFolder = async (folderNames, copyFolderNames) => {
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
            .then(() => copyFolder(originPath, copyPath))
            .catch(err => console.log(err.message));
        }
      }))
      .catch(err => console.log(err.message));
  }

  fsPr.mkdir(path.join(__dirname, copy), { recursive: true })
  .then(result => {
    if (result) {
      copyFolder(folderNames, copyFolderNames)
        .then(() => stdout.write(`Copy folder successfully created`))
        .catch(err => console.log(err.message));
    } else {
      fsPr.rm(path.join(__dirname, copy), { recursive: true, force: true })
        .then(() => {
          fsPr.mkdir(path.join(__dirname, copy), { recursive: true })
            .then(() => {
              copyFolder(folderNames, copyFolderNames)
                .then(() => stdout.write(`Copy folder successfully updated`))
                .catch(err => console.log(err.message));
            })
            .catch(err => console.log(err.message));
        })
        .catch(err => console.log(err.message));
    };
  })
  .catch(err => console.log(err.message));
}

copyDir('files', 'files-copy')
  .catch(err => console.log(err.message));