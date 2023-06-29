<template>
  <!-- 缩略图 -->
  <div>
    <div>
      <input type="file" @change="handleChange" ref="inputRef" class="input" />
      <el-button type="primary" @click="handleSelect">选择文件</el-button>
      <el-button
        type="primary"
        @click="handleUpload"
        :disabled="!data.files.name"
        >上传</el-button
      >
    </div>
    <div class="file-wrapper" v-if="data.files.name">
      <span>{{ data.files.name }}</span>
      <el-icon class="icon" @click="handleDelete">
        <i-ep-deleteFilled />
      </el-icon>
    </div>
    <div v-if="data.files.name">
      <img class="image" :src="imgBase64" alt="" />
    </div>
  </div>
</template>

<script setup>
import request from '@/utils/request.js'
import { ref, reactive } from 'vue'

const inputRef = ref()
const imgBase64 = ref('')
const data = reactive({
  files: {},
})

const handleChange = async () => {
  const files = inputRef.value.files
  if (!files) return
  // 是否限制文件上传的格式
  // 是否限制文件上传的大小
  data.files = files[0]
  imgBase64.value = await changeBase64(data.files)
}
const handleSelect = () => {
  inputRef.value.click()
}
const handleUpload = async () => {
  const res = await request.post(
    '/upload_single_base64',
    {
      file: encodeURIComponent(imgBase64.value), // 防止乱码问题
      filename: data.files.name,
    },
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )
  if (res.code === 0) {
    alert(res.codeText)
  }
}
const handleDelete = () => {
  inputRef.value.value = ''
  data.files = {}
}
const changeBase64 = (file) => {
  return new Promise((resolve) => {
    const fileReader = new FileReader()
    fileReader.readAsDataURL(file)
    fileReader.onload = (e) => {
      resolve(e.target.result)
    }
  })
}
</script>

<style lang="less" scoped>
.input {
  display: none;
}
.file-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 50px;
  width: 800px;
  border-bottom: 1px solid #ccc;
}
.icon {
  cursor: pointer;
  padding: 10px;
}
.image {
  width: 200px;
}
</style>
