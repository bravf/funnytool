<script>
import base from "./base";
export default {
  setup() {
    const resize = base.resize({
      onStop: () => {
        if (base.state.activeBlock.type === "text") {
          base.state.currentTextStyle.scale = base.state.activeBlock.scale;
        }
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
.active
  .resize.resize-left-bottom(@mousedown.stop="resize.start")
</template>
<style lang="scss" scoped>
.active {
  position: absolute;
  pointer-events: none;
  outline: 1px solid #5bbe6a;
  z-index: 10000;

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