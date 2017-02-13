const helper = require("../js/helper.js");

let dialogComponent = Vue.component('ui-dialog', {
  template: `
    <dialog class="mdl-dialog">
      <h4 class="mdl-dialog__title">{{title}}</h4>
      <div class="mdl-dialog__content">
        <slot></slot>
      </div>
      <div class="mdl-dialog__actions">
        <button v-if="!noConfirm" @click="confirm"
                class="mdl-button mdl-button--raised mdl-button--primary mdl-js-button mdl-js-ripple-effect">
          {{confirmText?confirmText:'确认'}}
        </button>
        <button v-if="!noCancel" @click="cancel" class="mdl-button mdl-js-button mdl-js-ripple-effect">{{cancelText?cancelText:'取消'}}</button>
      </div>
    </dialog>
  `,
  props: ['title', 'confirmText', 'cancelText', 'noConfirm', 'noCancel'],
  methods: {
    confirm() {
      this.$emit('confirm');
    },
    cancel() {
      this.$emit('cancel');
      this.$el.close();
    },
    open() {
      setTimeout(() => {
        this.$el.showModal();
      }, 160);
    },
    close() {
      this.$el.close();
    }
  },
  mounted() {
    helper.upgradeMDLElements(this.$el);
  }
});

module.exports = dialogComponent;