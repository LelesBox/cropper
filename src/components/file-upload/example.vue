<style lang="scss">

.file-upload {
    display: block;
    height: 80px;
    width: 80px;
    position: relative;
    margin: 100px;
}

</style>

<template lang="html">
  <file-upload class="file-upload" :ratio="1"></file-upload>
</template>

<script>
import fileUpload from '.'

export default {
  components: {
    fileUpload
  }
}
</script>
