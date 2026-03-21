import { discover } from './discovery.js';
import { YeelightClient } from './client.js';

async function main() {
  console.log('Searching for Yeelight devices on the network...');
  const devices = await discover();

  if (devices.length === 0) {
    console.error('No devices found. Make sure LAN Control is enabled in the Yeelight app.');
    process.exit(1);
  }

  console.log(`Found ${devices.length} device(s):`);
  for (const d of devices) {
    console.log(`  [${d.model}] ${d.name || d.id}  →  ${d.ip}:${d.port}`);
    console.log(`  Supported methods: ${d.support.join(', ')}`);
  }

  // Use the first device found (change index to target a specific one)
  const device = devices[0];
  const client = new YeelightClient(device);

  console.log(`\nConnecting to ${device.ip}:${device.port}...`);
  await client.connect();
  console.log('Connected.');

  const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // Set both sides to white so brightness changes are clearly visible
  await client.send('set_segment_rgb', [0xffffff, 0xffffff]);
  await pause(2000);

  for (const bright of [100, 75, 50, 25, 10, 1]) {
    console.log(`brightness → ${bright}`);
    await client.setBrightness(bright);
    await pause(2000);
  }

  // Back to 100
  console.log('brightness → 100');
  await client.setBrightness(100);

  client.disconnect();
  console.log('Done.');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
