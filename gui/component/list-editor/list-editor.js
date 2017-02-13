let helper = require('../../js/helper.js');

let ListEditor = Vue.component('list-editor', {
  template: helper.getTpl(`${__dirname}/list-editor`),
  props: ['dataList'],
  data: function () {
    return {
      clonedList: []
    }
  },
  methods: {
    show() {
      this.$el.showModal();
    },
    save() {
      this.$emit('save', this.clonedList.map(item => {
        return item.value;
      }));
      this.close();
    },
    close() {
      this.$el.close();
      this.clone();
    },
    add() {
      this.clonedList.push({
        index: this.clonedList.length,
        value: ''
      })
    },
    remove(index) {
      this.clonedList.splice(index, 1);
    },
    clone() {
      this.clonedList = this.dataList.map((item, index) => {
        return {
          index: index,
          value: item
        }
      });
    }
  },
  created() {
    this.clone();
  },
  mounted() {
    helper.upgradeMDLElements(this.$el);
  },
  watch: {
    dataList: function () {
      this.clone();
    }
  }
});

module.exports = ListEditor;