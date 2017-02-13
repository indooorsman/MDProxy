let anyproxy = require('anyproxy-plus');
let ip = require('ip');
let ruleModule = require('./rule.js');
let logListener = ruleModule.logListener;

let options = {
  type: "http",
  // port: port || 8004,
  hostname: "0.0.0.0",
  // rule: rule,
  dbFile: '.request.log',  // optional, save request data to a specified file, will use in-memory db if not specified
  webPort: 8002,  // optional, port for web interface
  socketPort: 8003,  // optional, internal port for web socket, replace this when it is conflict with your own service
  // throttle      : 10,    // optional, speed limit in kb/s
  disableWebInterface: true, //optional, set it when you don't want to use the web interface
  setAsGlobalProxy: false, //set anyproxy as your system proxy
  silent: true, //optional, do not print anything into terminal. do not set it when you are still debugging.
  callback: function (e, r) {
    if (e) {
      return console.log('error:', e.message);
    }
    console.log(`
　　　　　oﾟ*｡o
好啦！　／⌒ヽ*ﾟ*     
　 ∧∧ ／ヽ 　)｡*o
　(･ω･)丿ﾞ￣￣゜    
ノ/　/　　　　ｯﾊﾟ
ノ￣ゝ

  代理地址: 127.0.0.1:${options.port} 或 ${ip.address()}:${options.port}\n`);
  }
};

let server = null;

let main = (config, cb) => {
  options.rule = ruleModule.getRules(config);
  options.port = config.port || 8004;
  if (cb) {
    options.callback = e => {
      if (e && e.code && e.code == 'EADDRINUSE') {
        return cb('端口被占用，请修改端口号，或查看是否已经有一个运行中的代理');
      }
      return cb(null, {
        port: options.port,
        address: ip.address()
      });
    };
  }
  server = new anyproxy.proxyServer(options);
};

// if (!module.parent) {
//   main();
// }

module.exports.start = function (config, callback) {
  main(config, callback);
};
module.exports.options = options;
module.exports.close = function () {
  if (server && server.close) {
    server.close();
  }
};
module.exports.server = server;
module.exports.logListener = logListener;