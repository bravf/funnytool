import { reactive } from "vue";
import mitt from "mitt";
import html2canvas from "html2canvas";

const Defer = () => {
  let resolve, reject, promise;
  promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return {
    resolve,
    reject,
    promise,
  };
};

const devicePixelRatio = window.devicePixelRatio;
const gState = reactive({
  activeBlock: null,
  hoverBlock: null,
  blocks: [],
  zIndex: 100,

  // 辅助线
  guidelines: {
    left: [],
    top: [],
  },

  // 记录当前鼠标位置，当复制粘贴时候进行定位
  mousePosition: {
    left: 0,
    top: 0,
  },

  // 生成的大图
  bigImage: {
    show: false,
    image: null,
    width: "",
    height: "",
  },

  // 临时组
  tempGroupBlock: {
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    blocks: [],
    type: "tempGroup",
    scale: 1,
  },

  // 当前文本样式
  currentTextStyle: {
    scale: 1,
    color: "#000",
    fontSize: "18",
    fontWeight: "normal",
    fontStyle: "normal",
    textDecoration: "normal",
  },
});

// 获取鼠标位置
const getMousePostion = (e) => {
  return {
    left: e.clientX + document.documentElement.scrollLeft,
    top: e.clientY + document.documentElement.scrollTop,
  };
};

// 根据选择的图片得到图片的路径、宽高
const getImagePropsByFile = (file) => {
  return new Promise((resolve) => {
    const url = window.URL.createObjectURL(file);
    const state = {
      image: url,
      width: "",
      height: "",
    };
    const image = new Image();
    image.onload = () => {
      state.width = image.width;
      state.height = image.height;
      resolve(state);
    };
    image.src = url;
  });
};

// 获取本地 id
const getId = (() => {
  let id = 0;
  return () => (+new Date()).toString() + id++;
})();

const baseBlock = () => ({
  id: getId(),
  top: 0,
  left: 0,
  width: 0,
  height: 0,
  scale: 1,
  // 临时变量
  _top: 0,
  _left: 0,
  _width: 0,
  _height: 0,
  _scale: 0,
  // 距离组的距离，当组缩放时候来计算坐标
  _x: 0,
  _y: 0,
  zIndex: gState.zIndex++,
});
const createTextBlock = (data = {}) => {
  const block = {
    ...baseBlock(),
    type: "text",
    text: "输入文字",
    ...gState.currentTextStyle,
    isEdit: false,
    ...data,
  };
  gState.activeBlock = block;
  gState.blocks.push(block);
  return block;
};
const createImageBlock = (data = {}) => {
  const block = {
    ...baseBlock(),
    type: "image",
    image: "",
    width: 200,
    height: 200,
    scale: 1 / devicePixelRatio,
    ...data,
  };
  gState.activeBlock = block;
  gState.blocks.push(block);
  return block;
};

const deleteActiveBlock = () => {
  if (!gState.activeBlock) return;

  getBlocks(gState.activeBlock).forEach((block) => {
    arrayRemoveItem(gState.blocks, block);
  });
  gState.activeBlock = null;
};

// 事件总线
const bus = mitt();

// 清除辅助线
const clearGuidelines = () => {
  gState.guidelines.left = [];
  gState.guidelines.top = [];
};

// 移动 block
const move = (_state, callback = {}) => {
  let state = _state;
  let backupState = _state;
  const startState = {
    left: 0,
    top: 0,
    isMoving: false,
  };

  // 参考线
  let lines;
  // 当前state实际size
  let size;

  const start = (e) => {
    if (callback.onStart) {
      callback.onStart();
    }
    // 判断临时组，如果是临时组的成员，则state升级为临时组
    if (
      gState.activeBlock &&
      gState.activeBlock.type === "tempGroup" &&
      gState.activeBlock.blocks.includes(_state)
    ) {
      state = gState.tempGroupBlock;
    } else {
      state = backupState;
    }
    getBlocks(state).forEach((block) => {
      block._left = block.left;
      block._top = block.top;
    });

    size = getRealSize(state);
    startState.left = e.clientX;
    startState.top = e.clientY;
    startState.isMoving = true;
    lines = getGuidelines(getBlocks(state));
  };
  const move = (e) => {
    if (!startState.isMoving) return;
    clearGuidelines();

    const diffx = e.clientX - startState.left;
    const diffy = e.clientY - startState.top;

    (() => {
      // left 吸附
      // 左线
      const left = adsorb(state._left + diffx, lines.left);
      if (left.is) {
        state.left = left.line;
        gState.guidelines.left.push(left.line);
        return;
      }
      // 中线
      const middle = adsorb(state._left + diffx + size.width / 2, lines.left);
      if (middle.is) {
        state.left = middle.line - size.width / 2;
        gState.guidelines.left.push(middle.line);
        return;
      }
      // 右线
      const right = adsorb(state._left + diffx + size.width, lines.left);
      if (right.is) {
        state.left = right.line - size.width;
        gState.guidelines.left.push(right.line);
        return;
      }
      state.left = left.line;
    })();

    (() => {
      // top 吸附
      // 上线
      const top = adsorb(state._top + diffy, lines.top);
      if (top.is) {
        state.top = top.line;
        gState.guidelines.top.push(top.line);
        return;
      }
      // 中线
      const middle = adsorb(state._top + diffy + size.height / 2, lines.top);
      if (middle.is) {
        state.top = middle.line - size.height / 2;
        gState.guidelines.top.push(middle.line);
        return;
      }
      // 下线
      const bottom = adsorb(state._top + diffy + size.height, lines.top);
      if (bottom.is) {
        state.top = bottom.line - size.height;
        gState.guidelines.top.push(bottom.line);
        return;
      }
      state.top = top.line;
    })();

    if (state.blocks) {
      const realDiffx = state.left - state._left;
      const realDiffy = state.top - state._top;
      getBlocks(state).forEach((block) => {
        if (block == state) return;
        block.left = block._left + realDiffx;
        block.top = block._top + realDiffy;
      });
    }

    if (callback.onMove) {
      callback.onMove();
    }
  };
  const stop = (e) => {
    if (!startState.isMoving) return;
    startState.isMoving = false;
    clearGuidelines();
    if (callback.onStop) {
      callback.onStop(e);
    }
  };

  window.addEventListener("mousemove", move);
  window.addEventListener("mouseup", stop);

  return { start };
};

// 缩放 block
const resize = (callback = {}) => {
  let state;
  const startState = {
    left: 0,
    isMoving: false,
  };
  const setByWidth = (width) => {
    state.scale = width / state.width;
  };
  const setByHeight = (height) => {
    state.scale = height / state.height;
  };

  // 参考线
  let lines;

  const start = (e) => {
    state = gState.hoverBlock || gState.activeBlock;

    getBlocks(state).forEach((block) => {
      const size = getRealSize(block);
      block._width = size.width;
      block._height = size.height;
      block._left = block.left;
      block._top = block.top;
      block._scale = block.scale;
      block._x = block.left - state.left;
      block._y = block.top - state.top;
    });

    startState.left = e.clientX;
    startState.isMoving = true;
    lines = getGuidelines(getBlocks(state));
    if (callback.onStart) {
      callback.onStart();
    }
  };
  const move = (e) => {
    if (!startState.isMoving) return;
    clearGuidelines();

    const diffx = e.clientX - startState.left;

    (() => {
      // left 吸附
      // 右线
      const right = adsorb(state.left + state._width + diffx, lines.left);
      if (right.is) {
        setByWidth(right.line - state.left);
        gState.guidelines.left.push(right.line);
        return;
      }
      // 中线
      const middle = adsorb(
        state.left + (state._width + diffx) / 2,
        lines.left
      );
      if (middle.is) {
        setByWidth((middle.line - state.left) * 2);
        gState.guidelines.left.push(middle.line);
        return;
      }

      setByWidth(right.line - state.left);

      (() => {
        // top吸附
        // 下线
        const height = state.height * state.scale;
        const bottom = adsorb(state.top + height, lines.top);
        if (bottom.is) {
          setByHeight(bottom.line - state.top);
          gState.guidelines.top.push(bottom.line);
          return;
        }
        // 中线
        const middle = adsorb(state.top + height / 2, lines.top);
        if (middle.is) {
          setByHeight((middle.line - state.top) * 2);
          gState.guidelines.top.push(middle.line);
          return;
        }
      })();
    })();

    const diffScale = state.scale - state._scale;
    getBlocks(state).forEach((block) => {
      if (state === block) return;
      block.scale = block._scale * (1 + diffScale);
      block.left = state.left + block._x * (1 + diffScale);
      block.top = state.top + block._y * (1 + diffScale);
    });

    if (callback.onMove) {
      callback.onMove();
    }
  };
  const stop = () => {
    if (!startState.isMoving) return;
    startState.isMoving = false;
    clearGuidelines();
    // 如果是组，重置size
    if (state.type === "tempGroup") {
      updateGroupRect(state);
    }
    if (callback.onStop) {
      callback.onStop();
    }
  };

  window.addEventListener("mousemove", move);
  window.addEventListener("mouseup", stop);

  return { start };
};

// 获取辅助线
const getGuidelines = (except = [], blocks = gState.blocks) => {
  const xSet = new Set();
  const ySet = new Set();
  blocks.forEach((block) => {
    if (except.includes(block)) return;
    const size = getRealSize(block);
    xSet.add(block.left);
    xSet.add(block.left + size.width / 2);
    xSet.add(block.left + size.width);
    ySet.add(block.top);
    ySet.add(block.top + size.height / 2);
    ySet.add(block.top + size.height);
  });
  return {
    left: Array.from(xSet),
    top: Array.from(ySet),
  };
};

// 吸附
const adsorb = (line, lines, offset = 5) => {
  const state = {
    line,
    is: false,
  };
  lines.some((_line) => {
    if (Math.abs(line - _line) <= offset) {
      state.line = _line;
      state.is = true;
      return true;
    }
  });
  return state;
};

// 选中文本
const selectAllText = (el) => {
  if (document.selection) {
    var range = document.body.createTextRange();
    range.moveToElementText(el);
    range.select();
  } else if (window.getSelection) {
    var range = document.createRange();
    range.selectNodeContents(el);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
  }
};

// 生成一个 image 元素
const createImage = (data, callback) => {
  const img = new Image();
  img.src = data;
  img.onload = () => {
    callback(img);
  };
};

// 生成大图
const createBigImage = () => {
  const defer = Defer();
  gState.activeBlock = null;
  const offset = 0;
  const lines = getGuidelines();
  const minLeft = Math.min(...lines.left) - offset;
  const maxLeft = Math.max(...lines.left) + offset;
  const minTop = Math.min(...lines.top) - offset;
  const maxTop = Math.max(...lines.top) + offset;
  const width = maxLeft - minLeft;
  const height = maxTop - minTop;

  html2canvas(document.querySelector(".blocks")).then((canvas) => {
    createImage(canvas.toDataURL("image/png"), (img) => {
      const imgWidth = img.width;
      const imgHeight = img.height;
      const canvas2 = document.createElement("canvas");
      canvas2.width = width * devicePixelRatio;
      canvas2.height = height * devicePixelRatio;
      canvas2
        .getContext("2d")
        .drawImage(
          img,
          -minLeft * devicePixelRatio,
          -minTop * devicePixelRatio,
          imgWidth,
          imgHeight
        );
      createImage(canvas2.toDataURL("image/png"), (img) => {
        gState.bigImage.show = true;
        gState.bigImage.image = img.src;
        gState.bigImage.width = img.width / devicePixelRatio;
        gState.bigImage.height = img.height / devicePixelRatio;
        defer.resolve();
      });
    });
  });
  return defer.promise;
};

const insertContenteditable = (el, content) => {
  // 获取当前选区对象和 Range 对象
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);

  // 创建新的文本节点
  const newTextNode = document.createTextNode(content);

  // 插入文本节点
  range.insertNode(newTextNode);

  // 移动光标位置
  range.setStartAfter(newTextNode);

  // 清除选区
  // selection.removeAllRanges();
};

const arrayRemoveItem = (array, item) => {
  const index = array.indexOf(item);
  if (index === -1) return;
  array.splice(index, 1);
};

// 根据 group.blocks 更新 group的 rect 信息
const updateGroupRect = (group) => {
  let minLeft = 1000000;
  let maxLeft = 0;
  let minTop = 1000000;
  let maxTop = 0;

  group.blocks.forEach((block) => {
    const size = getRealSize(block);
    minLeft = Math.min(minLeft, block.left);
    maxLeft = Math.max(maxLeft, block.left + size.width);
    minTop = Math.min(minTop, block.top);
    maxTop = Math.max(maxTop, block.top + size.height);
  });

  group.left = minLeft;
  group.top = minTop;
  group.width = maxLeft - minLeft;
  group.height = maxTop - minTop;
  group.scale = 1;
};

// 根据scale得到真实size
const getRealSize = (block) => {
  return {
    width: block.width * block.scale || 0,
    height: block.height * block.scale || 0,
  };
};

// 得到所有包含的block
const getBlocks = (block) => {
  if (!["tempGroup", "group"].includes(block.type)) return [block];
  if (block.type === "group") return [block, ...block.blocks];
  if (block.type === "tempGroup") {
    let blocks = [block];
    block.blocks.forEach((_block) => {
      blocks = [...blocks, ...getBlocks(_block)];
    });
    return blocks;
  }
};

// 升级 activeBlock zindex
const updateActiveBlockZIndex = () => {
  if (!gState.activeBlock) return;
  getBlocks(gState.activeBlock).forEach((block) => {
    block.zIndex = gState.zIndex++;
  });
};

// 处理选中block逻辑
const updateActiveBlock = (block, e) => {
  const isShift = e.shiftKey;
  if (isShift && gState.activeBlock && block !== gState.activeBlock) {
    // 建立新的临时组
    if (gState.activeBlock.type !== "tempGroup") {
      gState.tempGroupBlock.scale = 1;
      gState.tempGroupBlock.blocks = [gState.activeBlock, block];
    } else {
      if (gState.tempGroupBlock.blocks.includes(block)) {
        arrayRemoveItem(gState.tempGroupBlock.blocks, block);
      } else {
        gState.tempGroupBlock.blocks.push(block);
      }
    }

    gState.activeBlock =
      gState.tempGroupBlock.blocks.length > 1
        ? gState.tempGroupBlock
        : gState.tempGroupBlock.blocks[0];

    updateGroupRect(gState.tempGroupBlock);
  } else {
    // 如果点击的 block 在临时组中，则忽略
    if (
      gState.activeBlock &&
      gState.activeBlock.type === "tempGroup" &&
      gState.tempGroupBlock.blocks.includes(block)
    ) {
    } else {
      gState.activeBlock = block;
    }
  }
  updateActiveBlockZIndex();
};

// 选中一组 blocks
const selectBlocks = (blocks) => {
  if (!blocks.length) return;
  if (blocks.length === 1) {
    gState.activeBlock = blocks[0];
    return;
  }
  gState.tempGroupBlock.scale = 1;
  gState.tempGroupBlock.zIndex = gState.zIndex++;
  gState.tempGroupBlock.blocks = [...blocks];
  gState.activeBlock = gState.tempGroupBlock;
  updateGroupRect(gState.tempGroupBlock);
};

// 对齐排版
const alignOffset = 20;
const alignVerticalTop = () => {
  const lines = getGuidelines([], gState.tempGroupBlock.blocks);
  let left = Math.min(...lines.left);
  let top = Math.min(...lines.top);

  gState.tempGroupBlock.blocks
    .sort((a, b) => a.left - b.left)
    .forEach((block, index) => {
      const realSize = getRealSize(block);
      block.left = left;
      block.top = top;
      left = left + alignOffset + realSize.width;
    });

  updateGroupRect(gState.tempGroupBlock);
};
const alignVerticalBottom = () => {
  const lines = getGuidelines([], gState.tempGroupBlock.blocks);
  let left = Math.min(...lines.left);
  let bottom = Math.max(...lines.top);

  gState.tempGroupBlock.blocks
    .sort((a, b) => a.left - b.left)
    .forEach((block, index) => {
      const realSize = getRealSize(block);
      block.left = left;
      block.top = bottom - realSize.height;

      left = left + alignOffset + realSize.width;
    });

  updateGroupRect(gState.tempGroupBlock);
};
const alignHorizontalCenter = () => {
  const lines = getGuidelines([], gState.tempGroupBlock.blocks);
  let left = Math.min(...lines.left);
  let bottom = Math.max(...lines.top);

  gState.tempGroupBlock.blocks
    .sort((a, b) => a.left - b.left)
    .forEach((block, index) => {
      const realSize = getRealSize(block);
      block.left = left;
      block.top = (bottom - realSize.height) / 2;

      left = left + alignOffset + realSize.width;
    });

  updateGroupRect(gState.tempGroupBlock);
};

const alignHorizontalLeft = () => {
  const lines = getGuidelines([], gState.tempGroupBlock.blocks);
  let left = Math.min(...lines.left);
  let top = Math.min(...lines.top);

  gState.tempGroupBlock.blocks
    .sort((a, b) => a.top - b.top)
    .forEach((block, index) => {
      const realSize = getRealSize(block);
      block.left = left;
      block.top = top;

      top = top + alignOffset + realSize.height;
    });

  updateGroupRect(gState.tempGroupBlock);
};
const alignHorizontalRight = () => {
  const lines = getGuidelines([], gState.tempGroupBlock.blocks);
  let right = Math.max(...lines.left);
  let top = Math.min(...lines.top);

  gState.tempGroupBlock.blocks
    .sort((a, b) => a.top - b.top)
    .forEach((block, index) => {
      const realSize = getRealSize(block);
      block.left = right - realSize.width;
      block.top = top;

      top = top + alignOffset + realSize.height;
    });

  updateGroupRect(gState.tempGroupBlock);
};
const alignVerticalCenter = () => {
  const lines = getGuidelines([], gState.tempGroupBlock.blocks);
  let right = Math.max(...lines.left);
  let top = Math.min(...lines.top);

  gState.tempGroupBlock.blocks
    .sort((a, b) => a.top - b.top)
    .forEach((block, index) => {
      const realSize = getRealSize(block);
      block.left = (right - realSize.width) / 2;
      block.top = top;

      top = top + alignOffset + realSize.height;
    });

  updateGroupRect(gState.tempGroupBlock);
};

export default {
  state: gState,
  bus,
  move,
  resize,
  getGuidelines,
  createTextBlock,
  createImageBlock,
  getId,
  getMousePostion,
  getImagePropsByFile,
  createBigImage,
  devicePixelRatio,
  deleteActiveBlock,
  selectAllText,
  insertContenteditable,
  arrayRemoveItem,
  updateGroupRect,
  getRealSize,
  updateActiveBlockZIndex,
  alignVerticalTop,
  alignVerticalBottom,
  alignHorizontalLeft,
  alignHorizontalRight,
  alignHorizontalCenter,
  alignVerticalCenter,
  updateActiveBlock,
  selectBlocks,
};
