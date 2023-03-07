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
    const resize = base.resize(props.data, {
      onStart: () => {
        base.state.activeBlock = props.data;
      },
    });
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
  .resize.resize-left-bottom(
    @mousedown.stop="resize.start",
    v-if="data.type === 'image'"
  )
</template>
<style lang="scss" scoped>
.active {
  display: none;
  position: absolute;
  top: 1px;
  bottom: 1px;
  right: 1px;
  left: 1px;
  pointer-events: none;
  outline: 1px solid #5bbe6a;

  .resize {
    position: absolute;
    pointer-events: fill;
  }
  .resize-left-bottom {
    width: 15px;
    height: 15px;
    bottom: -7px;
    right: -7px;
    border-radius: 100%;
    background: #5bbe6a;
    cursor: se-resize;
    opacity: 0.6;
  }
}
</style>