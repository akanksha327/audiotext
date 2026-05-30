import dotenv from 'dotenv';
import { DeepgramClient } from '@deepgram/sdk';
import fs from 'fs';

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
    console.log('Connecting to Deepgram with multichannel: true...');
    const connection = await deepgram.listen.v1.connect({
      model: 'nova-2',
      language: 'en-US',
      smart_format: true,
      interim_results: true,
      multichannel: true,
      connectionTimeoutInSeconds: 30,
    } as any);

    connection.on('open', () => {
      console.log('Deepgram live connection opened.');
      
      const fileBuffer = fs.readFileSync('sample.wav');
      console.log('Read sample.wav. Size:', fileBuffer.length, 'bytes.');

      const chunkSize = 8000;
      let offset = 0;

      const interval = setInterval(() => {
        if (offset >= fileBuffer.length) {
          clearInterval(interval);
          console.log('All audio sent. Finalizing...');
          connection.sendFinalize({ type: 'Finalize' });
          
          setTimeout(() => {
            console.log('Closing connection.');
            connection.close();
          }, 5000);
          return;
        }

        const end = Math.min(offset + chunkSize, fileBuffer.length);
        const chunk = fileBuffer.subarray(offset, end);
        connection.sendMedia(chunk);
        console.log(`Sent chunk: ${offset} to ${end}`);
        offset = end;
      }, 250);
    });

    connection.on('message', (data: any) => {
      console.log('SDK Message event received:', JSON.stringify(data));
    });

    connection.on('error', (err: any) => {
      console.error('SDK Error event:', err);
    });

    connection.on('close', (event: any) => {
      console.log('SDK Close event:', event);
    });

    console.log('Calling connect...');
    connection.connect();

  } catch (error) {
    console.error('Error during execution:', error);
  }
}

run();
