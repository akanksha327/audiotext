import dotenv from 'dotenv';
import { DeepgramClient } from '@deepgram/sdk';

dotenv.config();

async function run() {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  console.log('Using API Key:', apiKey ? (apiKey.substring(0, 5) + '...') : 'undefined');

  if (!apiKey) {
    console.error('DEEPGRAM_API_KEY is not defined');
    return;
  }

  try {
    const deepgram = new DeepgramClient({ apiKey });
    console.log('Testing HTTP transcribeUrl with spacewalk.wav...');
    const response: any = await deepgram.listen.v1.media.transcribeUrl(
      { url: 'https://dpgr.am/spacewalk.wav' },
      { model: 'nova-2' } as any
    );
    console.log('HTTP Transcription Success!');
    console.log('Transcript:', response.results?.channels?.[0]?.alternatives?.[0]?.transcript);
  } catch (error: any) {
    console.error('HTTP transcribeUrl Failed:', error.message || error);
  }
}

run();
