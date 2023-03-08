<script>
import { onMounted, ref } from "vue";
import base from "./base";
import Image from "@vicons/carbon/Image";
import { Icon } from "@vicons/utils";
export default {
  components: {
    Image,
    Icon,
  },
  props: {
    data: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props) {
    const input = ref();
    const move = base.move(props.data, {
      onStop: (e) => {
        if (!props.data.image) {
          input.value.click();
        }
      },
    });
    const onMousedown = (e) => {
      base.updateActiveBlock(props.data, e);
      move.start(e);
    };
    const selectFile = (e) => {
      const file = e.target.files[0];
      base.getImagePropsByFile(file).then((data) => {
        props.data.image = data.image;
        props.data.width = data.width;
        props.data.height = data.height;
      });
    };
    base.bus.on("block-start-move", (args) => {
      if (args.id === props.data.id) {
        move.start(args.e);
      }
    });
    return {
      move,
      selectFile,
      input,
      onMousedown,
    };
  },
};
</script>

<template lang="pug">
.block.image-block(@mousedown="onMousedown")
  img(:src="data.image", draggable="false", v-if="data.image")
  .empty(v-else)
    input(type="file", accept="image/*", @change="selectFile", ref="input")
    Icon
      Image
  slot
</template>

<style lang="scss" scoped>
.image-block {
  font-size: 0;
  img {
    width: 100%;
    height: auto;
  }
  .empty {
    background: #e8e8e8;
    position: relative;
    font-size: 12px;
    width: 100%;
    height: 100%;
    font-size: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    input {
      position: absolute;
      top: 0;
      left: 0;
      width: 0;
      height: 0;
      opacity: 0;
    }
  }
}
</style>