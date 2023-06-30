<template>
  <div>
    <div>
      <input type="file" @change="handleChange" ref="inputRef" class="input" />
      <el-button type="primary" plain @click="handleSelect">选择文件</el-button>
      <el-button type="primary" plain @click="handleUpload" :disabled="!uploadFile.data.name">开始上传</el-button>
      <el-button type="primary" plain @click="handleContinue" :disabled="!isUpload">暂停上传</el-button>
      <el-button type="primary" plain @click="handleDelete" :disabled="!uploadFile.data.name">清空</el-button>
    </div>
    <div>
      <el-row v-if="uploadFile.data.name">
        <el-col :span="8">
          <span>文件名：</span>
        </el-col>
        <el-col :span="10">
          <span>{{ uploadFile.data.name }}</span>
        </el-col>
      </el-row>
      <el-row v-if="isCalHash">
        <el-col :span="8">
          <span>文件hash计算进度：</span>
        </el-col>
        <el-col :span="10">
          <el-progress :percentage="fileHashProgress.percentage" :status="fileHashProgress.status" />
        </el-col>
      </el-row>
      <el-row v-if="isUpload">
        <el-col :span="8">
          <span>文件上传进度：</span>
        </el-col>
        <el-col :span="10">
          <span>123</span>
        </el-col>
      </el-row>
      <div v-if="isUpload">
        <el-row>
          <el-col :span="8">
            <span>切片hash</span>
          </el-col>
          <el-col :span="10">
            <span>上传进度</span>
          </el-col>
          <el-col :span="2">
            <span>size(KB)</span>
          </el-col>
          <el-col :span="4">
            <span>状态</span>
          </el-col>
        </el-row>
        <el-row v-for="(chunk, index) in uploadFile.chunkList" :key="chunk.filename">
          <el-col :span="8">
            <span>{{ chunk.filename }}</span>
          </el-col>
          <el-col :span="10">
            <el-progress :percentage="uploadFile.progress[index].percentage" :status="uploadFile.progress[index].status" />
          </el-col>
          <el-col :span="2">
            <span>{{ chunk.file.size }}</span>
          </el-col>
          <el-col :span="4">
            <span>状态</span>
          </el-col>
        </el-row>
      </div>
    </div>
  </div>
</template>

<script setup>
import request from '@/utils/request.js'
import { ref, reactive } from 'vue'
import useCommon from './useCommon.js'

const inputRef = ref()
const isUpload = ref(false) // 是否上传中
const isCalHash = ref(false) // 是否计算hash

const { fileHashProgress, uploadFile, calculateHash, getFileHash, getHasUploadChunk, createChunk, mergeChunk } = useCommon()

// 选择文件
const handleSelect = () => {
  inputRef.value.click()
}

// 保存文件
const handleChange = () => {
  const file = inputRef.value.files
  console.log('file', file)
  if (!file) return
  uploadFile.data = file[0]
}

// 开始上传
const handleUpload = async () => {
  const file = uploadFile.data
  const info = uploadFile.info
  if (!file) return
  isCalHash.value = true
  // 计算文件hash
  await calculateHash(file)
  // 生成切片
  const chunkList = createChunk(file, info)
  uploadFile.chunkList = chunkList
  // 处理切片单独进度条
  chunkList.forEach(() => {
    uploadFile.progress.push({
      percentage: 0,
      status: '',
    })
  })
  // 获取已经上传的切片列表
  const already = await getHasUploadChunk(info.hash)
  // 开始上传
  isUpload.value = true
  const requestList = chunkList.map(async (chunk, index) => {
    console.log(index, already.includes(chunk.filename))
    if (already.includes(chunk.filename)) {
      uploadFile.progress[index] = {
        percentage: 100,
        status: 'success',
      }
      return Promise.resolve()
    }
    const formData = new FormData()
    formData.append('file', chunk.file)
    formData.append('filename', chunk.filename)
    return request.post('/upload_chunk', formData, {
      onUploadProgress: (e) => {
        const { loaded, total } = e
        uploadFile.progress[index].percentage = parseInt((loaded / total) * 100)
        console.log('e', e, index, loaded, total)
        if (loaded === total) {
          uploadFile.progress[index].percentage = 100
          uploadFile.progress[index].status = 'success'
        }
      },
    })
  })
  const res = await Promise.allSettled(requestList)
  console.log(res)
}

// 暂停上传
const handleContinue = () => {}

// 清空
const handleDelete = () => {
  inputRef.value.value = ''
  uploadFile.data = {}
}
</script>

<style lang="less" scoped>
.input {
  display: none;
}
.el-row {
  margin-top: 15px;
}
.el-progress {
  margin-top: 5px;
}
</style>
