<script setup>
import base from "./base";
const move = base.move(base.state.tempGroupBlock);
</script>
<template lang="pug">
.block.temp-group-block(@mousedown="move.start")
  slot
</template>
<style lang="scss" scoped>
.temp-group-block {
  pointer-events: none;
}
</style>