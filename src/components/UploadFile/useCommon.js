import { ref, reactive } from 'vue'
import SparkMD5 from 'spark-md5'
import request from '@/utils/request.js'

const fileHashProgress = reactive({
  percentage: 0,
  status: ''
})

const uploadFile = reactive({
  data: {},
  info: {
    hash: '',
    suffix: '',
  },
  chunkList: [],
  progress: []
})

const chunkSize = 50 * 1024 * 1024 // 切片大小为50M

export default function useCommon() {
  // 生成hash
  const calculateHash = (file) => {
    return new Promise((resolve) => {
      // 添加 worker 属性
      const worker = new Worker("../../../public/hash.js");
      worker.postMessage(file);
      worker.onmessage = e => {
        const { percentage, hash, suffix } = e.data;
        fileHashProgress.percentage = percentage
        if(percentage === 100) {
          fileHashProgress.status = 'success'
          uploadFile.info.hash = hash
        }
        if(suffix) {
          uploadFile.info.suffix = suffix
          resolve()
        }
      };
    });
  }
  // 计算文件hash
  const getFileHash = (file) => {
    return new Promise((resolve) => {
      const fileReader = new FileReader()
      fileReader.readAsArrayBuffer(file)
      fileReader.onload = (ev) => {
        console.log('load', ev);
        fileHashProgress.percentage = 100
        fileHashProgress.status = 'success'
        const buffer = ev.target.result
        const spark = new SparkMD5.ArrayBuffer()
        let hash = null
        let suffix = null
        spark.append(buffer)
        hash = spark.end()
        suffix = /\.([a-zA-Z0-9]+)$/.exec(file.name)[1]
        resolve({
          buffer,
          hash,
          suffix,
          filename: `${hash}.${suffix}`,
        })
      }
      fileReader.onprogress = (ev) => {
        fileHashProgress.percentage = parseInt(ev.loaded / ev.total * 100)
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
    console.log('已经上传切片列表', hash);
    const res = await request.post('/upload_already', 
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
    calculateHash,
    getFileHash,
    getHasUploadChunk,
    createChunk,
    mergeChunk
  }
}