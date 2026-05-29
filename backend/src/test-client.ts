import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('Connected! Socket ID:', socket.id);
  console.log('Emitting start-recording...');
  socket.emit('start-recording');
});

socket.on('connect_error', (err) => {
  console.error('Connect error:', err);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected! Reason:', reason);
  process.exit(0);
});

socket.on('live-transcript', (data) => {
  console.log('Live transcript:', data);
});

socket.on('final-transcript', (data) => {
  console.log('Final transcript received:', data);
  socket.disconnect();
});

socket.on('error', (err) => {
  console.error('Socket error:', err);
});

setTimeout(() => {
  console.log('Sending chunk...');
  socket.emit('audio-chunk', Buffer.alloc(1000));
}, 1500);

setTimeout(() => {
  console.log('Stopping...');
  socket.emit('stop-recording', { duration: 5 });
}, 4000);

