"use strict";
Vue.component("custom-button", {
	template: `
		<ui-prop v-prop="target.target"></ui-prop>
		<div v-if="target.target.value.uuid" class="horizontal layout end-justified" style="padding:5px 0;margin-bottom:5px;">
			<ui-button class="blue tiny" @confirm="resetNodeSize">
			Resize to Target
		</ui-button>
		</div>
		<ui-prop v-prop="target.interactable"></ui-prop>
		<ui-prop v-prop="target.enableAutoGrayEffect" v-show="_autoGrayEffectEnabled()"></ui-prop>
		<ui-prop v-prop="target.transition"></ui-prop>
		<div v-if="target.transition.value === 1">
			<ui-prop indent=1 v-prop="target.normalColor"></ui-prop>
			<ui-prop indent=1 v-prop="target.pressedColor"></ui-prop>
			<ui-prop indent=1 v-prop="target.hoverColor"></ui-prop>
			<ui-prop indent=1 v-prop="target.disabledColor"></ui-prop>
			<ui-prop indent=1 v-prop="target.duration"></ui-prop>
		</div>
		<div v-if="target.transition.value === 2">
			<ui-prop indent=1 v-prop="target.normalSprite"></ui-prop>
			<ui-prop indent=1 v-prop="target.pressedSprite"></ui-prop>
			<ui-prop indent=1 v-prop="target.hoverSprite"></ui-prop>
			<ui-prop indent=1 v-prop="target.disabledSprite"></ui-prop>
		</div>
		<div v-if="target.transition.value === 3">
			<ui-prop indent=1 v-prop="target.duration"></ui-prop>
			<ui-prop indent=1 v-prop="target.zoomScale"></ui-prop>
		</div>
		<ui-prop v-prop="target.audio"></ui-prop>
		<div v-if="target.audio.value === true">
			<ui-prop v-prop="target.soundEffect"></ui-prop>
		</div>
		
		<cc-array-prop :target.sync="target.clickEvents"></cc-array-prop>
	`,
	props:{
		target: {
			twoWay: !0,
			type: Object
		}
	},
	methods:{
		T: Editor.T,
		resetNodeSize: function () {
			var t = {
				id: this.target.uuid.value, 
				path: "_resizeToTarget", 
				type: "Boolean",
				isSubProp: !1,
				value: !0
			};
			Editor.Ipc.sendToPanel("scene","scene:set-property", t)
		},
		_autoGrayEffectEnabled: function () {
			return!(1 === this.target.transition.value || 2 === this.target.transition.value && this.target.disabledSprite.value.uuid)
		}
	}
});