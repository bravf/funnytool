<script>
import base from "./base";
import { ref, watch } from "vue";
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
      const f = () => {
        const rect = input.value.getBoundingClientRect();
        props.data.width = rect.width / props.data.scale;
        props.data.height = rect.height / props.data.scale;
      };
      setTimeout(f);
    };
    const onDblclick = () => {
      base.state.activeBlock = props.data;
      base.updateActiveBlockZIndex();

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
    watch(() => props.data.fontSize, getSize);
    watch(() => props.data.fontWeight, getSize);
    watch(() => props.data.fontStyle, getSize);
    watch(
      () => props.data.isEdit,
      () => {
        if (!props.data.isEdit) return;
        setTimeout(() => {
          base.selectAllText(input.value);
        });
      }
    );
    const onPaste = (e) => {
      [...e.clipboardData.items].forEach((item) => {
        if (item.kind === "string" && item.type === "text/plain") {
          item.getAsString((text) =>
            base.insertContenteditable(input.value, text)
          );
        }
      });
    };
    base.bus.on("block-start-move", (args) => {
      if (args.id === props.data.id) {
        move.start(args.e);
      }
    });
    getSize();
    onDblclick();
    return {
      move,
      input,
      getSize,
      onDblclick,
      onBlur,
      onMousedown,
      onPaste,
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
    @input="getSize",
    @blur="onBlur",
    @keydown.stop="() => {}",
    @paste.prevent="onPaste",
    :innerText="data.text"
  )
  slot
</template>

<style lang="scss" scoped>
.block-content {
  outline: none;
  height: 100%;
  word-break: break-all;
  background: #fff;
  &:empty::before {
    content: attr(placeholder);
    color: #999;
  }
}
</style>