<template>
  <!-- <v-dialog /> -->
  <modal id="modal" name="modalBox" height="auto" @closed="emitClosed" :classes="computedColor.modalBox" :clickToClose="false" :width="250" :adaptive="true">
      <div class="modalTitle" :class="computedColor.header">
        <h5 class="modalInfo">{{ modalHeader }}</h5>
      </div>
      <div class="modalContent dialog-content" :class="computedColor.content">
        <slot name="content"></slot>
      </div>
      <div class="modalBtnContainer">
        <button type="button" class="btn btn-light modalBtn dualBtn" id="leftBtn" :class="computedColor.button" v-if="!isFailed" @click="hide()">
          <template v-if="!isExport">Cancel</template>
          <template v-else-if="isExport">Continue</template>
        </button>
        <button type="button" class="btn btn-light modalBtn" id="rightBtn" :class="[computedColor.button, isFailed ? singleBtn : dualBtn]" @click="postOk()">
          <template v-if="!isExport">Ok</template>
          <template v-else-if="isExport">Load</template>
        </button>
      </div>
  </modal>
</template>

<script>
export default {
  name: "LabelerModal",
  props: {
    modalName: String,
    modalHeader: String
  },
  data: function () {
    return {
      // vue class bindings
      exportColor: {
        "header" : "exportHeader",
        "content": "exportContent",
        "button": "exportButton",
        "modalBox": "exportBox"
      },
      defaultColor: {
        "header" : "defaultHeader",
        "content": "defaultContent",
        "button": "defaultButton",
        "modalBox": "defaultBox"
      },
      singleBtn: "singleBtn",
      dualBtn: "dualBtn",
      // handle clicking ok
      clickedOk: false
    };
  },
  methods: {
    emitClosed() {
      this.$emit("closed", this.modalName);
    },
    show() {
      this.$modal.show("modalBox");
    },
    hide() {
      this.$modal.hide("modalBox");
    },
    postOk() {
      // this.clickedOk = true;
      this.hide();
      this.$emit("clicked-ok", this.modalName);
    }
  },
  computed: {
    isFailed: function() {
      return this.modalName.includes("failed");
    },
    isExport: function() {
      return this.modalName == "export";
    },
    computedColor: function() {
      return this.isExport ? this.exportColor : this.defaultColor;
    }
  }
};
</script>

<style scoped>
#modal {
  z-index: 1031;
}
.exportHeader {
  background-color: #009a93;
}

.exportContent {
  color: #009a93;
}

.exportButton {
  color: #009a93;
  border-color: #009a93;
}

.exportButton:hover {
  color: #F4F4F4;
  border-color: #009a93;
  background-color: #009a93;
}

#modal >>> .exportBox {
  border-radius: 10px;
  border: 3px solid #009a93;
  position: fixed;
  top: 30%;
  left: 42%;
}

.defaultHeader {
  background-color: #be9a55;
}

.defaultContent {
  color: #be9a55;
}

.defaultButton {
  color: #be9a55;
  border-color: #be9a55;
}

.defaultButton:hover {
  color: #fff;
  border-color: #be9a55;
  background-color: #be9a55;
}

#modal >>> .defaultBox {
  border-radius: 10px;
  border: 3px solid #be9a55;
  position: fixed;
  top: 30%;
  left: 42%;
}

.modalTitle {
  text-align: center;
  color: #fff;
  padding: 15px 15px 10px;
}

.modalContent {
  font-size: 15px;
  text-align: left;
  padding: 20px 15px 10px;
}

.modalBtnContainer {
  display: block;
}

.modalBtn {
  border-radius: 5px;
  margin: 10px 5px;
  padding: 6px 15px;
  border: 2px solid;
}

.dualBtn {
  width: 40%;
}

.singleBtn {
  width: 90%;
}
</style>