<template>
  <!-- 多文件上传 -->
  <div>
    <div>
      <input
        type="file"
        @change="handleChange"
        ref="inputRef"
        class="input"
        multiple
      />
      <el-button type="primary" @click="handleSelect">选择文件</el-button>
      <el-button
        type="primary"
        @click="handleUpload"
        :disabled="data.files.length === 0"
        >上传</el-button
      >
    </div>
    <div>
      <div
        class="file-wrapper"
        v-for="(file, index) in data.files"
        :key="file.name"
      >
        <span>{{ file.name }}</span>
        <el-progress
          class="progress"
          :percentage="progress[index].percentage"
          :status="progress[index].status"
        />
        <el-icon class="icon" @click="handleDelete(index)">
          <i-ep-deleteFilled />
        </el-icon>
      </div>
    </div>
  </div>
</template>

<script setup>
import request from '@/utils/request.js'
import { ref, reactive } from 'vue'

const inputRef = ref()
const data = reactive({
  files: [],
})
const progress = reactive([])

const handleChange = () => {
  const files = inputRef.value.files
  if (files.length === 0) return
  // 是否限制文件上传的格式
  // 是否限制文件上传的大小
  data.files = Array.from(files)
  data.files.forEach(() => {
    progress.push({
      percentage: 0,
      status: '',
    })
  })
}
const handleSelect = () => {
  inputRef.value.click()
}
const handleUpload = async () => {
  const filesRequest = data.files.forEach(async (file, index) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('filename', file.name)
    return request
      .post('/upload_single', formData, {
        onUploadProgress(ev) {
          const { loaded, total } = ev
          progress[index].percentage = (loaded / total) * 100
        },
      })
      .then((res) => {
        if (res.code === 0) {
          progress[index].state = 'success'
          return Promise.resolve(res.codeText)
        }
        return Promise.reject(res.codeText)
      })
  })
  Promise.all(filesRequest).then(() => {
    console.log('上传成功')
  })
}
const handleDelete = (index) => {
  data.files.splice(index, 1)
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
