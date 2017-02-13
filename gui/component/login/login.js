let helper = require('../../js/helper');

let LoginComponent = Vue.component('login-component', {
  template: helper.getTpl(`${__dirname}/login`),
  data: function () {
    return {
      username: ''
    }
  },
  methods: {
    save: function () {
      if (this.username.trim() == '') {
        return helper.showMsg('用户名不能为空');
      }
      localStorage.username = this.username;
      this.$router.replace('home');
    }
  },
  mounted() {
    helper.upgradeMDLElements('.login-content');
  }
});

module.exports = LoginComponent;