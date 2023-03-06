<script>
import base from "./base";
import { onMounted, ref } from "vue";
export default {
  props: {
    data: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props) {
    const input = ref();
    const move = base.move(props.data, {
      onStop: () => {},
    });
    const getSize = () => {
      const rect = input.value.getBoundingClientRect();
      props.data.width = parseInt(rect.width);
      props.data.height = parseInt(rect.height);
    };
    const onDblclick = () => {
      props.data.isEdit = true;
      setTimeout(() => {
        input.value.focus();
      });
    };
    const onBlur = () => {
      getSize();
      props.data.isEdit = false;
    };
    const onMousedown = (e) => {
      if (props.data.isEdit) return;
      move.start(e);
    };
    base.bus.on("block-start-move", (args) => {
      if (args.id === props.data.id) {
        move.start(args.e);
      }
    });
    onDblclick();
    return {
      move,
      input,
      getSize,
      onDblclick,
      onBlur,
      onMousedown,
    };
  },
};
</script>

<template lang="pug">
.block.text-block(@mousedown="onMousedown", @dblclick="onDblclick")
  .block-content(
    :contenteditable="data.isEdit",
    ref="input",
    placeholder="键入文字",
    spellcheck="false",
    @blur="onBlur",
    @keydown.stop="() => {}"
  ) {{ data.text }}
  slot
</template>

<style lang="scss" scoped>
.block-content {
  line-height: 26px;
  outline: none;
  &:empty::before {
    content: attr(placeholder);
    color: #999;
  }
}
</style>