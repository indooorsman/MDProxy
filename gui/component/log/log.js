var helper = require('../../js/helper.js');

let LogComponent = Vue.component('log-component', {
  template: helper.getTpl(`${__dirname}/log`),
  props: ['logs', 'proxy', 'lines'],
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
    let scrollInterval = setInterval(() => {
      logsContainer.scrollTop = this.lines * 250
    }, 1000);
    this.$watch('autoscroll', (n, o) => {
      if (scrollInterval) {
        clearInterval(scrollInterval);
        scrollInterval = null;
      }
      if (n) {
        scrollInterval = setInterval(() => {
          logsContainer.scrollTop = this.lines * 250
        }, 1000);
      }
    });

    componentHandler.upgradeElements(document.querySelector('.log-content'));
  }
});

module.exports = LogComponent;