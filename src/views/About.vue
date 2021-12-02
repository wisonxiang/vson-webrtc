<template>
  <!-- <el-dialog v-model="dialogVisible" :close-on-click-modal="false">
    <el-form ref="form" :model="formData" label-width="60px">
      <el-form-item label="房间号">
        <el-input v-model="formData.roomId" :maxlength="3"></el-input>
      </el-form-item>
    </el-form>
  </el-dialog> -->
  <el-form ref="form" :model="formData" label-width="60px">
    <el-form-item label="房间号">
      <el-input v-model="formData.roomId" :maxlength="3"></el-input>
    </el-form-item>
  </el-form>
</template>

<script>
import { ElButton, ElDialog, ElForm, ElFormItem, ElInput } from "element-plus";
import { ref } from "vue";
import "mosha-vue-toastify/dist/style.css";
export default {
  name: "Home",
  components: {
    ElDialog,
    ElForm,
    ElFormItem,
    ElInput,
  },
  setup() {
    const dialogVisible = ref(true);
    const formData = ref({ roomId: "" });
    return {
      dialogVisible,
      formData,
    };
  },
};
</script>

