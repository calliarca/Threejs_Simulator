const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const WebSocket = require('ws');

const port = new SerialPort('COM3', { baudRate: 115200 }); // Update with your Arduino's port
const parser = port.pipe(new Readline({ delimiter: '\n' }));

const wss = new WebSocket.Server({ port: 5173 });

parser.on('data', (data) => {
    console.log('Received:', data);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data); // Send to browser
        }
    });
});

console.log('WebSocket server running on ws://localhost:5173');
