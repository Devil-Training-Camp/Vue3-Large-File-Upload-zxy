import { ref, reactive, computed } from 'vue'
import request from '@/utils/request.js'

const fileHashProgress = reactive({
  percentage: 0,
  status: '',
})

const uploadFile = reactive({
  data: {},
  info: {
    hash: '',
    suffix: '',
  },
  chunkList: [],
  progress: [],
})

const totalProgress = computed(() => {
  const total = uploadFile.progress.length * 100
  let load = 0
  uploadFile.progress.forEach((item) => {
    load += item.percentage
  })
  return parseInt((load / total) * 100)
})

const chunkSize = 5 * 1024 * 1024 // 切片大小为50M

export default function useCommon() {
  // 生成hash
  const calculateHash = (file) => {
    return new Promise((resolve) => {
      // 添加 worker 属性
      const worker = new Worker('../../../public/hash.js')
      worker.postMessage(file)
      worker.onmessage = (e) => {
        const { percentage, hash, suffix } = e.data
        if (percentage < 90) {
          fileHashProgress.percentage = percentage
        }
        if (percentage >= 90) {
          fileHashProgress.percentage = 99
          uploadFile.info.hash = hash
        }
        if (suffix) {
          fileHashProgress.percentage = 100
          fileHashProgress.status = 'success'
          uploadFile.info.suffix = suffix
          resolve()
        }
      }
    })
  }
  // 生成切片
  const createChunk = (file, info) => {
    let cur = 0
    let index = 1
    const fileChunkList = []
    while (cur < file.size) {
      fileChunkList.push({
        file: file.slice(cur, cur + chunkSize),
        filename: `${info.hash}_${index++}_${info.suffix}`,
      })
      cur += chunkSize
    }
    return fileChunkList
  }
  // 获取已经上传的切片列表
  const getHasUploadChunk = async (hash) => {
    const res = await request.post(
      '/upload_already',
      {
        HASH: hash,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )
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
        HASH: uploadFile.info.hash,
        count,
        suffix: uploadFile.info.suffix,
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
  return {
    fileHashProgress,
    uploadFile,
    totalProgress,
    calculateHash,
    getHasUploadChunk,
    createChunk,
    mergeChunk,
  }
}
