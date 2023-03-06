<script>
import base from "./base";
export default {
  props: {
    data: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props) {
    const resize = base.resize(props.data);
    return {
      base,
      resize,
    };
  },
};
</script>
<template lang="pug">
.active(
  :style="{ display: base.state.activeBlock === data ? 'block' : 'none' }"
)
  .resize(@mousedown.stop="resize.start", v-if="data.type != 'text'")
</template>
<style lang="scss" scoped>
.active {
  display: none;
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
  pointer-events: none;
  outline: 1px solid rgb(22, 132, 252);
  .resize {
    position: absolute;
    width: 9px;
    height: 9px;
    bottom: -4px;
    right: -4px;
    background: rgb(22, 132, 252);
    cursor: se-resize;
    opacity: 0.6;
    pointer-events: fill;
  }
}
</style>