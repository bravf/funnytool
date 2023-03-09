<script setup>
import { reactive } from "vue";
import base from "./base";
import TextBold from "@vicons/carbon/TextBold";
import TextItalic from "@vicons/carbon/TextItalic";
import TextUnderline from "@vicons/carbon/TextUnderline";
import TextStrikethrough from "@vicons/carbon/TextStrikethrough";
import AlignHorizontalLeft from "@vicons/carbon/AlignHorizontalLeft";
import AlignHorizontalRight from "@vicons/carbon/AlignHorizontalRight";
import AlignHorizontalCenter from "@vicons/carbon/AlignHorizontalCenter";
import AlignVerticalTop from "@vicons/carbon/AlignVerticalTop";
import AlignVerticalBottom from "@vicons/carbon/AlignVerticalBottom";
import AlignVerticalCenter from "@vicons/carbon/AlignVerticalCenter";
import ZoomIn from "@vicons/carbon/ZoomIn";
import ZoomOut from "@vicons/carbon/ZoomOut";
import { Icon } from "@vicons/utils";
import { NButton, NText, NH3, NDivider } from "naive-ui";
const colorList = [
  "#000000",
  "#e75f5a",
  "#f8c445",
  "#5bbe6a",
  "#51adf7",
  "#6765e6",
];
const textBoldClick = () => {
  base.state.currentTextStyle.fontWeight = base.state.activeBlock.fontWeight =
    base.state.activeBlock.fontWeight === "normal" ? "bold" : "normal";
};
const textItalicClick = () => {
  base.state.currentTextStyle.fontStyle = base.state.activeBlock.fontStyle =
    base.state.activeBlock.fontStyle === "normal" ? "italic" : "normal";
};
const textUnderlineClick = () => {
  base.state.currentTextStyle.textDecoration =
    base.state.activeBlock.textDecoration =
      base.state.activeBlock.textDecoration !== "underline"
        ? "underline"
        : "none";
};
const textStrikethroughClick = () => {
  base.state.currentTextStyle.textDecoration =
    base.state.activeBlock.textDecoration =
      base.state.activeBlock.textDecoration !== "line-through"
        ? "line-through"
        : "none";
};
</script>
<template lang="pug">
.setting-bar(v-if="base.state.activeBlock")
  //- scale
  .scale.item
    NText(type="success", strong) 缩放
    .list
      NButton(@click="() => base.scaleInOut('in')", :block="true")
        template(#icon)
          Icon
            ZoomIn
        | 放大
      NButton(@click="() => base.scaleInOut('out')", block)
        template(#icon)
          Icon
            ZoomOut 
        | 缩小

  //- text
  template(v-if="base.state.activeBlock.type === 'text'")
    .text-style.item
      NText(type="success", strong) 文本格式
      .list
        NButton(@click="textBoldClick", block)
          | 加粗
          template(#icon)
            Icon
              TextBold

        NButton(@click="textItalicClick", block)
          | 斜体
          template(#icon)
            Icon
              TextItalic

        NButton(@click="textUnderlineClick", block)
          | 下划线
          template(#icon)
            Icon
              TextUnderline

        NButton(@click="textStrikethroughClick", block)
          | 中划线
          template(#icon)
            Icon
              TextStrikethrough

    .text-color.item
      NText(type="success", strong) 文本颜色
      .list.color-list
        .color(
          v-for="color in colorList",
          :key="color",
          :style="{ background: color }",
          @click="() => (base.state.currentTextStyle.color = base.state.activeBlock.color = color)"
        )

  //- temp-group
  template(v-if="base.state.activeBlock.type === 'tempGroup'")
    .align.item
      NText(type="success", strong) 对齐
    .list
      NButton(@click="base.alignVerticalTop", block)
        | 上对齐
        template(#icon)
          Icon
            AlignVerticalTop

      NButton(@click="base.alignVerticalCenter", block)
        | 水平居中对齐
        template(#icon)
          Icon
            AlignVerticalCenter

      NButton(@click="base.alignVerticalBottom", block)
        | 下对齐
        template(#icon)
          Icon
            AlignVerticalBottom

      NButton(@click="base.alignHorizontalLeft", block)
        | 左对齐
        template(#icon)
          Icon
            AlignHorizontalLeft

      NButton(@click="base.alignHorizontalCenter", block)
        | 垂直居中对齐
        template(#icon)
          Icon
            AlignHorizontalCenter

      NButton(@click="base.alignHorizontalRight", block)
        | 右对齐
        template(#icon)
          Icon
            AlignHorizontalRight
</template>
<style lang="scss" scoped>
.setting-bar {
  position: fixed;
  z-index: 10000000;
  width: 200px;
  top: 100px;
  right: 20px;
  padding: 4px 10px 10px 10px;
  box-sizing: content-box;
  background: rgb(255, 255, 255);
  border-radius: 2px;
  border: 1px solid rgb(219, 219, 219);
  box-shadow: rgb(39 54 78 / 8%) 0px 2px 10px 0px,
    rgb(39 54 78 / 10%) 4px 12px 40px 0px;

  .item {
    .n-text {
      display: block;
      font-size: 20px;
      margin: 10px 0;
    }
  }
  .list {
    button {
      margin-top: 4px;
    }
  }

  .color-list {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .color {
      width: 20px;
      height: 20px;
      border-radius: 100%;
      cursor: pointer;
    }
  }
}
</style>