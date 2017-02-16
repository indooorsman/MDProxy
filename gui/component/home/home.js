let helper = require('../../js/helper.js');
//TODO 如果config.js不存在则创建之
let proxyLocalConfig = require('../../../backend/config.js');
proxyLocalConfig.dirMatches = proxyLocalConfig.dirMatches || {};
proxyLocalConfig.fileMatches = proxyLocalConfig.fileMatches || {};
proxyLocalConfig.reverses = proxyLocalConfig.reverses || {};
let proxy = require('../../../backend/index.js');
let path = require('path');
let packageInfo = require('../../../package.json');
const request = require('request');
const fs = require('fs');
const progress = require('request-progress');
const unzip = require('unzip');

// 引入组件
require('../list-editor/list-editor');
require('../matches-editor/matches-editor');
require('../log/log');
require('../dialog');

let maxLogLines = 100;
let lid = 1;

let HomeComponent = Vue.component('home-component', {
  template: helper.getTpl(`${__dirname}/home`),
  data: function () {
    return {
      username: localStorage.username,
      proxyConfig: proxyLocalConfig,
      proxyStarted: false,
      proxyError: null,
      logs: [],
      proxyDetail: {},
      portToSave: null,
      portDialog: null,
      version: {
        current: {code: packageInfo.versionCode, name: packageInfo.version},
        latest: {code: 0, name: '', changelog: ''}
      },
      updating: false,
      updateBtnText: '立即更新'
    }
  },
  methods: {
    start: function () {
      $('.global-loading').show();
      proxy.logListener.removeAllListeners('log');

      if (this.proxyStarted) {
        proxy.close();
        this.proxyStarted = false;
        this.logs = [];
        helper.showMsg('代理服务已停止');
        return;
      }
      proxy.start(this.proxyConfig, (e, res) => {
        if (e) {
          this.proxyStarted = false;
          this.proxyError = e;
        } else {
          this.proxyStarted = true;
          this.proxyError = '启动成功';
          this.proxyDetail = res;
          proxy.logListener.on('log', data => {
            data.expand = false;
            data.id = lid;
            lid++;
            this.logs.push(data);
            if (this.logs.length > maxLogLines) {
              this.logs.shift();
            }
          });
        }
        helper.showMsg(this.proxyError);
        $('.global-loading').hide();
      });
    },
    logout() {
      if (proxy && proxy.close) {
        proxy.close();
      }
      delete localStorage.username;
      this.username = null;
      this.$router.replace('login');
    },
    choosePath(type) {
      let self = this;
      let input = $('#directoryChooser');
      input.unbind('change');
      input.bind('change', function (evt) {
        if (this.value.trim() == '') {
          return;
        }
        self.proxyConfig[type] = path.resolve(this.value);
        helper.writeProxyConfig(self.proxyConfig);
      });
      input.trigger('click');
    },
    modifyPort() {
      if (!this.portDialog) {
        this.portDialog = document.getElementById('portDialog');
      }
      this.portDialog.showModal();
      this.portToSave = this.proxyConfig.port - 0;
    },
    closePortDialog() {
      this.portDialog.close();
    },
    savePort() {
      if (!this.portToSave) {
        return;
      }
      let input = document.getElementById('portinput');
      if (input.validationMessage && input.validationMessage != '') {
        return helper.showMsg(input.validationMessage);
      }
      this.proxyConfig.port = this.portToSave - 0;
      helper.writeProxyConfig(this.proxyConfig);
      this.portDialog.close();
    },
    modifyList(listName) {
      this.$refs[listName].show();
    },
    saveList(list, key) {
      this.proxyConfig.hosts[key] = list;
      helper.writeProxyConfig(this.proxyConfig);
    },
    editMatches(ref) {
      this.$refs[ref].show();
    },
    saveMatches(matches, key) {
      this.proxyConfig[key] = matches;
      helper.writeProxyConfig(this.proxyConfig);
    },
    update() {
      if (this.updating == 'done') {
        return this.$refs.updateDialog.close();
      }
      if (this.updating) {
        return;
      }
      this.updating = true;
      this.updateBtnText = '正在更新...';
      let patchUrl = `http://indooorsman.coding.me/fed-proxy-public/patch-${this.version.latest.name}-${this.version.latest.code}.zip`;
      let localPath = path.resolve(__dirname, '../../../patch.zip');
      let extractPath = path.resolve(__dirname, '../../../');
      //let patchUrl = 'https://indooorsman.coding.me/fed-proxy-public/version.json';
      progress(request(patchUrl))
        .on('progress', state => {
          let percent = parseInt(state.percent * 100) + '%';
          this.updateBtnText = '正在更新(' + percent + ')';
        })
        .on('end', () => {
          this.updateBtnText = '正在解压...';
          fs.createReadStream(localPath)
            .on('close', () => {
              this.updateBtnText = '更新完毕，重启生效';
              this.updating = 'done';
            })
            .pipe(unzip.Extract({path: extractPath}));
        })
        .pipe(fs.createWriteStream(localPath));
    }
  },
  mounted: function () {
    helper.upgradeMDLElements('.home-content');
  },
  created() {
    //检查更新
    request({
      url: `http://indooorsman.coding.me/fed-proxy-public/version.json?t=${Date.now()}`,
      method: 'GET',
      json: true
    }, (e, r, v) => {
      console.log(`latest version:`, v);
      this.version.latest = v.latest;
      if (this.version.latest.code > this.version.current.code) {
        this.$refs.updateDialog.open();
      }
    });
  }
});

module.exports = HomeComponent;