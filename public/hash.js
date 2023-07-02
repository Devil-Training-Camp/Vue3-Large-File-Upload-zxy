// /public/hash.js

// 导入脚本
self.importScripts("./spark-md5.min.js");

// 生成文件 hash
self.onmessage = e => {
  const file  = e.data;
  const spark = new self.SparkMD5.ArrayBuffer();
  const loadNext = () => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = e => {
      console.log('onload完成');
      spark.append(e.target.result);
      self.postMessage({
        percentage: 100,
        hash: spark.end(),
        suffix: /\.([a-zA-Z0-9]+)$/.exec(file.name)[1]
      });
      self.close();
    };
    reader.onprogress = e => {
      if(e.loaded === e.total) {
        console.time('进度为100%')
      }
      self.postMessage({
        percentage: parseInt(e.loaded / e.total * 100),
        hash: spark.end()
      });
    }
  };
  loadNext();
};