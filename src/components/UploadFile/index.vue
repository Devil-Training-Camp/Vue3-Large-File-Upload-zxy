<template>
  <div class="wrapper">
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
import { ref, reactive, watch } from 'vue'
import useCommon from './useCommon.js'

const inputRef = ref()
const isCalHash = ref(false) // 是否计算hash
const isUpload = ref(false) // 是否上传中
const isPause = ref(false) // 是否暂停中
let cancel = reactive([])
const uploadMax = ref(3)

const { fileHashProgress, uploadFile, totalProgress, calculateHash, getHasUploadChunk, createChunk, mergeChunk } = useCommon()

watch(totalProgress, (newValue) => {
  if (newValue === 100) {
    mergeChunk()
  }
})

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
  const lists = uploadFile.chunkList
    .map((chunk, index) => {
      if (already.includes(chunk.filename)) {
        const idx = index
        setTimeout(() => {
          uploadFile.progress[idx] = {
            percentage: 100,
            status: 'success',
          }
        }, 100)
        index = -1
      }
      const formData = new FormData()
      formData.append('file', chunk.file)
      formData.append('filename', chunk.filename)
      return {
        formData,
        index,
        filename: chunk.filename,
      }
    })
    .filter((list) => list.index !== -1)
  if (lists.length === 0) {
    return
  }
  sendRequest(lists)
}

const requestFn = (formData, index) => {
  const controller = new AbortController()
  cancel[index] = controller
  return request.post('/upload_chunk', formData, {
    signal: controller.signal,
    onUploadProgress: (e) => {
      const { loaded, total } = e
      if (uploadFile.progress[index].percentage < parseInt((loaded / total) * 100)) {
        uploadFile.progress[index].percentage = parseInt((loaded / total) * 100)
      }
    },
  })
}

// 并发处理
const sendRequest = (lists) => {
  let finish = 0
  const total = lists.length
  const retryArr = []
  return new Promise((resolve, reject) => {
    const handler = () => {
      if (isPause.value) return
      if (lists.length) {
        const list = lists.shift()
        const { formData, index } = list
        requestFn(formData, index)
          .then(() => {
            uploadFile.progress[index].percentage = 100
            uploadFile.progress[index].status = 'success'
            finish++
            handler()
          })
          .catch(() => {
            uploadFile.progress[index].status = 'warning'
            if (typeof retryArr[list.index] !== 'number') {
              retryArr[index] = 0
            }
            retryArr[index]++
            if (retryArr[index] >= 3) {
              uploadFile.progress[index].status = 'exception'
              return reject(`切片${index + 1}上传失败`)
            }
            uploadMax.value++
            lists.push(list)
            if (isPause.value) return
            handler()
          })
      }
      if (finish >= total) {
        resolve('上传完成')
      }
    }
    for (let i = 0; i < uploadMax.value; i++) {
      handler()
    }
  })
}

// 暂停上传
const handlePause = () => {
  if (!isPause.value) {
    cancel.forEach((c) => {
      c.abort()
    })
    cancel = []
    isPause.value = true
    console.log('暂停上传')
  } else {
    uploadMax.value = 3
    isPause.value = false
    uploadChunk()
    console.log('继续上传')
  }
}
</script>

<style lang="less" scoped>
.wrapper {
  min-width: 1200px;
  overflow-y: none;
}
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
