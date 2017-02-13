let helper = require('../../js/helper.js');

let ListEditor = Vue.component('matches-editor', {
  template: helper.getTpl(`${__dirname}/matches-editor`),
  props: ['dataList', 'sourcePlaceholder', 'targetPlaceholder'],
  data: function () {
    return {
      clonedList: [],
      placeholder1: '输入完整的url',
      placeholder2: '输入本机文件地址和ftl数据，如/u/a.ftl#{a: "1"}'
    }
  },
  methods: {
    show() {
      this.$el.showModal();
    },
    save() {
      let data = {};
      this.clonedList.forEach(item => {
        if (item.url.trim() != '' && item.local.trim() != '') {
          data[item.url] = (item.enable ? '' : '!') + item.local;
        }
      });
      this.$emit('save', data);
      this.close();
    },
    close() {
      this.$el.close();
      this.clone();
    },
    add() {
      this.clonedList.push({
        url: '',
        local: '',
        enable: true
      });
      helper.upgradeMDLElements(this.$el);
    },
    remove(item) {
      let sure = window.confirm('确定删除这条规则吗？');
      if (sure) {
        let index = this.clonedList.findIndex((el) => {
          return el === item;
        });
        this.clonedList.splice(index, 1);
      }
    },
    toggle(item) {
      item.enable = !item.enable;
    },
    clone() {
      this.clonedList = [];
      for (let k in this.dataList) {
        if (!this.dataList.hasOwnProperty(k)) {
          continue;
        }
        let url = k;
        let local = this.dataList[k];
        let enable = true;
        if (local.startsWith('!')) {
          local = local.replace(/^!/, '');
          enable = false;
        }
        this.clonedList.push({
          url: url,
          local: local,
          enable: enable // done 本机地址如果以感叹号开头则为禁用
        });
      }
    }
  },
  created() {
    this.clone();
    this.placeholder1 = this.sourcePlaceholder || this.placeholder1;
    this.placeholder2 = this.targetPlaceholder || this.placeholder2;
    // console.log('cloned list:', this.clonedList);
  },
  watch: {
    dataList: function () {
      this.clone();
    }
  },
  mounted() {
    helper.upgradeMDLElements(this.$el);
  }
});

module.exports = ListEditor;