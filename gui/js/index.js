let helper = require('./js/helper.js');

helper.sureConfigExist();

let routes = require('./js/routes.js');

let router = new VueRouter({
  routes: routes
});

let win = nw.Window.get();

let app = new Vue({
  el: '#app',
  router: router,
  data: {
    title: '盈科旅游前端代理' + require('../package.json').version,
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