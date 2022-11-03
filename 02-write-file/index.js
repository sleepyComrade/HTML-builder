const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { stdin, stdout } = process;

const output = fs.createWriteStream(path.join(__dirname, 'text.txt'));
const rl = readline.createInterface({
  input: stdin,
  output: stdout
});

const turnOff = () => {
  stdout.write('Great work! see ya');
  process.exit();
};

stdout.write('Hey there! let\'s type some text\n');

rl.on('error', err => console.log(err.message));

rl.on('line', (data) => {
  if (data !== 'exit') {
    output.write(data + '\n');
  } else {
    turnOff();
  }
});

rl.on('SIGINT', () => {
  turnOff();
});