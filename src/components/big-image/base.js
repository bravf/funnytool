import { reactive } from "vue";
import mitt from "mitt";
import html2canvas from "html2canvas";

const gState = reactive({
  activeBlock: null,
  blocks: [],
  zIndex: 100,
  guidelines: {
    left: [],
    top: [],
  },
  mousePosition: {
    left: 0,
    top: 0,
  },
  bigImage: {
    show: false,
    image: null,
    width: "",
    height: "",
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
  zIndex: gState.zIndex++,
});
const createTextBlock = (data = {}) => {
  const block = {
    ...baseBlock(),
    type: "text",
    text: "",
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
    width: 100,
    height: 100,
    ...data,
  };
  gState.activeBlock = block;
  gState.blocks.push(block);
  return block;
};

const deleteActiveBlock = () => {
  if (!gState.activeBlock) return;
  const index = gState.blocks.indexOf(gState.activeBlock);
  gState.blocks.splice(index, 1);
  return gState.activeBlock;
};

// 事件总线
const bus = mitt();

// 清除辅助线
const clearGuidelines = () => {
  gState.guidelines.left = [];
  gState.guidelines.top = [];
};

// 移动 block
const move = (state, callback = {}) => {
  const startState = {
    left: 0,
    top: 0,
    isMoving: false,
  };
  const backupState = {};

  // 参考线
  let lines;

  const start = (e) => {
    backupState.left = state.left;
    backupState.top = state.top;
    startState.left = e.clientX;
    startState.top = e.clientY;
    startState.isMoving = true;
    lines = getGuidelines([state]);
    if (callback.onStart) {
      callback.onStart();
    }
  };
  const move = (e) => {
    if (!startState.isMoving) return;
    clearGuidelines();

    const diffx = e.clientX - startState.left;
    const diffy = e.clientY - startState.top;

    (() => {
      // left 吸附
      // 左线
      const left = adsorb(backupState.left + diffx, lines.left);
      if (left.is) {
        state.left = left.line;
        gState.guidelines.left.push(left.line);
        return;
      }
      // 中线
      const middle = adsorb(
        backupState.left + diffx + state.width / 2,
        lines.left
      );
      if (middle.is) {
        state.left = middle.line - state.width / 2;
        gState.guidelines.left.push(middle.line);
        return;
      }
      // 右线
      const right = adsorb(backupState.left + diffx + state.width, lines.left);
      if (right.is) {
        state.left = right.line - state.width;
        gState.guidelines.left.push(right.line);
        return;
      }
      state.left = left.line;
    })();

    (() => {
      // top 吸附
      // 上线
      const top = adsorb(backupState.top + diffy, lines.top);
      if (top.is) {
        state.top = top.line;
        gState.guidelines.top.push(top.line);
        return;
      }
      // 中线
      const middle = adsorb(
        backupState.top + diffy + state.height / 2,
        lines.top
      );
      if (middle.is) {
        state.top = middle.line - state.height / 2;
        gState.guidelines.top.push(middle.line);
        return;
      }
      // 下线
      const bottom = adsorb(backupState.top + diffy + state.height, lines.top);
      if (bottom.is) {
        state.top = bottom.line - state.height;
        gState.guidelines.top.push(bottom.line);
        return;
      }
      state.top = top.line;
    })();

    if (callback.onMove) {
      callback.onMove();
    }
  };
  const stop = () => {
    if (!startState.isMoving) return;
    startState.isMoving = false;
    clearGuidelines();
    if (callback.onStop) {
      callback.onStop();
    }
  };

  window.addEventListener("mousemove", move);
  window.addEventListener("mouseup", stop);

  return { start };
};

// 缩放 block
const resize = (state) => {
  const startState = {
    left: 0,
    isMoving: false,
  };
  const backupState = {};

  const setWidth = (width) => {
    state.width = width;
    state.height = parseInt((backupState.height / backupState.width) * width);
  };
  const setHeight = (height) => {
    state.height = height;
    state.width = parseInt((backupState.width / backupState.height) * height);
  };

  // 参考线
  let lines;

  const start = (e) => {
    backupState.width = state.width;
    backupState.height = state.height;
    startState.left = e.clientX;
    startState.isMoving = true;
    lines = getGuidelines([state]);
  };
  const move = (e) => {
    if (!startState.isMoving) return;
    clearGuidelines();

    const diffx = e.clientX - startState.left;

    (() => {
      // left 吸附
      // 右线
      const right = adsorb(state.left + backupState.width + diffx, lines.left);
      if (right.is) {
        setWidth(right.line - state.left);
        gState.guidelines.left.push(right.line);
        return;
      }
      // 中线
      const middle = adsorb(
        state.left + (backupState.width + diffx) / 2,
        lines.left
      );
      if (middle.is) {
        setWidth((middle.line - state.left) * 2);
        gState.guidelines.left.push(middle.line);
        return;
      }

      setWidth(right.line - state.left);

      (() => {
        // top吸附
        // 下线
        const bottom = adsorb(state.top + state.height, lines.top);
        if (bottom.is) {
          setHeight(bottom.line - state.top);
          gState.guidelines.top.push(bottom.line);
          return;
        }
        // 中线
        const middle = adsorb(state.top + state.height / 2, lines.top);
        if (middle.is) {
          setHeight((middle.line - state.top) * 2);
          gState.guidelines.top.push(middle.line);
          return;
        }
      })();
    })();
  };
  const stop = () => {
    if (!startState.isMoving) return;
    startState.isMoving = false;
    clearGuidelines();
  };

  window.addEventListener("mousemove", move);
  window.addEventListener("mouseup", stop);

  return { start };
};

// 获取辅助线
const getGuidelines = (except = []) => {
  const xSet = new Set();
  const ySet = new Set();
  gState.blocks.forEach((block) => {
    if (except.includes(block)) return;
    xSet.add(block.left);
    xSet.add(block.left + block.width / 2);
    xSet.add(block.left + block.width);
    ySet.add(block.top);
    ySet.add(block.top + block.height / 2);
    ySet.add(block.top + block.height);
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

// 生成一个 image 元素
const createImage = (data, callback) => {
  const img = new Image();
  img.src = data;
  img.onload = () => {
    callback(img);
  };
};

// 生成大图
const devicePixelRatio = window.devicePixelRatio;
const createBigImage = () => {
  gState.activeBlock = null;
  const offset = 10;
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
      });
    });
  });
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
};
