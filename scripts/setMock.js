const fs = require('fs');

const sourceFile = './mock/events.json';
const destinationFile = './dist/events.json';

fs.copyFile(sourceFile, destinationFile, (err) => {
  if (err) throw err;
  console.log('File copied successfully!');
});
