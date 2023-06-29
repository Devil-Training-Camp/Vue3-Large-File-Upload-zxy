<template>
  <el-tabs v-model="activeName" class="demo-tabs">
    <el-tab-pane label="单文件上传[FORM-DATA]" name="first">
      <UploadFileFormData />
    </el-tab-pane>
    <el-tab-pane label="单文件上传[BASE64]" name="second">
      <UploadFileBase64 />
    </el-tab-pane>
    <el-tab-pane label="单文件上传[缩略图处理]" name="third">
      <UploadFileThumbnail />
    </el-tab-pane>
    <el-tab-pane label="单文件上传[进度管控]" name="fourth">
      <UploadFileProgress />
    </el-tab-pane>
    <el-tab-pane label="多文件上传" name="fifth">
      <UploadFileMultiple />
    </el-tab-pane>
    <el-tab-pane label="大文件上传" name="sixth">
      <UploadFileLarge />
    </el-tab-pane>
  </el-tabs>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import UploadFileFormData from './components/UploadFileFormData.vue'
import UploadFileBase64 from './components/UploadFileBase64.vue'
import UploadFileThumbnail from './components/UploadFileThumbnail.vue'
import UploadFileProgress from './components/UploadFileProgress.vue'
import UploadFileMultiple from './components/UploadFileMultiple.vue'
import UploadFileLarge from './components/UploadFileLarge.vue'

const activeName = ref('first')
</script>
