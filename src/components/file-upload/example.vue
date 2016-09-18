<style lang="scss">

.file-upload {
    display: block;
    height: 80px;
    width: 80px;
    position: relative;
    top:50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

</style>

<template lang="html">
  <file-upload class="file-upload" :dest-img.sync="destimg"></file-upload>
</template>

<script>
import fileUpload from '.'

export default {
  data: function () {
    return {
      destimg: null
    }
  },
  components: {
    fileUpload
  }
}
</script>
