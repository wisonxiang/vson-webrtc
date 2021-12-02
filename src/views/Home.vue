<template>
  <div class="page-wrap">
    <div class="handler-wrap">
      <el-button @click="openDialog">开始</el-button>
      <el-button @click="leaveRoom">停止</el-button>
    </div>
    <div class="page" v-if="playerVisible">
      <video autoplay ref="myPlayer" class="player-box"></video>
      <video autoplay ref="otherPlayer" class="player-box"></video>
    </div>
  </div>
  <el-dialog v-model="dialogVisible" @close="closeDialog" :close-on-click-modal="false">
    <div class="room-item">
      <span class="room-item-name">房间号</span>
      <el-input v-model.trim="formData.roomId" :maxlength="3" @keyup.enter="confirm"></el-input>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="confirm">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { ElButton, ElDialog, ElInput } from "element-plus";
import { createToast } from "mosha-vue-toastify";
import "mosha-vue-toastify/dist/style.css";
import { nextTick, ref } from "vue";
export default {
  name: "Home",
  components: {
    ElButton,
    ElDialog,
    ElInput,
  },
  setup() {
    const playerVisible = ref(true);
    const myPlayer = ref(null);
    const otherPlayer = ref(null);
    let localStream;
    async function startPlay() {
      const constrants = {
        video: { width: 450, height: 450 },
        audio: false,
      };
      localStream = await navigator.mediaDevices.getUserMedia(constrants);
      myPlayer.value.srcObject = localStream;
    }

    function stopPlay() {
      if (localStream && localStream.getTracks()) {
        localStream.getTracks().forEach((track) => {
          track.stop();
        });
        localStream = undefined;
        playerVisible.value = false;
        nextTick(() => {
          playerVisible.value = true;
        });
      }
    }

    const dialogVisible = ref(false);
    const formData = ref({ roomId: "" });
    function openDialog() {
      dialogVisible.value = true;
    }
    function closeDialog() {
      dialogVisible.value = false;
      formData.value = { roomId: "" };
    }

    function confirm() {
      if (!formData.value.roomId) return;
      if (formData.value.roomId != 100 && formData.value.roomId != 200) {
        createToast("该房间号暂未开发！", {
          position: "top-center",
          hideProgressBar: true,
          showCloseButton: false,
        });
      } else {
        // startSocket();
        joinRoom();
      }
      closeDialog();
    }

    let socket;
    function joinRoom() {
      socket = window.io("/", { path: "/socket.io" });
      socket.emit("join", { roomID: formData.value.roomId });
      socket.on("connect", () => {
        console.log("connect");
      });
      socket.on("joined", () => {
        console.log("joined");
        createPeerConnection();
      });
      socket.on("other joined", async () => {
        console.log("other joined");
        await createPeerConnection();
        socket.emit("ready");
      });
      socket.on("ready", () => {
        console.log("ready");
        createOffer();
      });
      socket.on("leaved", () => {
        console.log("leaved");
        leaveRoom();
      });
      socket.on("fulled", () => {
        console.log("the room is fulled");
        socket.close();
      });
      socket.on("server message", (data) => {
        console.log("server message", data);
        if (data.type == "dsp") {
          createAnswer(data);
        } else if (data.type == "ice") {
          const candidate = new RTCIceCandidate({
            sdpMLineIndex: data.candidate.sdpMLineIndex,
            candidate: data.candidate.candidate,
          });
          pc.addIceCandidate(candidate);
        }
      });
    }
    function leaveRoom() {
      stopPlay();
      if (socket) {
        socket.close();
      }
      if (pc) {
        pc.close();
        pc = null;
      }
    }

    let pc;
    async function createPeerConnection() {
      if (!pc) {
        const pcConfig = {
          iceServers: [
            {
              urls: "turn:doc.vson.top:3478",
              credential: "test123",
              username: "test",
            },
          ],
        };
        pc = new RTCPeerConnection(pcConfig);
      }
      await startPlay();
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
      pc.onicecandidate = (e) => {
        console.log("e", e.candidate);
        if (e.candidate) {
          socket.emit("client message", {
            sdpMLineIndex: e.sdpMLineIndex,
            candidate: e.candidate,
            sdpMid: e.sdpMid,
            type: "ice",
            side: "create",
          });
        }
      };
      pc.ontrack = (e) => {
        otherPlayer.value.srcObject = e.streams[0];
      };
    }

    function createOffer() {
      const offerOptions = {
        offerToRecieveAudio: 0,
        offerToRecieveVideo: 1,
      };
      pc.createOffer(offerOptions).then((desc) => {
        pc.setLocalDescription(desc);
        socket.emit("client message", { desc, type: "dsp", side: "create" });
      });
    }
    function createAnswer(data) {
      pc.setRemoteDescription(new RTCSessionDescription(data.desc));
      if (data.side == "create") {
        pc.createAnswer().then((desc) => {
          pc.setLocalDescription(desc);
          socket.emit("client message", {
            desc,
            type: "dsp",
            side: "answer",
          });
        });
      }
    }

    return {
      playerVisible,
      myPlayer,
      otherPlayer,
      startPlay,
      stopPlay,
      leaveRoom,

      dialogVisible,
      formData,
      openDialog,
      closeDialog,
      confirm,
    };
  },
};
</script>

<style lang="scss" scoped>
.page-wrap {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  .handler-wrap {
    width: 100%;
    height: 100px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .page {
    width: 1000px;
    display: flex;
    justify-content: center;
    .player-box {
      width: 450px;
      height: 450px;
      border: 1px solid green;
      &:first-child {
        margin-right: 20px;
      }
      &:last-child {
        margin-left: 20px;
      }
    }
  }
}
.room-item {
  display: flex;
  .room-item-name {
    white-space: nowrap;
    line-height: 40px;
    margin-right: 10px;
  }
}
</style>
