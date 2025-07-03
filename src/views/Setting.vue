<template>
  <div class="settings-container">
    <h1>AI Model Settings</h1>
    <div class="desc_text">Choose your AI model and configure related settings:</div>

    <div class="separator">
      <el-input
        placeholder="sk-... (OpenAI API Key)"
        v-model="openai_api_key"
        @change="onKeyChange('openai_api_key')"
        type="password"
        show-password
      >
        <template slot="prepend">OpenAI API Key:</template>
      </el-input>
    </div>
    <div class="separator">
      <el-input
        placeholder="sk-ant-... (Anthropic API Key)"
        v-model="anthropic_api_key"
        @change="onKeyChange('anthropic_api_key')"
        type="password"
        show-password
      >
        <template slot="prepend">Anthropic API Key:</template>
      </el-input>
    </div>
    <div class="separator">
      <el-input
        placeholder="AIza... (Gemini API Key)"
        v-model="gemini_api_key"
        @change="onKeyChange('gemini_api_key')"
        type="password"
        show-password
      >
        <template slot="prepend">Gemini API Key:</template>
      </el-input>
    </div>

    <div class="separator">
      <div class="desc_text">System Prompt:</div>
      <el-input type="textarea" placeholder="You can set up a custom prompt here" :rows="10" v-model="system_prompt" @change="onKeyChange('system_prompt')"/>
    </div>

    <h1>Speech Recognition</h1>
    <el-input placeholder="Input Your Speech Resource Token (KEY 1)" v-model="azure_token" @change="onKeyChange('azure_token')">
      <template slot="prepend">Token:</template>
    </el-input>
    <div class="separator"></div>
    <el-input placeholder="e.g. eastus" v-model="azure_region" @change="onKeyChange('azure_region')">
      <template slot="prepend">Location/Region</template>
    </el-input>
    <div class="separator"></div>
    <el-input placeholder="e.g. en-US" v-model="azure_language" @change="onKeyChange('azure_language')">
      <template slot="prepend">Recognition Language</template>
    </el-input>
  </div>
</template>

<script>
import config_util from "../utils/config_util"

export default {
  name: 'Setting',
  data() {
    return {
      ai_model: localStorage.getItem("ai_model") || "",
      openai_api_key: localStorage.getItem("openai_api_key") || "",
      anthropic_api_key: localStorage.getItem("anthropic_api_key") || "",
      gemini_api_key: localStorage.getItem("gemini_api_key") || "",
      system_prompt: localStorage.getItem("system_prompt") || "",
      azure_token: localStorage.getItem("azure_token") || "",
      azure_region: localStorage.getItem("azure_region") || "",
      azure_language: localStorage.getItem("azure_language") || "",
    }
  },

  methods: {

    toDef() {
      localStorage.clear();
      this.resetData();
    },
    getApiKey(keyName) {
      const localKey = localStorage.getItem(keyName);
      const envKey = process.env[keyName];
      return localKey || envKey || "";
    },
    getAzureToken() {
      const localToken = localStorage.getItem("azure_token");
      const envToken = process.env.VUE_APP_AZURE_TOKEN;
      return localToken || envToken || "";
    },
    onKeyChange(key_name) {
      localStorage.setItem(key_name, this[key_name]);
    },
    resetData() {
      this.ai_model = "";
      this.openai_api_key = "";
      this.anthropic_api_key = "";
      this.gemini_api_key = "";
      this.system_prompt = "";
      this.azure_token = "";
      this.azure_region = "";
      this.azure_language = "";

      localStorage.removeItem("ai_model");
      localStorage.removeItem("openai_api_key");
      localStorage.removeItem("anthropic_api_key");
      localStorage.removeItem("gemini_api_key");
      localStorage.removeItem("system_prompt");
      localStorage.removeItem("azure_token");
      localStorage.removeItem("azure_region");
      localStorage.removeItem("azure_language");
    }
  }
}
</script>

<style scoped>
@import '/src/styles/SettingStyles.css';
</style>
