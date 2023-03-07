<script>
export default {
  props: {
    data: Object,
  },
};
</script>
<template lang="pug">
.lines
  .line.left-line(v-for="left in data.left", :style="{ left: left + 'px' }")
  .line.top-line(v-for="top in data.top", :style="{ top: top + 'px' }")
</template>
<style lang="scss" scoped>
.line {
  position: absolute;
  background: #e75f5a;
  z-index: 100000;
}
.left-line {
  top: 0;
  width: 1px;
  height: 4000px;
}
.top-line {
  left: 0;
  height: 1px;
  width: 4000px;
}
</style>