import dotenv from 'dotenv';
import { DeepgramClient } from '@deepgram/sdk';

dotenv.config();

async function run() {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    console.error('DEEPGRAM_API_KEY is not defined');
    return;
  }

  try {
    const deepgram = new DeepgramClient({ apiKey });
    const connection = await deepgram.listen.v1.connect({
      model: 'nova-2',
      language: 'en-US',
      smart_format: true,
      interim_results: true,
    } as any);

    connection.on('open', () => {
      console.log('Event: open');
    });

    connection.on('close', (event: any) => {
      console.log('Event: close', event);
    });

    connection.on('error', (err: any) => {
      console.log('Event: error', err);
    });

    console.log('Calling connect()...');
    connection.connect();

    // Wait 5 seconds
    await new Promise((resolve) => setTimeout(resolve, 5000));
    
    connection.close();
  } catch (error) {
    console.error('Failed:', error);
  }
}

run();
