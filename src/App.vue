<template lang="html">
  <file-upload></file-upload>
</template>

<script>
import fileUpload from './components/file-upload/example'
export default {
  data () {
    return {
    }
  },
  components: {
    fileUpload
  }
}
</script>

<style lang="css">
  html,body {
    width: 100%;
    height: 100%;
  }
  body * {
    box-sizing: border-box;
  }
</style>
