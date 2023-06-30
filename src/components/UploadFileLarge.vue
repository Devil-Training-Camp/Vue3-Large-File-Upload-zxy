<template>
  <!-- FormData -->
  <div>
    <div>
      <input type="file" @change="handleChange" ref="inputRef" class="input" />
      <el-button type="primary" @click="handleSelect">选择文件</el-button>
      <el-button type="primary" @click="handleUpload" :disabled="!data.files.name">上传</el-button>
    </div>
  </div>
</template>

<script setup>
import request from '@/utils/request.js'
import { ref, reactive } from 'vue'
import SparkMD5 from 'spark-md5'

const inputRef = ref()
const data = reactive({
  files: {},
})
const fileHash = ref('')
const fileSuffix = ref('')
const chunkSize = ref(5 * 1024 * 1024) // 切片大小为5M

const handleChange = () => {
  const files = inputRef.value.files
  if (!files) return
  data.files = files[0]
}
const handleSelect = () => {
  inputRef.value.click()
}
const handleUpload = async () => {
  const file = data.files
  const { HASH, suffix } = await getFileHash(file)
  fileHash.value = HASH
  fileSuffix.value = suffix
  const already = await getHasUploadChunk(file)
  console.log('already', already)
  const chunkList = createChunk(file)
  console.log('chunkList', chunkList)
  // 开始上传
  const requestList = chunkList.map(async (chunk) => {
    // 已经上传就不再上传
    if (already.includes(chunkList[0].filename)) {
      // 进度条设为100%
    }
    const formData = new FormData()
    formData.append('file', chunk.file)
    formData.append('filename', chunk.filename)
    return await request.post('/upload_chunk', formData)
  })
  // 所有切片上传成功后发送合并请求
  Promise.all(requestList).then(async (res) => {
    await mergeChunk(res.length)
  })
}
// 生成切片
const createChunk = (file, size = chunkSize.value) => {
  let cur = 0
  let index = 1
  const fileChunkList = []
  while (cur < file.size) {
    fileChunkList.push({
      file: file.slice(cur, cur + size),
      filename: `${fileHash.value}_${index++}_${fileSuffix.value}`,
    })
    cur += size
  }
  return fileChunkList
}

// 获取已经上传的切片信息
const getHasUploadChunk = async () => {
  const res = await request.post('/upload_already', {
    params: {
      HASH: fileHash.value,
    },
  })
  if (res.code === 0) {
    return res.data.fileList
  }
  return []
}

// 通知服务端合并切片
const mergeChunk = async (count) => {
  const res = await request.post(
    '/upload_merge',
    {
      HASH: fileHash.value,
      count,
      suffix: fileSuffix.value,
    },
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )
  if (res.code === 0) {
    console.log(res.message)
  }
}

// 获取文件HASH
const getFileHash = (file) => {
  return new Promise((resolve) => {
    const fileReader = new FileReader()
    fileReader.readAsArrayBuffer(file)
    fileReader.onload = (ev) => {
      const buffer = ev.target.result
      const spark = new SparkMD5.ArrayBuffer()
      let HASH = null
      let suffix = null
      spark.append(buffer)
      HASH = spark.end()
      suffix = /\.([a-zA-Z0-9]+)$/.exec(file.name)[1]
      resolve({
        buffer,
        HASH,
        suffix,
        filename: `${HASH}.${suffix}`,
      })
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
</style>
