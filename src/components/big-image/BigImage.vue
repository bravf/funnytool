<script setup>
import { onMounted, reactive, ref } from "vue";
import LeftBar from "./LeftBar.vue";
import TextBlock from "./TextBlock.vue";
import ImageBlock from "./ImageBlock.vue";
import Active from "./Active.vue";
import Guideline from "./Guideline.vue";
import base from "./base";
import { NButton, NModal, NAlert } from "naive-ui";

const isBlocks = (e) => {
  return e.target.className === "blocks";
};
const onClick = (e) => {
  if (isBlocks(e)) {
    base.state.activeBlock = null;
  }
};
const onMousemove = (e) => {
  base.state.mousePosition = base.getMousePostion(e);
};
const onMousedown = (block) => {
  base.state.activeBlock = block;
  block.zIndex = base.state.zIndex++;
};
const handleDataItem = (item) => {
  if (item.kind === "string" && item.type === "text/plain") {
    item.getAsString((text) =>
      base.createTextBlock({
        text,
        ...base.state.mousePosition,
      })
    );
  } else if (item.kind === "file" && item.type === "image/png") {
    base.getImagePropsByFile(item.getAsFile()).then((data) => {
      base.createImageBlock({
        ...data,
        ...base.state.mousePosition,
      });
    });
  }
};
const onPaste = (e) => {
  if (
    base.state.activeBlock &&
    base.state.activeBlock.type === "text" &&
    base.state.activeBlock.isEdit
  )
    return;
  [...e.clipboardData.items].forEach((item) => handleDataItem(item));
};
const onDrop = (e) => {
  [...e.dataTransfer.items].forEach((item) => handleDataItem(item));
};
const createBigImage = () => {
  base.state.activeBlock = null;
  setTimeout(base.createBigImage);
};
window.addEventListener("paste", onPaste);
window.addEventListener("keydown", (e) => {
  const key = e.key;
  if (key === "Backspace") {
    base.deleteActiveBlock();
  }
});
</script>

<template lang="pug">
.stage
  .blocks(
    @click="onClick",
    @mousemove="onMousemove",
    @dragover.prevent="() => {}",
    @drop.prevent="onDrop"
  )
    .block-box(
      v-for="block in base.state.blocks",
      @mousedown="onMousedown(block)"
    )
      TextBlock(
        v-if="block.type === 'text'",
        :data="block",
        :key="block.id",
        :style="{ top: block.top + 'px', left: block.left + 'px', 'z-index': block.zIndex }"
      )
        Active(:data="block")
      ImageBlock(
        v-if="block.type === 'image'",
        :data="block",
        :key="block.id",
        :style="{ top: block.top + 'px', left: block.left + 'px', width: block.width + 'px', height: block.height + 'px', 'z-index': block.zIndex }"
      )
        Active(:data="block")

  LeftBar
  Guideline(:data="base.state.guidelines")
  n-button.screen-shot(
    strong,
    secondary,
    round,
    type="info",
    size="large",
    @click="createBigImage",
    v-if="base.state.blocks.length && !base.state.bigImage.show"
  ) 生成大图
  n-modal(v-model:show="base.state.bigImage.show")
    .big-image
      NAlert(type="success") 右键点击图片复制或下载
      img(
        :src="base.state.bigImage.image",
        v-if="base.state.bigImage.image",
        :style="{ width: base.state.bigImage.width + 'px' }"
      )
</template>

<style lang="scss" scoped>
.top-bar {
  position: absolute;
  z-index: 10;
}
.blocks {
  position: relative;
  width: 4000px;
  height: 4000px;
  margin: 0 auto;
  .block {
    position: absolute;
    user-select: none;
    &:hover {
      .active {
        display: block !important;
      }
    }
  }
}
.screen-shot {
  position: fixed;
  bottom: 50px;
  left: calc(50vw - 52px);
  z-index: 10000;
}
.big-image {
  padding: 20px;
  background: #fff;
  img {
    margin-top: 10px;
    min-width: 400px;
    max-width: 800px;
    border: 1px solid rgba(197, 231, 213, 1);
  }
}
</style>
