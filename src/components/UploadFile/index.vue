<template>
  <div>
    <div>
      <input type="file" @change="handleChange" ref="inputRef" class="input" />
      <el-button type="primary" plain @click="handleSelect">选择文件</el-button>
      <el-button type="primary" plain @click="handleUpload" :disabled="!uploadFile.data.name || isUpload">开始上传</el-button>
      <el-button type="primary" plain @click="handlePause" :disabled="!isUpload || totalProgress == 100">{{ isPause ? '继续' : '暂停' }}上传</el-button>
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
          <el-progress :percentage="totalProgress" :status="totalProgress === 100 ? 'success' : ''" />
        </el-col>
      </el-row>
      <div v-if="isUpload">
        <el-row>
          <el-col :span="8">
            <span>切片hash</span>
          </el-col>
          <el-col :span="10">
            <span>切片上传进度</span>
          </el-col>
          <el-col :span="2">
            <span>size(KB)</span>
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
const isCalHash = ref(false) // 是否计算hash
const isUpload = ref(false) // 是否上传中
const isPause = ref(false) // 是否暂停中
let requestList = reactive([])
const cancel = reactive([])

const { fileHashProgress, uploadFile, totalProgress, calculateHash, getHasUploadChunk, createChunk, mergeChunk } = useCommon()

// 选择文件
const handleSelect = () => {
  inputRef.value.click()
}

// 保存文件
const handleChange = () => {
  const file = inputRef.value.files
  if (!file.length) return
  uploadFile.data = file[0]
}

// 开始上传
const handleUpload = async () => {
  const file = uploadFile.data
  const info = uploadFile.info
  if (!file) return
  isCalHash.value = true
  // 计算文件hash
  console.log('hash开始计算')
  await calculateHash(file)
  console.log('hash计算完成')
  // 生成切片
  const chunkList = createChunk(file, info)
  console.log('切片完成')
  uploadFile.chunkList = chunkList
  // 处理切片单独进度条
  chunkList.forEach(() => {
    uploadFile.progress.push({
      percentage: 0,
      status: '',
    })
  })
  console.log('开始上传切片')
  // 上传切片
  uploadChunk()
}

// 上传切片
const uploadChunk = async () => {
  // 获取已经上传的切片列表
  const already = await getHasUploadChunk(uploadFile.info.hash)
  isUpload.value = true
  requestList = uploadFile.chunkList.map(async (chunk, index) => {
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
    const controller = new AbortController()
    cancel[index] = controller
    return request.post('/upload_chunk', formData, {
      signal: controller.signal,
      onUploadProgress: (e) => {
        const { loaded, total } = e
        if (uploadFile.progress[index].percentage < parseInt((loaded / total) * 100)) {
          uploadFile.progress[index].percentage = parseInt((loaded / total) * 100)
        }
        if (loaded === total) {
          uploadFile.progress[index].percentage = 100
          uploadFile.progress[index].status = 'success'
        }
      },
    })
  })
  const res = await Promise.allSettled(requestList)
  console.log('res', res)
}
// 暂停上传
const handlePause = () => {
  if (!isPause.value) {
    cancel.forEach((c) => {
      c.abort()
    })
    isPause.value = true
    console.log('暂停上传')
  } else {
    isPause.value = false
    uploadChunk()
    console.log('继续上传')
  }
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
