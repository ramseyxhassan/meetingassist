# Meeting Assist

## What is Meeting Assist?

Meeting Assist is a powerful AI-powered application designed to make your meetings more productive. It works by listening to your meetings in real-time and providing intelligent assistance through transcription, speaker identification, and AI-generated insights.

![Meeting Assist Screen](docs/imgs/2_demo/demo.png)

## What Does It Do?

- **Captures and Transcribes Speech**: Automatically converts spoken words into text in real-time
- **Identifies Different Speakers**: Distinguishes between different people speaking in the meeting
- **Provides AI Insights**: Analyzes meeting content and generates helpful responses using AI models
- **Allows Custom Questions**: You can ask AI specific questions about the meeting content
- **Supports Multiple Audio Sources**: Works with your microphone, system audio, or both combined

## How to Run the Application

### Prerequisites

1. Make sure you have Node.js installed on your computer
2. If you want to use AI features, you'll need API keys:
   - For OpenAI models (GPT-4o, o1-preview, o1-mini)
   - For Anthropic models (Claude 3.5 Sonnet)
3. For speech recognition, you'll need an Azure Speech Service key
   - Sign up for a free tier at the [Azure portal](https://portal.azure.com/)
   - See the setup guide in the docs folder: `docs/azure_speech_service_tutorial.md`

### Setup and Run

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the application:**
   ```bash
   npm run serve
   ```

3. **Open in browser:**
   - The application will be running at http://localhost:8080

### Configuration

Before using, you need to configure your API keys:

1. Go to the Settings page
2. Select your preferred AI model
3. Enter your API key for the selected model
4. Enter your Azure Speech Service details:
   - API Key (KEY 1 from Azure portal)
   - Region (e.g., eastus)
   - Language (e.g., en-US)

## Using the Application

1. Click the "Start Copilot" button to begin a session
2. Choose your audio source:
   - Microphone Only: captures just your microphone
   - System Audio Only: captures audio playing on your computer
   - Microphone + System Audio: captures both simultaneously
3. As people speak, the application transcribes the audio in real-time
4. Use the speaker controls to label different speakers in the conversation
5. Select important segments of text by clicking on them
6. Click "Ask AI" to generate AI responses about the selected text
7. Type custom prompts for specific information
8. When you're done, click "Stop Copilot"

## Building for Production

When you're ready to deploy:

```bash
npm run build
```

This will create optimized files in the `dist` folder that you can deploy to a web server.

## Tech Stack

- Frontend: Vue.js 2.x with Vuex and Element UI
- Speech Recognition: Microsoft Azure Cognitive Services
- AI Integration: OpenAI API and Anthropic Claude API

## License

[MIT](LICENSE)
