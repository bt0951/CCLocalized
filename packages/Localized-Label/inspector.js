"use strict";
Vue.component("Localized-Label", {
  template: `
    <ui-prop v-prop="target.string" :multi-values="multi"></ui-prop>
    <ui-prop v-prop="target.horizontalAlign" :multi-values="multi"></ui-prop>
    <ui-prop v-prop="target.verticalAlign" :multi-values="multi"></ui-prop>
    <ui-prop v-prop="target.actualFontSize" v-show="!_hiddenActualFontSize()" :multi-values="multi"></ui-prop>
    <ui-prop v-prop="target.fontSize"> :multi-values="multi"</ui-prop>
    <ui-prop v-prop="target._bmFontOriginalSize" v-show="_isBMFont()" :multi-values="multi"></ui-prop>
    <ui-prop v-prop="target.lineHeight" :multi-values="multi"></ui-prop>
    <ui-prop v-prop="target.spacingX" v-show="_isBMFont()" :multi-values="multi"></ui-prop>
    <ui-prop v-prop="target.overflow" :multi-values="multi"></ui-prop>
    <ui-prop v-prop="target.enableWrapText" v-show="!_hiddenWrapText()" :multi-values="multi"></ui-prop>
    <ui-prop v-prop="target.font" :multi-values="multi"></ui-prop>
    <ui-prop v-prop="target.fontFamily" v-show="_isSystemFont()" :multi-values="multi"></ui-prop>
    <ui-prop v-prop="target.useSystemFont" :multi-values="multi"></ui-prop>
    <ui-prop v-prop="target.translate"></ui-prop>
		<div v-if="target.translate.value === true">
      <ui-prop v-prop="target.language" :multi-values="multi"></ui-prop>
      <ui-prop v-prop="target.key"></ui-prop>
    </div>
  `,
  props: {
    target: {
      twoWay: !0,
      type: Object
    },
    multi: {
      type: Boolean
    }
  },
  methods: {
    T: Editor.T,
    _isBMFont() {
      return this.target._bmFontOriginalSize.value > 0
    },
    _isSystemFont() {
      return this.target.useSystemFont.value
    },
    _hiddenWrapText() {
      let t = this.target.overflow.value;
      return 0 === t || 3 === t
    },
    _hiddenActualFontSize() {
      return 2 !== this.target.overflow.value
    }
  }
});