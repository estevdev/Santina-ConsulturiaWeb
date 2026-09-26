import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
  const interfaces = os.networkInterfaces();
  let localIp = 'localhost';

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      // Ignorar direcciones internas (127.0.0.1) y buscar IPv4
      if (iface.family === 'IPv4' && !iface.internal) {
        if (!iface.address.startsWith('172.') && !iface.address.startsWith('169.')) {
          localIp = iface.address;
          break;
        }
        if (localIp === 'localhost') {
          localIp = iface.address;
        }
      }
    }
  }

  return NextResponse.json({ localIp });
}
