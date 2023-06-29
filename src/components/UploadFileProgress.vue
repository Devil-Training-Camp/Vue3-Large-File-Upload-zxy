<template>
  <!-- 进度管控 -->
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
      <el-progress
        class="progress"
        :percentage="progress.percentage"
        :status="progress.status"
      />
      <el-icon class="icon" @click="handleDelete">
        <i-ep-deleteFilled />
      </el-icon>
    </div>
  </div>
</template>

<script setup>
import request from '@/utils/request.js'
import { ref, reactive } from 'vue'

const inputRef = ref()
const data = reactive({
  files: {},
})
const progress = reactive({
  percentage: 0,
  status: '',
})

const handleChange = () => {
  const files = inputRef.value.files
  if (!files) return
  // 是否限制文件上传的格式
  // 是否限制文件上传的大小
  data.files = files[0]
}
const handleSelect = () => {
  inputRef.value.click()
}
const handleUpload = async () => {
  try {
    const formData = new FormData()
    formData.append('file', data.files)
    formData.append('filename', data.files.name)
    const res = await request.post('/upload_single', formData, {
      onUploadProgress(ev) {
        const { loaded, total } = ev
        progress.percentage = (loaded / total) * 100
      },
    })
    if (res.code === 0) {
      progress.status = 'success'
    }
  } catch (error) {
    alert('上传失败')
  } finally {
    console.log()
  }
}
const handleDelete = () => {
  console.log(inputRef)
  inputRef.value.value = ''
  data.files = {}
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
.progress {
  width: 200px;
}
.icon {
  cursor: pointer;
  padding: 10px;
}
</style>
