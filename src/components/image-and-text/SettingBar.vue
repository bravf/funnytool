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
import { Icon } from "@vicons/utils";
const colorList = [
  "#000000",
  "#e75f5a",
  "#f8c445",
  "#5bbe6a",
  "#51adf7",
  "#6765e6",
];
const textBoldClick = () => {
  base.state.activeBlock.fontWeight =
    base.state.activeBlock.fontWeight === "normal" ? "bold" : "normal";
};
const textItalicClick = () => {
  base.state.activeBlock.fontStyle =
    base.state.activeBlock.fontStyle === "normal" ? "italic" : "normal";
};
const textUnderlineClick = () => {
  base.state.activeBlock.textDecoration =
    base.state.activeBlock.textDecoration !== "underline"
      ? "underline"
      : "none";
};
const textStrikethroughClick = () => {
  base.state.activeBlock.textDecoration =
    base.state.activeBlock.textDecoration !== "line-through"
      ? "line-through"
      : "none";
};
</script>
<template lang="pug">
.setting-bar(
  v-if="base.state.activeBlock && base.state.activeBlock.type !== 'image'"
)
  //- text
  template(v-if="base.state.activeBlock.type === 'text'")
    .color-list.list
      .color(
        v-for="color in colorList",
        :key="color",
        :style="{ background: color }",
        @click="() => (base.state.activeBlock.color = color)"
      )
    .format-list.list
      Icon(@click="textBoldClick")
        TextBold
      Icon(@click="textItalicClick")
        TextItalic
      Icon(@click="textUnderlineClick")
        TextUnderline
      Icon(@click="textStrikethroughClick")
        TextStrikethrough

  //- temp-group
  template(v-if="base.state.activeBlock.type === 'tempGroup'")
    .format-list.list
      Icon(@click="base.alignVerticalTop")
        AlignVerticalTop
      Icon(@click="base.alignHorizontalCenter")
        AlignVerticalCenter
      Icon(@click="base.alignVerticalBottom")
        AlignVerticalBottom
      Icon(@click="base.alignHorizontalLeft")
        AlignHorizontalLeft
      Icon(@click="base.alignVerticalCenter")
        AlignHorizontalCenter
      Icon(@click="base.alignHorizontalRight")
        AlignHorizontalRight
</template>
<style lang="scss" scoped>
.setting-bar {
  position: fixed;
  z-index: 10000000;
  width: 200px;
  top: 100px;
  right: 20px;
  padding: 10px;
  box-sizing: content-box;
  background: rgb(255, 255, 255);
  border-radius: 2px;
  border: 1px solid rgb(219, 219, 219);
  box-shadow: rgb(39 54 78 / 8%) 0px 2px 10px 0px,
    rgb(39 54 78 / 10%) 4px 12px 40px 0px;

  .list {
    margin-top: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .color-list {
    margin-top: 16px;
    .color {
      width: 20px;
      height: 20px;
      border-radius: 100%;
      cursor: pointer;
    }
  }

  .format-list {
    font-size: 24px;
    .xicon {
      cursor: pointer;
      &:hover {
        background: rgb(229, 229, 229);
      }
    }
  }
}
</style>