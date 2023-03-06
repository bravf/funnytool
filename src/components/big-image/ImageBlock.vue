<script>
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
    const move = base.move(props.data);
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
    };
  },
};
</script>

<template lang="pug">
.block.image-block(@mousedown="move.start")
  img(:src="data.image", draggable="false", v-if="data.image")
  .empty(v-else)
    input(type="file", accept="image/*", @change="selectFile")
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
      bottom: 0;
      right: 0;
      opacity: 0;
    }
  }
}
</style>