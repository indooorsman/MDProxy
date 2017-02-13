var helper = require('../../js/helper.js');

let LogComponent = Vue.component('log-component', {
  template: helper.getTpl(`${__dirname}/log`),
  props: ['logs', 'proxy'],
  data: function () {
    return {
      autoscroll: true
    }
  },
  methods: {
    toggleExpand: function (log) {
      log.expand = !log.expand;
    }
  },
  mounted() {
    let logsContainer = document.querySelector('.logs');
    let unwatch = this.$watch('logs', (n, o) => {
      logsContainer.scrollTop = n.length * 888;
    });
    this.$watch('autoscroll', (n, o) => {
      if (n) {
        unwatch = this.$watch('logs', (n, o) => {
          logsContainer.scrollTop = n.length * 888;
        })
      } else if (!!unwatch) {
        unwatch();
      }
    });

    componentHandler.upgradeElements(document.querySelector('.log-content'));
  }
});

module.exports = LogComponent;