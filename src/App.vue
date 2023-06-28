<template>
  <el-tabs v-model="activeName" class="demo-tabs">
    <el-tab-pane label="单文件上传[FORM-DATA]" name="first">
      <UploadFileFormData />
    </el-tab-pane>
    <el-tab-pane label="单文件上传[BASE64]" name="second">
      <UploadFileBase64 />
    </el-tab-pane>
    <el-tab-pane label="单文件上传[缩略图处理]" name="third"
      >Config</el-tab-pane
    >
    <el-tab-pane label="单文件上传[进度管控]" name="fourth">Role</el-tab-pane>
    <el-tab-pane label="多文件上传" name="fifth">Task</el-tab-pane>
    <el-tab-pane label="拖拽上传" name="sixth">Task</el-tab-pane>
    <el-tab-pane label="大文件上传" name="seventh">Task</el-tab-pane>
  </el-tabs>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import UploadFileFormData from './components/UploadFileFormData.vue'
import UploadFileBase64 from './components/UploadFileBase64.vue'

const activeName = ref('first')
</script>
