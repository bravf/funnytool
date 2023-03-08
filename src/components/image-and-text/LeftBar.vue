<script setup>
import base from "./base";
import Image from "@vicons/carbon/Image";
import StringText from "@vicons/carbon/StringText";
import { Icon } from "@vicons/utils";
const create = (type, e) => {
  const f = { image: base.createImageBlock, text: base.createTextBlock }[type];
  const id = base.getId();
  f({ id, ...base.getMousePostion(e) });
  setTimeout(() => {
    base.bus.emit("block-start-move", { id, e });
  });
};
</script>
<template lang="pug">
.left-bar
  .item(@mousedown="create('image', $event)")
    Icon
      Image
    span.text 图片
  .item(@mousedown="create('text', $event)")
    Icon
      StringText
    span.text 文本
</template>
<style lang="scss" scoped>
.left-bar {
  position: fixed;
  top: 100px;
  left: 20px;
  padding: 10px;
  box-sizing: content-box;
  background: rgb(255, 255, 255);
  border-radius: 2px;
  border: 1px solid rgb(219, 219, 219);
  box-shadow: rgb(39 54 78 / 8%) 0px 2px 10px 0px,
    rgb(39 54 78 / 10%) 4px 12px 40px 0px;

  .item {
    width: 70px;
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgb(247, 247, 247);
    color: rgb(102, 102, 102);
    border-radius: 4px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.2s ease-out 0s;
    user-select: none;
    flex-direction: column;
    font-size: 32px;
    &:hover {
      background: rgb(229, 229, 229);
    }
    .text {
      font-size: 12px;
    }
  }
}
</style>