<script setup>
import { onMounted, reactive, ref } from "vue";
import LeftBar from "./LeftBar.vue";
import SettingBar from "./SettingBar.vue";
import TextBlock from "./TextBlock.vue";
import ImageBlock from "./ImageBlock.vue";
import Active from "./Active.vue";
import Guideline from "./Guideline.vue";
import TempGroupBlock from "./TempGroupBlock.vue";
import base from "./base";
import { NButton, NModal, NAlert } from "naive-ui";

const isBlocks = (e) => {
  return e.target.className === "blocks";
};
const blocksOnMousedown = (e) => {
  if (isBlocks(e)) {
    base.state.activeBlock = null;
  }
};
const onMousemove = (e) => {
  base.state.mousePosition = base.getMousePostion(e);
};
const onMousedown = (block, e) => {
  const isShift = e.shiftKey;
  if (isShift && base.state.activeBlock && block !== base.state.activeBlock) {
    // 建立新的临时组
    if (base.state.activeBlock.type !== "tempGroup") {
      base.state.tempGroupBlock.scale = 1;
      base.state.tempGroupBlock.blocks = [base.state.activeBlock, block];
    } else {
      if (base.state.tempGroupBlock.blocks.includes(block)) {
        console.log("remove");
        base.arrayRemoveItem(base.state.tempGroupBlock.blocks, block);
      } else {
        base.state.tempGroupBlock.blocks.push(block);
      }
    }

    base.state.activeBlock =
      base.state.tempGroupBlock.blocks.length > 1
        ? base.state.tempGroupBlock
        : base.state.tempGroupBlock.blocks[0];

    base.updateGroupRect(base.state.tempGroupBlock);
  } else {
    // 如果点击的 block 在临时组中，则忽略
    if (
      base.state.activeBlock &&
      base.state.activeBlock.type === "tempGroup" &&
      base.state.tempGroupBlock.blocks.includes(block)
    ) {
    } else {
      base.state.activeBlock = block;
    }
  }
  base.updateActiveBlockZIndex();
};
const handleDataItem = (item) => {
  if (item.kind === "string" && item.type === "text/plain") {
    item.getAsString((text) =>
      base.createTextBlock({
        text,
        ...base.state.mousePosition,
      })
    );
  } else if (item.kind === "file" && item.type.includes("image/")) {
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

const inTempGroup = (block) => {
  if (
    base.state.activeBlock &&
    base.state.activeBlock.type === "tempGroup" &&
    base.state.tempGroupBlock.blocks.includes(block)
  ) {
    return true;
  }
  return false;
};
</script>

<template lang="pug">
.stage
  .blocks(
    @mousedown="blocksOnMousedown",
    @mousemove="onMousemove",
    @dragover.prevent="() => {}",
    @drop.prevent="onDrop"
  )
    .block-box(
      v-for="block in base.state.blocks",
      @mousedown="onMousedown(block, $event)",
      :class="{ 'block-active': block === base.state.activeBlock, 'in-temp-group': inTempGroup(block) }"
    )
      TextBlock(
        v-if="block.type === 'text'",
        :data="block",
        :key="block.id",
        :style="{ top: block.top + 'px', left: block.left + 'px', 'z-index': block.zIndex, 'font-size': block.fontSize + 'px', color: block.color, 'font-weight': block.fontWeight, 'font-style': block.fontStyle, 'text-decoration': block.textDecoration, transform: 'scale(' + block.scale + ')' }"
      )
        .block-hover
      ImageBlock(
        v-if="block.type === 'image'",
        :data="block",
        :key="block.id",
        :style="{ top: block.top + 'px', left: block.left + 'px', width: block.width + 'px', height: block.height + 'px', 'z-index': block.zIndex, transform: 'scale(' + block.scale + ')' }"
      )
        .block-hover
    tempGroupBlock(
      v-if="base.state.activeBlock === base.state.tempGroupBlock",
      :style="{ top: base.state.tempGroupBlock.top + 'px', left: base.state.tempGroupBlock.left + 'px', width: base.state.tempGroupBlock.width + 'px', height: base.state.tempGroupBlock.height + 'px', 'z-index': base.state.tempGroupBlock.zIndex }"
    )

  Active(
    v-if="base.state.activeBlock",
    :style="{ top: base.state.activeBlock.top + 'px', left: base.state.activeBlock.left + 'px', width: parseInt(base.state.activeBlock.width * base.state.activeBlock.scale) + 'px', height: parseInt(base.state.activeBlock.height * base.state.activeBlock.scale) + 'px' }"
  )
  LeftBar
  SettingBar
  Guideline(:data="base.state.guidelines")
  n-button.screen-shot(
    strong,
    secondary,
    round,
    type="primary",
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
    transform-origin: top left;
    .block-hover {
      display: none;
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      background: rgb(91, 190, 106, 0.1);
    }
    &:hover {
      .block-hover {
        display: block;
      }
    }
  }
  .block-active {
    :deep(.block-hover) {
      display: none !important;
    }
  }
  .in-temp-group {
    :deep(.block-hover) {
      display: block;
    }
  }
  .temp-group-block {
    .active {
      display: block !important;
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
