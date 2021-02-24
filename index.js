const fs = require('fs');
const path = require('path');
const { exit } = require('process');

if(!process.argv[2]){
  console.log('The first arg should be a path to coverage file (.json)');
  exit(1);
}

if(!fs.existsSync('./purified'))
  fs.mkdirSync('./purified');

const coverage = JSON.parse(fs.readFileSync(process.argv[2], {
  encoding: 'utf-8',
}));

let purifiedContent = {}
for (const file of coverage) {
  const filePath = path.parse(new URL(file.url).pathname)

  if(!filePath.base.endsWith('.css'))
    continue;

  purifiedContent[file.url] = {
    fileName: filePath.base,
    originalSize: new Buffer.from(file.text).length,
    content: ''
  };

  for (const range of file.ranges) {
    let slice = file.text.slice(range.start, range.end)
    purifiedContent[file.url].content += ` `+slice.replace(/(\r\n|\n|\r)/gm, "");
  }

  const purifiedSize =  new Buffer.from(purifiedContent[file.url].content).length;
  purifiedContent[file.url] = {
    ...purifiedContent[file.url],
    purifiedSize,
    reducedBy: (-100 * (purifiedContent[file.url].originalSize-purifiedSize) / purifiedContent[file.url].originalSize).toFixed(2)
  }
}
console.log('--------------------');
for (const url in purifiedContent) {
  const file = purifiedContent[url];
  if(!file.fileName) file.fileName = 'index.css';
  fs.writeFileSync('./purified/'+file.fileName, file.content);

  console.log('URL: ', url),
  console.log('File name: ', file.fileName),
  console.log('Original size: ', file.originalSize),
  console.log('Purified size: ', file.purifiedSize, `(${file.reducedBy}%)`);
  console.log('--------------------');
}


