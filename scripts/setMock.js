const fs = require('fs');

const sourceFile = './mock/events.json';
const destinationDirectory = './dist';
const destinationFile = `${destinationDirectory}/events.json`;

if (!fs.existsSync(destinationDirectory)) {
  fs.mkdirSync(destinationDirectory);
}

fs.copyFile(sourceFile, destinationFile, (err) => {
  if (err) throw err;
  console.log('File copied successfully!');
});
