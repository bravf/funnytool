<script setup>
import { onMounted, reactive, ref } from "vue";
import LeftBar from "./LeftBar.vue";
import SettingBar from "./SettingBar.vue";
import TextBlock from "./TextBlock.vue";
import ImageBlock from "./ImageBlock.vue";
import Active from "./Active.vue";
import Guideline from "./Guideline.vue";
import TempGroupBlock from "./TempGroupBlock.vue";
import CircleSelect from "./CircleSelect.vue";
import base from "./base";
import { NButton, NModal, NAlert } from "naive-ui";
import Cut from "@vicons/carbon/Cut";
import { Icon } from "@vicons/utils";

const isBlocks = (e) => {
  return e.target.className === "blocks";
};
const blocksOnMousedown = (e) => {
  if (isBlocks(e)) {
    base.state.activeBlock = null;

    // 开始准备圈选
    base.state.circleSelect.isStart = true;
    const position = base.getMousePostion(e);
    base.state.circleSelect._left = position.left;
    base.state.circleSelect._top = position.top;
  }
};
// 圈选事件处理
window.addEventListener("mousemove", (e) => {
  if (!base.state.circleSelect.isStart) return;

  const position = base.getMousePostion(e);
  const offset = 5;
  const width = position.left - base.state.circleSelect._left;
  const height = position.top - base.state.circleSelect._top;

  // 二次保护，用来防止误操作
  if (Math.abs(width) > offset || Math.abs(height) > offset) {
    base.state.circleSelect.isMoving = true;
  }

  if (!base.state.circleSelect.isMoving) return;

  // 根据 width 和 height 判断方向
  if (width > 0) {
    base.state.circleSelect.left = base.state.circleSelect._left;
    base.state.circleSelect.width = width;
  } else {
    base.state.circleSelect.left = base.state.circleSelect._left + width;
    base.state.circleSelect.width = -width;
  }

  if (height > 0) {
    base.state.circleSelect.top = base.state.circleSelect._top;
    base.state.circleSelect.height = height;
  } else {
    base.state.circleSelect.top = base.state.circleSelect._top + height;
    base.state.circleSelect.height = -height;
  }

  base.circleSelectBlocks();
});
window.addEventListener("mouseup", () => {
  if (
    base.state.circleSelect.isMoving &&
    base.state.tempGroupBlock.blocks.length
  ) {
    base.updateGroupRect(base.state.tempGroupBlock);
    base.state.activeBlock = base.state.tempGroupBlock;
  }

  base.state.circleSelect.isStart = false;
  base.state.circleSelect.isMoving = false;
});

const onMousemove = (e) => {
  base.state.mousePosition = base.getMousePostion(e);
};
const handleDataItem = (item) => {
  return new Promise((resolve) => {
    if (item.kind === "string" && item.type === "text/plain") {
      item.getAsString((text) => {
        const block = base.createTextBlock({
          text,
          ...base.state.mousePosition,
        });
        resolve(block);
      });
    } else if (item.kind === "file" && item.type.includes("image/")) {
      base.getImagePropsByFile(item.getAsFile()).then((data) => {
        const block = base.createImageBlock({
          ...data,
          ...base.state.mousePosition,
        });
        resolve(block);
      });
    }
  });
};
const onPaste = (e) => {
  if (
    base.state.activeBlock &&
    base.state.activeBlock.type === "text" &&
    base.state.activeBlock.isEdit
  )
    return;

  handleDataItems(e.clipboardData.items);
};
const onDrop = (e) => {
  handleDataItems(e.dataTransfer.items);
};
const handleDataItems = (items) => {
  const blocks = [];
  const blockDefers = [];
  [...items].forEach((item) => {
    blockDefers.push(
      handleDataItem(item).then((block) => {
        blocks.push(block);
      })
    );
  });
  Promise.all(blockDefers).then(() => {
    base.selectBlocks(blocks);
  });
};

const createBigImage = () => {
  base.state.activeBlock = null;
  setTimeout(base.createBigImage);
};
window.addEventListener("paste", onPaste);
window.addEventListener("keydown", (e) => {
  const key = e.key;

  // 删除block
  if (key === "Backspace") {
    base.deleteActiveBlock();
    e.preventDefault();
    return;
  }

  // 全选block
  if (key === "a" && (e.metaKey || e.ctrlKey)) {
    base.selectBlocks(base.state.blocks);
    e.preventDefault();
    return;
  }
});

const inTempGroup = (block) => {
  if (base.state.tempGroupBlock.blocks.includes(block)) {
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
      :class="{ 'block-active': block === base.state.activeBlock, 'in-temp-group': inTempGroup(block) }",
      :key="'box' + block.id"
    )
      TextBlock(
        v-if="block.type === 'text'",
        :data="block",
        :key="block.id",
        :style="{ top: block.top + 'px', left: block.left + 'px', 'z-index': block.zIndex, color: block.color, 'font-weight': block.fontWeight, 'font-style': block.fontStyle, 'text-decoration': block.textDecoration, transform: 'scale(' + block.scale + ')', 'font-size': block.fontSize + 'px' }"
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
  CircleSelect(
    v-if="base.state.circleSelect.isMoving",
    :style="{ top: base.state.circleSelect.top + 'px', left: base.state.circleSelect.left + 'px', width: base.state.circleSelect.width + 'px', height: base.state.circleSelect.height + 'px' }"
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
  )
    | 点击生成大图
    template(#icon)
      Icon
        Cut

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
      background: rgb(91, 190, 106, 0.4);
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
  top: 50px;
  left: calc(50vw - 52px);
  z-index: 10000;
}
.big-image {
  padding: 20px;
  background: #fff;
  user-select: none;
  img {
    margin-top: 10px;
    min-width: 400px;
    max-width: 800px;
    border: 1px solid rgba(197, 231, 213, 1);
  }
}
</style>
