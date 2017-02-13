let rl = require('readline');
let fs = require('fs');
let path = require('path');
let nwjsConfigFile = path.join(__dirname, '.nwjs.config.json');
const spawn = require('child_process').spawn;

let startNwjs = () => {
  let nwjsBin = require(nwjsConfigFile).bin;
  let projectPath = path.resolve(__dirname, '.');
  let nwjs = spawn(nwjsBin, ['--mixed-context', projectPath]);
  console.log('load from ' + projectPath);

  nwjs.stdout.on('data', (data) => {
    console.log(`${data}`);
  });

  nwjs.stderr.on('data', (data) => {
    console.warn(`${data}`);
  });

  nwjs.on('close', code => {
    console.log(`nwjs exited with code ${code}`);
  });
};

fs.exists(nwjsConfigFile, isExist => {
  if (!isExist) {
    const prompt = rl.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '请输入nwjs可执行文件的绝对路径：'
    });

    prompt.prompt();

    prompt.on('line', line => {
      let input = line.trim();
      if (!fs.existsSync(line)) {
        console.log('您输入的路径不存在');
        prompt.prompt();
      } else {
        let config = {
          bin: input
        };
        fs.writeFileSync(nwjsConfigFile, JSON.stringify(config), {encoding: 'utf8'});
        prompt.close();
      }
    }).on('close', () => {
      startNwjs();
    });
  } else {
    startNwjs()
  }
});