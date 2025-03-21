import {
  customProvider,
} from 'ai';
// import { groq } from '@ai-sdk/groq';
// import { xai } from '@ai-sdk/xai';
import { fal } from '@ai-sdk/fal';
import { azure } from '@ai-sdk/azure';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';



export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      // languageModels: {
      //   'chat-model': xai('grok-2-1212'),
      //   'chat-model-reasoning': wrapLanguageModel({
      //     model: groq('deepseek-r1-distill-llama-70b'),
      //     middleware: extractReasoningMiddleware({ tagName: 'think' }),
      //   }),
      //   'title-model': xai('grok-2-1212'),
      //   'artifact-model': xai('grok-2-1212'),
      // },
      languageModels: {
        'chat-model': azure('gpt-4o'),
        'title-model': azure('gpt-4o'),
        'artifact-model': azure('gpt-4o'),
      },
      imageModels: {
        'small-model': fal.image('fal-ai/fast-sdxl'),
      },
    });
