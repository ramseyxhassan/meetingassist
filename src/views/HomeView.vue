<template>
  <div class="homeview-container">
    <div class="center-container">
      <!-- Speech Recognition Section -->
      <div class="box speech-recognition">
        <div class="func-desc">
          <i class="el-icon-microphone"></i>
          Speech Recognition Results
        </div>
        <div v-if="state === 'ing'" class="real-time-transcription">
          <div class="transcription-title">Real-time Transcription:</div>
          <div class="transcription-content">{{ realtimeTranscript }}</div>
        </div>
        <div v-if="speakerSegments.length === 0" class="no-content">No Content</div>
        <div class="asr-content">
          <div
              v-for="(segment, index) in speakerSegments"
              :key="index"
              class="sentence-box"
              :class="{
      'selected': selectedSegmentIndices.includes(index),
      ['speaker-' + segment.speakerLabel.replace(/\s+/g, '-').toLowerCase()]: true
    }"
              @click="selectSegment(index)"
          >
            <div class="speaker-label">{{ segment.speakerLabel }}</div>
            {{ segment.text }}
          </div>
        </div>
        <div class="single-part-bottom-bar">
          <el-button
              icon="el-icon-delete"
              :disabled="speakerSegments.length === 0"
              @click="clearASRContent"
          >
            Clear Text
          </el-button>
          <el-button
              icon="el-icon-circle-close"
              :disabled="selectedSegmentIndices.length === 0"
              @click="deselectAllSegments"
          >
            Deselect All
          </el-button>
        </div>
      </div>

      <!-- AI Answers Section -->
      <div class="box ai-answers">
        <div class="func-desc">
          <i class="el-icon-s-custom"></i>
          AI
        </div>
        <div class="ai-result-content">
          <div v-for="(response, index) in aiResponses" :key="index" class="ai-response-box">
            <div class="ai-system-prompt">System Prompt: {{ response.systemPrompt }}</div>
            <div class="ai-query">Query: {{ response.query }}</div>
            <div class="ai-answer">{{ response.answer }}</div>
            <div class="ai-model">Model: {{ response.model }}</div>
            <div class="ai-actions">
              <el-button size="mini" @click="prepareFollowUp(index)">Follow-up</el-button>
            </div>
          </div>
        </div>
        <LoadingIcon v-show="show_ai_thinking_effect" />
        <div class="single-part-bottom-bar">
          <el-select v-model="selectedAiModel" placeholder="Select AI Model" @change="onAiModelChange" style="margin-right: 10px;">
            <!-- ... options ... -->
          </el-select>
          <el-button
              icon="el-icon-thumb"
              @click="askSelectedSegments"
              :disabled="!isAskAIAvailable"
          >
            Ask AI
          </el-button>
          <el-button
              icon="el-icon-delete"
              @click="clearAIResponses"
              :disabled="aiResponses.length === 0"
          >
            Clear AI Responses
          </el-button>
        </div>
        <div class="custom-prompt-section">
          <el-input
              v-model="customPrompt"
              type="textarea"
              :rows="3"
              placeholder="Enter your custom prompt here"
          ></el-input>
          <el-button
              icon="el-icon-s-promotion"
              @click="askCustomPrompt"
              :disabled="!customPrompt.trim()"
          >
            Ask Custom Prompt
          </el-button>
        </div>
      </div>
    </div>

    <!-- Control Bar -->
    <div class="title-function-bar">
      <el-button
          type="primary"
          @click="startCopilot"
          v-show="state === 'end'"
          :loading="copilot_starting"
          :disabled="copilot_starting"
      >
        Start Copilot
      </el-button>
      <el-button
          type="danger"
          :loading="copilot_stopping"
          @click="userStopCopilot"
          v-show="state === 'ing'"
      >
        Stop Copilot
      </el-button>
      <el-button
          type="warning"
          @click="toggleStreaming"
          v-show="state === 'ing'"
          :disabled="copilot_stopping"
      >
        {{ streamingEnabled ? 'Stop Streaming' : 'Start Streaming' }}
      </el-button>
      <el-button
          v-if="audioSource !== 'system'"
          @click="toggleMicrophone"
          :type="microphoneMuted ? 'warning' : 'success'"
          icon="el-icon-microphone"
          v-show="state === 'ing'"
      >
        {{ microphoneMuted ? 'Unmute' : 'Mute' }} Microphone
      </el-button>
      <el-select v-model="audioSource" placeholder="Select Audio Source" @change="onAudioSourceChange">
        <el-option label="Microphone Only" value="microphone"></el-option>
        <el-option label="System Audio Only" value="system"></el-option>
        <el-option label="Microphone + System Audio" value="combined"></el-option>
      </el-select>
      <MyTimer ref="MyTimer" @update="updateTimer" />
      <!-- Speaker Labeling Controls -->
      <div class="speaker-labeling-controls">
        <el-select v-model="currentSpeaker" placeholder="Select Speaker" @change="onSpeakerChange">
          <el-option
              v-for="speaker in knownSpeakers"
              :key="speaker"
              :label="speaker"
              :value="speaker"
          ></el-option>
        </el-select>
        <el-select v-model="currentLabel" placeholder="Select Label" @change="onLabelChange">
          <el-option
              v-for="label in labelOptions"
              :key="label"
              :label="label"
              :value="label"
          ></el-option>
        </el-select>
        <el-button @click="applySpeakerLabel" :disabled="!currentSpeaker || !currentLabel">
          Apply Label
        </el-button>
      </div>

      <!-- Debugging Information -->
    </div>

    <!-- Follow-up Dialog -->
    <el-dialog
        title="Follow-up Question"
        :visible.sync="showFollowUpDialog"
        width="50%"
    >
      <div v-if="selectedSegmentIndices.length > 0">
        <p>Selected text for follow-up:</p>
        <div v-for="(index, i) in selectedSegmentIndices" :key="i" class="selected-text">
          {{ speakerSegments[index].text }}
        </div>
      </div>
      <el-input
          v-model="followUpQuestion"
          type="textarea"
          :rows="4"
          :placeholder="selectedSegmentIndices.length > 0 ? 'Enter your follow-up question based on the selected text' : 'Enter your follow-up question'"
      ></el-input>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showFollowUpDialog = false">Cancel</el-button>
        <el-button type="primary" @click="askFollowUp">Ask Follow-up</el-button>
      </span>
    </el-dialog>

    <!-- Error Message Dialog -->
    <el-dialog
        title="Error"
        :visible.sync="showErrorDialog"
        width="50%"
    >
      <p>{{ errorMessage }}</p>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showErrorDialog = false">OK</el-button>
      </span>
    </el-dialog>
  </div>
</template>


<script>
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import OpenAI from "openai";
import { Anthropic } from "@anthropic-ai/sdk";
import config_util from "../utils/config_util";
import LoadingIcon from "@/components/LoadingIcon.vue";
import MyTimer from "@/components/MyTimer.vue";

export default {
  name: "HomeView",
  components: { LoadingIcon, MyTimer },

  data() {
    return {
      // Speech recognition related data
      speakerSegments: [],
      selectedSegmentIndex: -1,
      realtimeTranscript: "",
      conversationTranscriber: null,

      // Copilot state
      state: "end", // "end" or "ing"
      copilot_starting: false,
      copilot_stopping: false,

      // AI interaction related data
      aiResponses: [],
      show_ai_thinking_effect: false,
      customPrompt: "",
      selectedAiModel: localStorage.getItem("ai_model") || "gpt-4o",
      conversationHistory: [],
      selectedSegmentIndices: [],
      isStreaming: false,
      streamingEnabled: false,
      maxTokens: 4000,

      // Audio related data
      audioStream: null,
      audioSource: 'microphone',
      microphoneMuted: false,

      // UI related data
      showFollowUpDialog: false,
      followUpQuestion: "",
      selectedResponseIndex: -1,
      showErrorDialog: false,
      errorMessage: "",

      //labeling
      currentSpeaker: '',
      currentLabel: '',
      speakerLabels: {},
      knownSpeakers: ['Guest 1', 'Guest 2', 'Guest 3'], // Add more as needed
      labelOptions: ['Interviewee', 'Interviewer 1', 'Interviewer 2', 'Interviewer 3'],

      // Persistent state
      persistentState: {
        isRunning: false,
        timerValue: 0
      }
    };
  },

  computed: {
    isAskAIAvailable() {
      return this.selectedSegmentIndices.length > 0;
    },
  },
  methods: {
    // Copilot Control Methods
    async startCopilot() {
      this.copilot_starting = true;
      try {
        await this.startConversationTranscription();
        this.copilot_starting = false;
        this.state = "ing";
        this.$refs.MyTimer.start();
        this.persistentState.isRunning = true;
        this.saveState();
      } catch (error) {
        this.copilot_starting = false;
        this.showError(error.message);
        this.speakerSegments.push({ speakerId: "Error", text: error.message });
        this.saveState();
      }
    },

    userStopCopilot() {
      this.copilot_stopping = true;
      if (this.conversationTranscriber) {
        this.conversationTranscriber.stopTranscribingAsync(
            () => {
              this.copilot_stopping = false;
              this.state = "end";
              this.$refs.MyTimer.stop();
              if (this.audioStream) {
                this.audioStream.getTracks().forEach(track => track.stop());
                this.audioStream = null;
              }
              this.persistentState.isRunning = false;
              this.saveState();
            },
            (err) => {
              console.error("Error stopping transcription:", err);
              this.showError("Error stopping transcription: " + err.message);
            }
        );
      }
    },

    // Speech Recognition Methods
    async startConversationTranscription() {
      const speechKey = localStorage.getItem("azure_token");
      const region = localStorage.getItem("azure_region");
      const language = localStorage.getItem("azure_language");

      if (!speechKey || !region || !language) {
        throw new Error("Please set up Azure Speech key, region, and language in settings");
      }

      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(speechKey, region);
      speechConfig.speechRecognitionLanguage = language;
      speechConfig.setProfanity(SpeechSDK.ProfanityOption.Raw);

      try {
        const audioConfig = await this.setupAudioConfiguration();
        this.initializeConversationTranscriber(speechConfig, audioConfig);
        await this.startTranscribing();
      } catch (error) {
        console.error("Error in conversation transcription setup:", error);
        throw error;
      }
    },

    async setupAudioConfiguration() {
      try {
        if (this.audioSource === 'system' || this.audioSource === 'combined') {
          const systemStream = await navigator.mediaDevices.getDisplayMedia({
            audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 },
            video: { displaySurface: "browser" }
          });

          const systemAudioTracks = systemStream.getAudioTracks();
          if (systemAudioTracks.length === 0) {
            throw new Error("No system audio captured. Please ensure you've selected an audio source and allowed audio sharing.");
          }

          if (this.audioSource === 'combined') {
            const micStream = await navigator.mediaDevices.getUserMedia({
              audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 }
            });

            const micAudioTracks = micStream.getAudioTracks();
            if (micAudioTracks.length === 0) {
              throw new Error("No microphone audio captured. Please check your microphone settings and permissions.");
            }

            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const systemSource = audioContext.createMediaStreamSource(systemStream);
            const micSource = audioContext.createMediaStreamSource(micStream);
            const destination = audioContext.createMediaStreamDestination();

            const systemGain = audioContext.createGain();
            const micGain = audioContext.createGain();

            systemGain.gain.value = 0.5;
            micGain.gain.value = 0.5;

            systemSource.connect(systemGain).connect(destination);
            micSource.connect(micGain).connect(destination);

            this.audioStream = destination.stream;
          } else {
            this.audioStream = systemStream;
          }
        } else {
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 }
          });

          const micAudioTracks = micStream.getAudioTracks();
          if (micAudioTracks.length === 0) {
            throw new Error("No microphone audio captured. Please check your microphone settings and permissions.");
          }

          this.audioStream = micStream;
        }

        return SpeechSDK.AudioConfig.fromStreamInput(this.audioStream);
      } catch (error) {
        console.error("Error capturing audio:", error);
        throw this.handleAudioSetupError(error);
      }
    },

    handleAudioSetupError(error) {
      if (error.name === 'NotAllowedError') {
        return new Error("Permission to access audio was denied. Please grant permission and try again.");
      } else if (error.name === 'NotFoundError') {
        return new Error("No audio source was found. Please check your audio settings and try again.");
      } else if (error.name === 'NotReadableError' || error.name === 'AbortError') {
        return new Error("Unable to access the selected audio source. Please try selecting a different source or restart your browser.");
      } else {
        return new Error(`Failed to capture audio: ${error.message}. Please try again or select a different audio source.`);
      }
    },

    initializeConversationTranscriber(speechConfig, audioConfig) {
      this.conversationTranscriber = new SpeechSDK.ConversationTranscriber(speechConfig, audioConfig);

      this.conversationTranscriber.sessionStarted = (s, e) => {
        console.log("Session started event.");
      };

      this.conversationTranscriber.sessionStopped = (s, e) => {
        console.log("Session stopped event.");
        this.conversationTranscriber.stopTranscribingAsync();
      };

      this.conversationTranscriber.canceled = (s, e) => {
        console.log("Canceled event.");
        this.speakerSegments.push({ speakerId: "System", text: `Transcription canceled: ${e.errorDetails}` });
        this.conversationTranscriber.stopTranscribingAsync();
      };

      this.conversationTranscriber.transcribing = (s, e) => {
        this.updateRealtimeTranscription(e.result.text);
        this.updateTranscription(e.result.speakerId, e.result.text, true);
      };

      this.conversationTranscriber.transcribed = (s, e) => {
        this.updateRealtimeTranscription("");
        this.updateTranscription(e.result.speakerId, e.result.text, false);
      };
    },

    startTranscribing() {
      return new Promise((resolve, reject) => {
        this.conversationTranscriber.startTranscribingAsync(
            () => {
              console.log("Transcription started");
              resolve();
            },
            (err) => {
              console.error("Transcription start failed", err);
              reject(err);
            }
        );
      });
    },

    updateRealtimeTranscription(text) {
      this.realtimeTranscript = text;
    },

    updateTranscription(speakerId, text, isPartial) {
      console.log(`updateTranscription called: speakerId=${speakerId}, text=${text}, isPartial=${isPartial}`);

      if (!text.trim()) {
        console.log('Text is empty, returning');
        return;
      }

      // Use the speakerId as the initial label, which should be "Guest 1", "Guest 2", etc.
      let speakerLabel = this.getSpeakerLabel(speakerId);
      console.log(`Speaker label: ${speakerLabel}`);

      // Update real-time transcription regardless of speaker
      this.realtimeTranscript = text;
      console.log(`Updated realtimeTranscript: ${this.realtimeTranscript}`);

      // Only process for speakerSegments if the speaker is not Unidentified and not partial
      if (speakerId !== "Unidentified" && !isPartial) {
        console.log('Processing for speakerSegments');

        // Create a new segment for each complete sentence
        const newSegment = { speakerId, speakerLabel, text: text.trim() };
        console.log('New segment created:', newSegment);

        // Process the completed segment (this might trigger streaming if enabled)
        this.processCompletedSegment(newSegment);

        // Check if the last segment is from the same speaker and incomplete
        if (this.speakerSegments.length > 0) {
          const lastSegment = this.speakerSegments[this.speakerSegments.length - 1];
          console.log('Last segment:', lastSegment);

          if (lastSegment.speakerId === speakerId && !this.isCompleteSentence(lastSegment.text)) {
            console.log('Appending to last segment');
            // Append to the last segment if it's incomplete
            lastSegment.text += " " + newSegment.text;
            if (this.isCompleteSentence(lastSegment.text)) {
              console.log('Last segment is now complete');
              // If it's now complete, create a new segment for any remaining text
              const remainingText = this.getRemainingSentence(lastSegment.text);
              if (remainingText) {
                console.log('Adding remaining text as new segment');
                this.speakerSegments.push({ speakerId, speakerLabel, text: remainingText });
              }
            }
          } else {
            console.log('Adding as new segment');
            // Add as a new segment
            this.speakerSegments.push(newSegment);
          }
        } else {
          console.log('First segment, adding it');
          // If it's the first segment, just add it
          this.speakerSegments.push(newSegment);
        }

        // Clean up empty segments
        this.speakerSegments = this.speakerSegments.filter(segment => segment.text.trim().length > 0);
        console.log('Current speakerSegments:', this.speakerSegments);
      }

      this.saveState();
      console.log('State saved');
    },

    async processCompletedSegment(segment) {
      console.log('Processing completed segment:', segment);

      if (this.streamingEnabled && this.isCompleteSentence(segment.text) && this.isQuestionOrInterviewPhrase(segment.text)) {
        console.log('Streaming enabled and segment is a question/interview phrase');
        const context = this.getPreviousSegments(30);
        const fullContent = context.map(s => `${s.speakerLabel}: ${s.text}`).join('\n');

        try {
          const answer = await this.askAI(fullContent);
          this.aiResponses.unshift({
            query: segment.text,
            answer: answer,
            model: this.selectedAiModel
          });
          console.log('AI response added');
        } catch (e) {
          console.error("Error getting streaming AI answer:", e);
        }
      }

      // Make sure to add the segment to speakerSegments here if it's not already being done
      if (!this.speakerSegments.includes(segment)) {
        this.speakerSegments.push(segment);
        console.log('Segment added to speakerSegments');
      }
    },

    isCompleteSentence(text) {
      const result = /[.!?]$/.test(text.trim());
      console.log(`isCompleteSentence: ${text} => ${result}`);
      return result;
    },

    getRemainingSentence(text) {
      const match = text.match(/(.*[.!?])\s*(.*)/);
      const result = match ? match[2] : '';
      console.log(`getRemainingSentence: ${text} => ${result}`);
      return result;
    },

    clearASRContent() {
      this.speakerSegments = [];
      this.selectedSegmentIndices = [];
      this.realtimeTranscript = "";
      this.saveState();
    },

    selectSegment(index) {
      const selectionIndex = this.selectedSegmentIndices.indexOf(index);
      if (selectionIndex === -1) {
        this.selectedSegmentIndices.push(index);
      } else {
        this.selectedSegmentIndices.splice(selectionIndex, 1);
      }
    },

    // AI Interaction Methods
    async askAI(content, isFollowUp = false) {
      const apiKey = this.selectedAiModel.startsWith('gpt') || this.selectedAiModel.startsWith('o1')
          ? localStorage.getItem("openai_api_key")
          : localStorage.getItem("anthropic_api_key");

      if (!apiKey) {
        throw new Error(`Please set up an ${this.selectedAiModel.startsWith('gpt') || this.selectedAiModel.startsWith('o1') ? 'OpenAI' : 'Anthropic'} API Key in settings!`);
      }

      const systemPrompt = localStorage.getItem("system_prompt") || "";

      let messages = [];
      if (systemPrompt) {
        messages.push({ role: "system", content: systemPrompt });
      }
      messages.push({ role: "user", content: content });

      let response;
      try {
        if (this.selectedAiModel.startsWith('gpt') || this.selectedAiModel.startsWith('o1')) {
          const openai = new OpenAI({ apiKey: apiKey, dangerouslyAllowBrowser: true });

          // Determine the correct parameter based on the model
          const parameter = this.selectedAiModel === 'o1-preview' ? 'max_completion_tokens' : 'max_tokens';

          response = await openai.chat.completions.create({
            model: this.selectedAiModel,
            messages: messages,
            [parameter]: this.maxTokens,
          });

          response = response.choices[0]?.message?.content || "";
        } else {
          const anthropic = new Anthropic({ apiKey: apiKey, dangerouslyAllowBrowser: true });
          response = await anthropic.messages.create({
            model: this.selectedAiModel,
            max_tokens: this.maxTokens,
            messages: messages,
          });
          response = response.content[0].text;
        }
      } catch (error) {
        if (error.message.includes("maximum context length") || error.message.includes("token limit")) {
          console.log("Token limit reached. Starting a new conversation.");
          this.conversationHistory = [];
          return this.askAI(content, isFollowUp); // Retry with a fresh conversation
        }
        throw error;
      }

      this.conversationHistory.push({ role: "assistant", content: response });
      this.saveState();
      return response;
    },

    onSpeakerChange() {
      console.log('Speaker changed to:', this.currentSpeaker);
      // Don't reset the label here
    },

    onLabelChange() {
      console.log('Label changed to:', this.currentLabel);
      if (this.currentSpeaker && this.currentLabel) {
        this.applySpeakerLabel(this.currentSpeaker, this.currentLabel);
      }
    },

    applySpeakerLabel() {
      console.log('Applying label:', this.currentSpeaker, this.currentLabel);
      if (!this.currentSpeaker || !this.currentLabel) return;

      this.$set(this.speakerLabels, this.currentSpeaker, this.currentLabel);

      // Apply the label to all existing segments
      this.speakerSegments.forEach(segment => {
        if (segment.speakerId === this.currentSpeaker) {
          this.$set(segment, 'speakerLabel', this.currentLabel);
        }
      });

      // We're not resetting currentSpeaker and currentLabel anymore

      this.saveState();
    },

    getSpeakerLabel(speakerId) {
      return this.speakerLabels[speakerId] || speakerId;
    },

    isQuestionOrInterviewPhrase(text) {
      const questionStarters = [
        'who', 'what', 'where', 'when', 'why', 'how', 'can', 'could', 'would', 'do', 'did',
        'have', 'will', 'is', 'are', 'tell', 'explain', 'describe', 'give', 'share', 'which',
        'should', 'may', 'might', 'shall', 'was', 'were', 'has', 'had', 'does', 'time', 'strength',
        'write', 'type', 'modify', 'time', 'complexity'
      ];

      const interviewPhrases = [
        // Common interview questions
        "tell me about yourself", "walk me through your resume", "what are your strengths",
        "what are your weaknesses", "why do you want this job", "why should we hire you",
        "where do you see yourself in 5 years", "what are your salary expectations",
        "why are you leaving your current job", "what do you know about our company",
        "what is your greatest achievement", "how do you handle stress",
        "what is your work style", "are you a team player", "how do you handle conflict",
        "what are your career goals", "what motivates you", "why do you want to work here",
        "what makes you unique", "what are your hobbies", "how do you define success",

        // Behavioral questions
        "tell me about a time when", "give me an example of", "describe a situation where",
        "how did you handle", "what was your role in", "how do you approach",
        "walk me through", "can you explain", "how would you handle",
        "what do you think about", "what would you do if", "how do you prioritize",
        "can you give an example of", "how do you manage", "what did you learn from",

        // Situational questions
        "how would you deal with", "what would you do in", "how might you",
        "suppose you were", "imagine a scenario where", "if you were faced with",

        // Leadership and problem-solving
        "how do you lead a team", "what's your leadership style", "how do you motivate others",
        "how do you solve complex problems", "what's your decision-making process",
        "how do you handle difficult employees", "how do you delegate tasks",

        // Technical and skill-based
        "how proficient are you in", "what experience do you have with",
        "how would you rate your skills in", "tell me about a project where you used",
        "how do you stay updated with industry trends", "what certifications do you have",

        // Culture fit and soft skills
        "how do you adapt to change", "how do you handle criticism",
        "how do you contribute to company culture", "what type of work environment do you prefer",
        "how do you maintain work-life balance", "how do you handle tight deadlines",

        // Career development
        "why did you choose this career path", "how has your education prepared you",
        "what professional development activities do you pursue",
        "where do you see the industry heading", "what are your long-term career aspirations",

        // Company-specific
        "what do you think sets our company apart", "how would you improve our product/service",
        "what challenges do you think our industry faces", "why are you interested in this role",

        // Closing questions
        "do you have any questions for us", "is there anything else you'd like to add",
        "what should i know that's not on your resume",
        "moving on to", "let's shift gears to", "to wrap things up" , "one final question", "before we conclude"
      ];

      const lowerText = text.toLowerCase();

      // Check for question mark
      if (lowerText.includes('?')) return true;

      // Check for question starters
      if (questionStarters.some(starter => lowerText.startsWith(starter))) return true;

      // Check for interview phrases
      if (interviewPhrases.some(phrase => lowerText.includes(phrase))) return true;

      return false;
    },

    async askSelectedSegments() {
      if (this.selectedSegmentIndices.length === 0) return;

      let content = this.selectedSegmentIndices
          .sort((a, b) => a - b)
          .map(index => this.speakerSegments[index].text)
          .join("\n");

      this.show_ai_thinking_effect = true;

      try {
        const answer = await this.askAI(`Please respond to the following transcript:\n\n${content}`);
        this.show_ai_thinking_effect = false;
        this.aiResponses.unshift({
          query: content,
          systemPrompt: localStorage.getItem("system_prompt") || "",
          answer: answer,
          model: this.selectedAiModel
        });
        this.selectedSegmentIndices = []; // Clear selection after asking
      } catch (e) {
        this.show_ai_thinking_effect = false;
        this.aiResponses.unshift({
          query: content,
          systemPrompt: localStorage.getItem("system_prompt") || "",
          answer: "Error: " + e.message,
          model: this.selectedAiModel
        });
        this.showError("Error getting AI answer: " + e.message);
      }
      this.saveState();
    },

    async askCustomPrompt() {
      if (!this.customPrompt.trim()) return;

      this.show_ai_thinking_effect = true;
      const aiSystemPrompt = config_util.gptSystemPrompt();
      const content = aiSystemPrompt + "\n" + this.customPrompt;

      try {
        const answer = await this.askAI(content);
        this.show_ai_thinking_effect = false;
        this.aiResponses.unshift({
          query: this.customPrompt,
          answer: answer,
          model: this.selectedAiModel
        });
        this.customPrompt = "";
      } catch (e) {
        this.show_ai_thinking_effect = false;
        this.aiResponses.unshift({
          query: this.customPrompt,
          answer: "Error: " + e.message,
          model: this.selectedAiModel
        });
        this.showError("Error getting AI answer: " + e.message);
      }
      this.saveState();
    },

    clearAIResponses() {
      this.aiResponses = [];
      this.conversationHistory = [];
      this.saveState();
    },

    deselectAllSegments() {
      this.selectedSegmentIndices = [];
    },

    prepareFollowUp(index) {
      this.selectedResponseIndex = index;
      this.followUpQuestion = ''; // Clear previous follow-up question
      this.showFollowUpDialog = true;
    },

    async askFollowUp() {
      if ((this.selectedSegmentIndices.length === 0 && !this.followUpQuestion) ||
          (this.selectedResponseIndex === -1 && this.selectedSegmentIndices.length === 0)) return;

      this.show_ai_thinking_effect = true;
      const aiSystemPrompt = config_util.gptSystemPrompt();

      let content = '';
      if (this.selectedSegmentIndices.length > 0) {
        content = this.selectedSegmentIndices
            .sort((a, b) => a - b)
            .map(index => this.speakerSegments[index].text)
            .join("\n");
        content += "\n\nFollow-up question: " + this.followUpQuestion;
      } else {
        content = this.followUpQuestion;
      }

      content = aiSystemPrompt + "\n" + content;

      try {
        const answer = await this.askAI(content, true);
        this.show_ai_thinking_effect = false;
        this.aiResponses.unshift({
          query: this.followUpQuestion,
          answer: answer,
          model: this.selectedAiModel
        });
      } catch (e) {
        this.show_ai_thinking_effect = false;
        this.aiResponses.unshift({
          query: this.followUpQuestion,
          answer: "Error: " + e.message,
          model: this.selectedAiModel
        });
        this.showError("Error getting follow-up answer: " + e.message);
      }

      this.showFollowUpDialog = false;
      this.followUpQuestion = "";
      this.selectedResponseIndex = -1;
      this.selectedSegmentIndices = []; // Clear selection after asking
      this.saveState();
    },

    toggleStreaming() {
      this.streamingEnabled = !this.streamingEnabled;
      if (this.streamingEnabled) {
        this.startStreaming();
      } else {
        this.stopStreaming();
      }
    },

    startStreaming() {
      this.isStreaming = true;
      // Additional logic for starting streaming if needed
    },

    stopStreaming() {
      this.isStreaming = false;
      // Additional logic for stopping streaming if needed
    },

    getPreviousSegments(count) {
      const currentIndex = this.speakerSegments.length - 1;
      const startIndex = Math.max(0, currentIndex - count + 1);
      return this.speakerSegments.slice(startIndex, currentIndex + 1);
    },

    // Audio Control Methods
    toggleMicrophone() {
      if (this.audioStream) {
        const audioTracks = this.audioStream.getAudioTracks();
        audioTracks.forEach(track => {
          if (track.kind === 'audio') {
            track.enabled = this.microphoneMuted;
          }
        });
        this.microphoneMuted = !this.microphoneMuted;
      }
    },

    onAudioSourceChange() {
      if (this.state === 'ing') {
        this.userStopCopilot();
        this.$nextTick(() => {
          this.startCopilot();
        });
      }
    },

    // UI Update Methods
    showError(message) {
      this.errorMessage = message;
      this.showErrorDialog = true;
    },

    onAiModelChange() {
      localStorage.setItem("ai_model", this.selectedAiModel);
      this.conversationHistory = [];
      this.saveState();
    },

    // State Management Methods
    saveState() {
      console.log('Saving state');
      this.persistentState.timerValue = this.$refs.MyTimer.getTime();
      const stateToSave = {
        isRunning: this.persistentState.isRunning,
        timerValue: this.persistentState.timerValue,
        speakerSegments: this.speakerSegments,
        aiResponses: this.aiResponses,
        conversationHistory: this.conversationHistory,
        state: this.state,
        speakerLabels: this.speakerLabels
      };
      console.log('State to save:', stateToSave);
      localStorage.setItem('copilotState', JSON.stringify(stateToSave));
    },

    loadState() {
      const savedState = localStorage.getItem('copilotState');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        this.persistentState.isRunning = parsedState.isRunning;
        this.persistentState.timerValue = parsedState.timerValue;
        this.speakerSegments = parsedState.speakerSegments || [];
        this.aiResponses = parsedState.aiResponses || [];
        this.conversationHistory = parsedState.conversationHistory || [];
        this.state = parsedState.state || 'end';
        this.speakerLabels = parsedState.speakerLabels || {};

        if (this.persistentState.isRunning) {
          this.$nextTick(() => {
            this.startCopilot();
          });
        }
      }
    },

    updateTimer(value) {
      this.persistentState.timerValue = value;
      this.saveState();
    },

    // Lifecycle hook methods
    mounted() {
      this.loadState();
      if (this.persistentState.isRunning) {
        this.$refs.MyTimer.setTime(this.persistentState.timerValue);
      }
    },

    beforeDestroy() {
      this.saveState();
      if (this.audioStream) {
        this.audioStream.getTracks().forEach(track => track.stop());
      }
      if (this.conversationTranscriber) {
        this.conversationTranscriber.stopTranscribingAsync();
      }
    }
  },
  created() {
    this.loadState();
    if (this.state === 'ing') {
      this.$nextTick(() => {
        this.startCopilot();
      });
    }
  },
  beforeRouteLeave(to, from, next) {
    this.saveState();
    next();
  },
  beforeDestroy() {
    // Save state to localStorage before component is destroyed
    const stateToSave = {
      speakerSegments: this.speakerSegments,
      aiResponses: this.aiResponses,
      conversationHistory: this.conversationHistory,
    };
    localStorage.setItem('homeViewState', JSON.stringify(stateToSave));
  },
};
</script>

<style scoped>
@import '/src/styles/HomeViewStyles.css';
</style>
