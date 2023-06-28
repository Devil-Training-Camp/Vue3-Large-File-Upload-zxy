<template>
  <div>
    <div>
      <input type="file" @change="handleChange" ref="inputRef" class="input" />
      <el-button type="primary" @click="handleSelect">选择文件</el-button>
      <el-button type="primary" @click="handleUpload">上传</el-button>
    </div>
    <div>
      <div
        v-for="(key, index) in Object.keys(data.files)"
        :key="index"
        class="file-wrapper"
      >
        <span>{{ data.files[key].name }}</span>
        <el-icon class="icon" @click="handleDelete(index)"
          ><i-ep-deleteFilled
        /></el-icon>
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

const handleChange = () => {
  console.log('change')
  const files = inputRef.value.files
  if (!data) return
  // 是否限制文件上传的格式
  // 是否限制文件上传的大小
  data.files = [...files]
}
const handleSelect = () => {
  inputRef.value.click()
}
const handleUpload = async () => {
  const formData = new FormData()
  formData.append('file', data.files[0])
  formData.append('filename', data.files[0].name)
  const res = await request.post('/upload_single', formData)
  if (res.code === 0) {
    alert(res.codeText)
    data.files = []
  }
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
.icon {
  cursor: pointer;
  padding: 10px;
}
</style>
