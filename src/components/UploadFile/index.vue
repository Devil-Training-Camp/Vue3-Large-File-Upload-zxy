<template>
  <div>
    <div>
      <input type="file" @change="handleChange" ref="inputRef" class="input" />
      <el-button type="primary" @click="handleSelect">选择文件</el-button>
      <el-button type="primary" @click="handleUpload">上传</el-button>
    </div>
    <div>
      <div v-for="(key, index) in fileKeys" :key="index">
        {{ files[key].name }}
      </div>
    </div>
  </div>
</template>

<script setup>
import request from '@/utils/request.js'
import { ref, reactive, defineProps } from 'vue'

const props = defineProps({
  action: String,
  headers: String,
  method: {
    type: String,
    default: 'post',
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  showFileList: {
    type: Boolean,
    default: true,
  },
  drag: {
    type: Boolean,
    default: false,
  },
  accept: String,
  autoUpload: {
    type: Boolean,
    default: false,
  },
})

const inputRef = ref()
const files = ref({})
const fileKeys = ref([])

const handleChange = () => {
  console.log('change')
  const data = inputRef.value.files
  console.log('data', data[0])
  if (!data) return
  // 是否限制文件上传的格式
  // 是否限制文件上传的大小
  files.value = data
  fileKeys.value = Object.keys(data)
  console.log(fileKeys)
}
const handleSelect = () => {
  inputRef.value.click()
}
const handleUpload = async () => {
  console.log('upload')
}
</script>

<style lang="less" scoped>
.input {
  display: none;
}
</style>
