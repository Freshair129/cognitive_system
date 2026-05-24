const WebSocket = require('ws');

const ws = new WebSocket('ws://127.0.0.1:8787');

ws.on('open', function open() {
  console.log('Connected to WS server. Sending task...');
  ws.send(JSON.stringify({ task_id: 'p0-s0-1' }));
});

ws.on('message', function message(data) {
  const msg = JSON.parse(data.toString());
  console.log('Received:', msg);
  if (msg.type === 'agent_output') {
    // We got output! Close after a bit
    setTimeout(() => {
      ws.close();
      process.exit(0);
    }, 2000);
  }
  if (msg.type === 'error' || msg.data?.includes('exited')) {
    ws.close();
    process.exit(1);
  }
});

ws.on('error', function(err) {
  console.error('WS Error:', err);
  process.exit(1);
});
