// src/utils/config_util.js
const configUtil = {
    gptSystemPrompt: () => {
        return localStorage.getItem('system_prompt') || '';
    },
    gptModel: () => {
        return localStorage.getItem('ai_model') || '';
    },
    azureRegion: () => {
        return localStorage.getItem('azure_region') || '';
    },
    azureLanguage: () => {
        return localStorage.getItem('azure_language') || '';
    },
    audioCaptureMethod: () => {
        return localStorage.getItem('audio_capture_method') || 'default';
    },
};

export default configUtil;
