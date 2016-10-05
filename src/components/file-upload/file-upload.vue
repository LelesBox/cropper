<template lang="html">
<div class="file-upload-container">
  <img class="dest-image" :src="destImg" v-show="destImg !== null" @click="openFile" />
  <a class="file-upload-icon" v-show="destImg === null">
    <input ref="input" type="file" accept="image/png,image/jpeg,image/gif" @change="change" v-show="!openCrop">
  </a>
  <div class="crop-container" v-show="openCrop">
    <div class="crop-container__source" @mouseup="mouseup" @mousemove="mousemove">
      <img class="crop-container__source__image" :src="imgSrc" ref="img"/>
      <div class="crop-box" :style="cropBoxStyle" @mousedown="mousedown" ref="cropbox">
        <span class="crop-line-h"></span>
        <span class="crop-line-v"></span>
        <!-- border  -->
        <span class="crop-line-border-top" ref="borderTop"></span>
        <span class="crop-line-border-right" ref="borderRight"></span>
        <span class="crop-line-border-bottom" ref="borderBottom"></span>
        <span class="crop-line-border-left" ref="borderLeft"></span>
        <!-- corner -->
        <span class="crop-corner crop-corner__left-top" ref="leftTop"></span>
        <span class="crop-corner crop-corner__right-top" ref="rightTop"></span>
        <span class="crop-corner crop-corner__right-bottom" ref="rightBottom"></span>
        <span class="crop-corner crop-corner__left-bottom" ref="leftBottom"></span>
        <!-- 防止图片被选中 -->
        <div class="crop-inner-container" :style="selectPicStyle">
          <img class="crop-container__source__image" :src="imgSrc" />
        </div>
        <!-- 盖上一层顶级元素，好让鼠标作为target方便拖动 -->
        <div class="crop-box__mask" ref="cropmask"></div>
      </div>
    </div>
    <canvas class="crop-canvas" ref="canvas" width="200" height="200"></canvas>
    <div @click="closeCrop" class="crop-btn crop-cancel">取消</div>
    <div @click="clip" class="crop-btn crop-yes">确定</div>
  </div>
</div>
</template>

<script>
import { on } from '../utils'
var slice = {
  h: 200,
  w: 200
}
var box = {
  h: 400,
  w: 400
}
var baseWidth = 100
export default {
  props: {
    limit: {
      type: Number,
      default: 2048
    }
  },
  data: function () {
    return {
      openCrop: false,
      image: new Image(),
      imgSrc: null,
      destImg: null,
      cropBox: {
        // height: baseWidth * this.ratio //目前不支持ratio,
        height: baseWidth,
        width: baseWidth,
        left: 0,
        top: 0
      },
      selectPic: {
        marginLeft: 0,
        marginTop: 0,
        top: 0,
        left: 0
      },
      isMousedown: false,
      MoveType: {
        moveRightBottom: 'moveRightBottom',
        moveRightTop: 'moveRightTop',
        moveLeftBottom: 'moveLeftBottom',
        moveLeftTop: 'moveLeftTop',
        move: 'move',
        current: ''
      },
      enterPoint: {
        x: 0,
        y: 0
      },
      target: null,
      canvas: {
        ctx: null
      }
    }
  },
  mounted () {
    on(document, 'mouseup', () => this.mouseup())
    this.canvas.ctx = this.$refs.canvas.getContext('2d')
  },
  computed: {
    cropBoxStyle: function () {
      return {
        height: this.cropBox.height + 'px',
        width: this.cropBox.width + 'px',
        left: this.cropBox.left + 'px',
        top: this.cropBox.top + 'px'
      }
    },
    selectPicStyle: function () {
      return {
        'margin-top': this.selectPic.marginTop + 'px',
        'margin-left': this.selectPic.marginLeft + 'px',
        'top': this.selectPic.top + 'px',
        'left': this.selectPic.left + 'px'
      }
    }
  },
  methods: {
    draw: function () {
      var { source, dest } = this.generateDrwaImageParam()
      var rate = this.$refs.img.naturalWidth / this.$refs.img.clientWidth
      var destRate = slice.h / this.cropBox.height
      for (var k in source) {
        source[k] = source[k] * rate
      }
      for (k in dest) {
        dest[k] = dest[k] * destRate
      }
      this.canvas.ctx.clearRect(0, 0, slice.w, slice.h)
      this.canvas.ctx.drawImage(this.image, source.x, source.y, source.width, source.height, dest.x, dest.y, dest.width, dest.height)
    },
    clip: function () {
      this.destImg = this.$refs.canvas.toDataURL()
      this.closeCrop()
    },
    openFile: function () {
      if (!this.openCrop) {
        this.$refs.input.click()
      }
    },
    closeCrop: function () {
      this.openCrop = false
      this.$refs.input.value = ''
    },
    change: function () {
      var file = this.$refs.input.files[0]
      // 限制容量
      if (file && file.size <= this.limit * 1024) {
        var reader = new FileReader()
        reader.onload = () => {
          var url = reader.result
          this.setImageURL(url)
        }
        reader.readAsDataURL(file)
        this.openCrop = true
      } else {
        alert('图片最大为2M')
      }
    },
    setImageURL: function (url) {
      this.image.onload = () => {
        var height = this.image.naturalHeight
        var width = this.image.naturalWidth
        if (height / width !== this.ratio) {
          console.log('比例不对啊:' + height / width)
        }
        this.draw()
      }
      this.imgSrc = url
      this.image.src = url
    },
    generateDrwaImageParam: function () {
      var source = {
        x: 0, y: 0, width: 0, height: 0
      }
      var dest = {
        x: 0, y: 0, width: slice.w, height: slice.h
      }
      var imgPosition = this.$refs.img.getBoundingClientRect()
      var boxPosition = this.$refs.cropbox.getBoundingClientRect()
      var leftOffset = boxPosition.left - imgPosition.left
      var rightOffset = boxPosition.right - imgPosition.right
      var topOffset = boxPosition.top - imgPosition.top
      var bottomOffset = boxPosition.bottom - imgPosition.bottom
      if (boxPosition.top >= imgPosition.bottom || boxPosition.bottom <= imgPosition.top || boxPosition.left >= imgPosition.right || boxPosition.right <= imgPosition.left) {
        return {
          source,
          dest
        }
      }
      // 当左边边距小于0 表示box左边框已在image的左外部
      // 此时的source x起始点就是 0
      if (leftOffset <= 0) {
        source.x = 0
        dest.x = -leftOffset
      } else {
        source.x = leftOffset
        dest.x = 0
      }
      if (rightOffset >= 0) {
        if (leftOffset <= 0) {
          source.width = imgPosition.width
        } else {
          source.width = imgPosition.width - leftOffset
        }
      } else {
        if (leftOffset <= 0) {
          // 当裁剪框放大时，会到时裁剪出来的图少1px，所以这里直接给它不上，宁可多1px而不少一个1px
          source.width = boxPosition.right - imgPosition.left + 1
        } else {
          source.width = this.cropBox.width
        }
      }
      dest.width = source.width

      if (topOffset <= 0) {
        source.y = 0
        dest.y = -topOffset
      } else {
        source.y = topOffset
        dest.y = 0
      }
      if (bottomOffset >= 0) {
        if (topOffset <= 0) {
          source.height = imgPosition.height
        } else {
          source.height = imgPosition.height - topOffset
        }
      } else {
        if (topOffset <= 0) {
          // 当裁剪框放大时，会到时裁剪出来的图少1px，所以这里直接给它不上，宁可多1px而不少一个1px
          source.height = boxPosition.bottom - imgPosition.top + 1
        } else {
          source.height = this.cropBox.height
        }
      }
      dest.height = source.height
      return {
        source,
        dest
      }
    },
    mousedown: function (e) {
      // 在鼠标按下之后到抬起之前都可以移动，按下只能是指定的元素，抬起是在crop-container__source内，或者移出crop-container__source则算做抬起
      this.isMousedown = true
      this.enterPoint.x = e.pageX
      this.enterPoint.y = e.pageY
      this.target = e.target
    },
    mouseup: function (e) {
      if (this.isMousedown) {
        this.isMousedown = false
        this.MoveType.current = ''
      }
    },
    // TODO 支持各个角度的拖动，
    // TODO 支持指定不同比例的裁剪
    mousemove: function (e) {
      if (this.isMousedown) {
        var px = e.pageX
        var py = e.pageY
        var offsetX = px - this.enterPoint.x
        var offsetY = py - this.enterPoint.y
        if (this.target === this.$refs.rightBottom || this.MoveType.current === this.MoveType.moveRightBottom) {
          console.log('offsetX, offsetY')
          this.moveRightBottom(offsetX, offsetY)
          this.MoveType.current = this.MoveType.moveRightBottom
        } else if (this.target === this.$refs.rightTop || this.MoveType.current === this.MoveType.moveRightTop) {
          this.moveRightTop(offsetX, offsetY)
          this.MoveType.current = this.MoveType.moveRightTop
        } else if (this.target === this.$refs.leftTop || this.MoveType.current === this.MoveType.moveLeftTop) {
          this.moveLeftTop(offsetX, offsetY)
          this.MoveType.current = this.MoveType.moveLeftTop
        } else if (this.target === this.$refs.leftBottom || this.MoveType.current === this.MoveType.moveLeftBottom) {
          this.moveLeftBottom(offsetX, offsetY)
          this.MoveType.current = this.MoveType.moveLeftBottom
        } else if (this.target === this.$refs.cropmask || this.MoveType.current === this.MoveType.move) {
          this.move(offsetX, offsetY)
          this.MoveType.current = this.MoveType.move
        }
        this.enterPoint = {
          x: px,
          y: py
        }
      }
    },
    moveRightBottom: function (offsetX, offsetY) {
      console.log(offsetX, offsetY)
      var minHeight = baseWidth
      var maxHeight = box.h
      var curW = this.cropBox.width + offsetX
      var curH = this.cropBox.height + offsetY
      //  最小边框长度为100
      if (curW < minHeight || curH < minHeight) {
        return
      }
      // 边框放大后偏移加宽度或者高度不能超过界限
      if (this.cropBox.left + curW >= maxHeight || this.cropBox.top + curH >= maxHeight) {
        return
      }
      if (Math.abs(offsetY) > Math.abs(offsetX)) {
        this.cropBox.width += offsetY
        this.cropBox.height += offsetY
      } else {
        this.cropBox.width += offsetX
        this.cropBox.height += offsetX
      }
      this.draw()
    },
    moveRightTop: function (offsetX, offsetY) {
      // height width top同时在变。且top的变化抵消height的变化以至于下部保持不动
      var minHeight = baseWidth
      var maxHeight = box.h
      var curW = this.cropBox.width + offsetX
      var curH = this.cropBox.height - offsetY
      if (curW < minHeight || curH < minHeight) {
        return
      }
      // 边框放大后偏移加宽度或者高度不能超过界限
      if (this.cropBox.left + curW >= maxHeight || this.cropBox.top <= 0) {
        return
      }
      if (Math.abs(offsetY) > Math.abs(offsetX)) {
        this.cropBox.width -= offsetY
        this.cropBox.height -= offsetY
        this.cropBox.top += offsetY
        this.selectPic.top -= offsetY
      } else {
        this.cropBox.width += offsetX
        this.cropBox.height += offsetX
        this.cropBox.top -= offsetX
        this.selectPic.top += offsetX
      }
      this.draw()
    },
    moveLeftTop: function (offsetX, offsetY) {
      var minHeight = baseWidth
      var curL = this.cropBox.left + offsetX
      var curT = this.cropBox.top + offsetY
      // 边界检查
      if (curL <= 0 || curT <= 0) {
        return
      }
      // 最小检查
      if (this.cropBox.height - offsetY <= minHeight || this.cropBox.width - offsetX <= minHeight) {
        return
      }
      if (Math.abs(offsetY) > Math.abs(offsetX)) {
        this.cropBox.width -= offsetY
        this.cropBox.height -= offsetY
        this.cropBox.top += offsetY
        this.cropBox.left += offsetY
        this.selectPic.top -= offsetY
        this.selectPic.left -= offsetY
      } else {
        this.cropBox.width -= offsetX
        this.cropBox.height -= offsetX
        this.cropBox.top += offsetX
        this.cropBox.left += offsetX
        this.selectPic.top -= offsetX
        this.selectPic.left -= offsetX
      }
      this.draw()
    },
    moveLeftBottom: function (offsetX, offsetY) {
      var minHeight = baseWidth
      var curL = this.cropBox.left + offsetX
      var curH = this.cropBox.height + offsetY
      // 边界检查
      if (curL <= 0 || curH + this.cropBox.top >= box.h) {
        return
      }
      // 最小检查
      if (this.cropBox.height + offsetY <= minHeight || this.cropBox.width - offsetX <= minHeight) {
        return
      }
      if (Math.abs(offsetY) > Math.abs(offsetX)) {
        this.cropBox.width += offsetY
        this.cropBox.height += offsetY
        this.cropBox.left -= offsetY
        this.selectPic.left += offsetY
      } else {
        this.cropBox.width -= offsetX
        this.cropBox.height -= offsetX
        this.cropBox.left += offsetX
        this.selectPic.left -= offsetX
      }
      this.draw()
    },
    move: function (offsetX, offsetY) {
      var ofX = this.cropBox.left + offsetX
      var ofY = this.cropBox.top + offsetY
      if (ofX >= 0 && ofY >= 0 && ofX + this.cropBox.width <= box.w && ofY + this.cropBox.height <= box.h) {
        this.cropBox.left = ofX
        this.cropBox.top = ofY
        this.selectPic.marginLeft -= offsetX
        this.selectPic.marginTop -= offsetY
      }
      this.draw()
    }
  }
}
</script>

<style lang="scss">
$height: 400px;
.file-upload-container {
  * {
    box-sizing: border-box;
  }

  img, canvas {
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -o-user-select: none;
    -webkit-user-drag: none;
  }

  .dest-image {
    display: block;
    height: 100%;
    width: 100%;
    position: relative;
    z-index: 1;
    top: 0;
    left: 0;
    z-index: 2;
  }

  .file-upload-icon {
    display: inline-block;
    border: 1px solid #000000;
    position: relative;
    z-index: 1;
    cursor: pointer;
    height: 100%;
    width: 100%;

    &:before,
    &:after {
      content: '';
      display: block;
      position: absolute;
      z-index: 1;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    &:before {
      width: 40%;
      height: 1px;
      background-color: #000000;
    }

    &:after {
      height: 40%;
      width: 1px;
      background-color: #000000;
    }
  }

  input {
    display: block;
    height: 100%;
    width: 100%;
    opacity: 0;
    position: absolute;
    z-index: 3;
    cursor: pointer;
  }
}

.crop-container {
  position: fixed;
  width: $height + ($height / 2) + 10 + 20 * 2;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  padding: 20px;
  background-color: #ffffff;
  box-shadow: 0 0 0 1000px rgba(0, 0, 0, .7);
  text-align: center;
  border-radius: 4px;
  z-index: 9999;

  &__source {
    height: $height;
    width: $height;
    float: left;
    margin-right: 10px;
    position: relative;

    // 原图背景变暗
    &:before {
      position: absolute;
      content: "";
      display: block;
      height: 100%;
      width: 100%;
      z-index: 2;
      background-color: rgba(0, 0, 0, .4);
    }

    &__image {
      user-select: none;
      position: relative;
      z-index: 1;
      top: 50%;
      transform: translateY(-50%);
      max-height: 100%;
      max-width: 100%;
    }

    .crop-box {
      position: absolute;
      z-index: 3;
      cursor: move;
      overflow: hidden;

      span {
        display: block;
        position: absolute;
        z-index: 999;
      }

      .crop-line-h {
        z-index: 997;
        width: 100%;
        height: 33.33%;
        top: 50%;
        transform: translateY(-50%);
        border-bottom: 1px dashed #000000;
        border-top: 1px dashed #000000;
      }

      .crop-line-v {
        z-index: 997;
        height: 100%;
        width: 33.33%;
        left: 50%;
        transform: translateX(-50%);
        border-left: 1px dashed #000000;
        border-right: 1px dashed #000000;
      }

      .crop-line-border-top {
        width: 100%;
        height: 8px;
        border-top: 1px solid #000000;
        top: 0;
        left: 0;
        cursor: n-resize;
      }

      .crop-line-border-right {
        width: 8px;
        height: 100%;
        top: 0;
        right: 0;
        border-right: 1px solid #000000;
        cursor: e-resize;
      }

      .crop-line-border-bottom {
        width: 100%;
        height: 8px;
        bottom: 0;
        left: 0;
        border-bottom: 1px solid #000000;
        cursor: s-resize;
      }

      .crop-line-border-left {
        width: 8px;
        height: 100%;
        top: 0;
        left: 0;
        border-left: 1px solid #000000;
        cursor: w-resize;
      }

      .crop-corner {
        z-index: 999;
        height: 10px;
        width: 10px;
        background-color: #000000;

        &__left-top {
          left: 0;
          cursor: nw-resize;
        }

        &__right-top {
          right: 0;
          cursor: ne-resize;
        }

        &__right-bottom {
          height: 20px;
          width: 20px;
          right: 0;
          bottom: 0;
          cursor: se-resize;
        }

        &__left-bottom {
          left: 0;
          bottom: 0;
          cursor: sw-resize;
        }
      }

      .crop-inner-container {
        height: $height;
        width: $height;
        background-color: #ffffff;
        margin-left: 0px;
        margin-top: 0px;
        position: relative;
        z-index: 1;
      }

      &__mask {
        position: absolute;
        z-index: 998;
        display: block;
        content: "";
        height: 100%;
        width: 100%;
        top: 0;
        left: 0;
      }
    }
  }
}

.crop-canvas {
  box-sizing: border-box;
  display: block;
  float: left;
  background-color: #eeeeee;
  width: $height / 2;
  height: $height / 2;
}

.crop-btn {
  height: 50px;
  width: 200px;
  position: absolute;
  right: 20px;
  line-height: 50px;
  text-align: center;
  color: #ffffff;
  border-radius: 4px;
  font-size: 20px;
  cursor: pointer;
  transition: all .2s ease;

  &.crop-yes {
    bottom: 20px;
    background-color: #648fe7;

    &:hover {
      background-color: #64afff;
    }

    &:active {
      background-color: #64bfff;
    }
  }

  &.crop-cancel {
    bottom: 20px + 50 + 10;
    background-color: rgba(234, 24, 17, 1);

    &:hover {
      background-color: rgba(234, 24, 17, .8);
    }

    &:active {
      background-color: rgba(234, 24, 17, 1);
    }
  }
}
</style>
