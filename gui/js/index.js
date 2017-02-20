let helper = require('./js/helper.js');

helper.sureConfigExist();

let routes = require('./js/routes.js');

let router = new VueRouter({
  routes: routes
});

let win = nw.Window.get();

const packageInfo = require('../package.json');

let app = new Vue({
  el: '#app',
  router: router,
  data: {
    title: `MDProxy ${packageInfo.version}(${packageInfo.versionCode})`,
    proxyStarted: false,
    proxyError: null
  },
  methods: {
    closeApp: function () {
      win.close(true);
    },
    hideApp: function () {
      win.minimize();
    }
  }
});

if (!localStorage.username) {
  router.replace('login');
} else {
  router.replace('home');
}

module.exports = app;