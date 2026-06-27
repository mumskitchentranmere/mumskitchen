'use client';
import { useRef, useState } from 'react';
import { Bluetooth, BluetoothOff, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

// ── ESC/POS builder ──────────────────────────────────────────────────────────
class ESCPOS {
  private buf: number[] = [];

  init()                  { this.buf.push(0x1B, 0x40); return this; }
  cut()                   { this.buf.push(0x1D, 0x56, 0x41, 0x00); return this; }
  feed(n = 1)             { for (let i = 0; i < n; i++) this.buf.push(0x0A); return this; }
  align(a: 'L'|'C'|'R')  { this.buf.push(0x1B, 0x61, { L:0, C:1, R:2 }[a]); return this; }
  bold(on: boolean)       { this.buf.push(0x1B, 0x45, on ? 1 : 0); return this; }
  size(w: 1|2, h: 1|2)   { this.buf.push(0x1D, 0x21, ((w-1)<<4)|(h-1)); return this; }

  text(str: string) {
    for (const ch of str) {
      const code = ch.charCodeAt(0);
      this.buf.push(code < 256 ? code : 0x3F); // replace non-Latin with '?'
    }
    return this;
  }

  line(str: string) { return this.text(str).feed(); }

  // Fixed-width two-column line (32 chars wide — common thermal paper)
  row(left: string, right: string, width = 32) {
    const gap = width - left.length - right.length;
    const padded = left + (gap > 0 ? ' '.repeat(gap) : ' ') + right;
    return this.line(padded);
  }

  divider(char = '-', width = 32) { return this.line(char.repeat(width)); }

  build() { return new Uint8Array(this.buf); }
}

// ── Chunk writer — negotiates the largest safe MTU and picks the right write method ──
async function writeChunked(char: BluetoothRemoteGATTCharacteristic, data: Uint8Array) {
  // Prefer writeValueWithoutResponse (no ACK, faster) if the characteristic supports it.
  // Fall back to writeValue (with response) otherwise.
  const useWithoutResponse =
    char.properties.writeWithoutResponse && !char.properties.write;

  // Try to use a larger chunk if the GATT server reports a higher MTU.
  // Default 20 bytes is the BLE minimum; many modern devices support 128–512 bytes.
  const chunkSize = 128;
  const delay = useWithoutResponse ? 5 : 20;

  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    try {
      if (useWithoutResponse) {
        await char.writeValueWithoutResponse(chunk);
      } else {
        await char.writeValue(chunk);
      }
    } catch {
      // If the larger chunk fails, retry at 20 bytes (minimum MTU)
      for (let j = 0; j < chunk.length; j += 20) {
        await char.writeValue(chunk.slice(j, j + 20));
        await new Promise(r => setTimeout(r, 20));
      }
    }
    await new Promise(r => setTimeout(r, delay));
  }
}

// Known BLE service/characteristic combos for common thermal printers.
// Chrome only allows access to services declared here, so this list must be broad.
const PRINTER_PROFILES = [
  // Generic serial — most common Chinese thermal printers (Xprinter, MUNBYN, Rongta)
  { service: '000018f0-0000-1000-8000-00805f9b34fb', char: '00002af1-0000-1000-8000-00805f9b34fb' },
  // FF00 profile — another common Chinese BLE thermal (primary + alt char)
  { service: '0000ff00-0000-1000-8000-00805f9b34fb', char: '0000ff02-0000-1000-8000-00805f9b34fb' },
  { service: '0000ff00-0000-1000-8000-00805f9b34fb', char: '0000ff01-0000-1000-8000-00805f9b34fb' },
  // ISSC BLE serial (iDPRT, some Epson)
  { service: '49535343-fe7d-4ae5-8fa9-9fafd205e455', char: '49535343-8841-43f4-a8d4-ecbe34729bb3' },
  // Nordic UART Service (NUS) — used by many BLE-serial adapters and modern BLE printers
  { service: '6e400001-b5a3-f393-e0a9-e50e24dcca9e', char: '6e400002-b5a3-f393-e0a9-e50e24dcca9e' },
  // E7810 / GZM / some HPRT models
  { service: '0000ae30-0000-1000-8000-00805f9b34fb', char: '0000ae01-0000-1000-8000-00805f9b34fb' },
  // FFF0 profile — Zebra / Star variants (primary + alt char)
  { service: '0000fff0-0000-1000-8000-00805f9b34fb', char: '0000fff2-0000-1000-8000-00805f9b34fb' },
  { service: '0000fff0-0000-1000-8000-00805f9b34fb', char: '0000fff1-0000-1000-8000-00805f9b34fb' },
  // Xprinter BLE — many MUNBYN devices are Xprinter OEM and use this UUID
  { service: 'e7810a71-73ae-499d-8c15-faa9aef0c3f2', char: 'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f' },
  // Dialog Semiconductor DSPS — used by some HPRT / MUNBYN BLE modules
  { service: '0000fef5-0000-1000-8000-00805f9b34fb', char: '0000fef6-0000-1000-8000-00805f9b34fb' },
];

// ── Shared connection helper ─────────────────────────────────────────────────
// Tries each unique service from PRINTER_PROFILES. For a service that exists on
// the device it first tries the known char UUIDs, then enumerates ALL
// characteristics and picks the first writable one. This handles printers that
// share a well-known service UUID but use a non-standard characteristic UUID.
async function findWritableChar(
  server: BluetoothRemoteGATTServer
): Promise<BluetoothRemoteGATTCharacteristic | null> {
  const tried = new Set<string>();
  for (const profile of PRINTER_PROFILES) {
    if (tried.has(profile.service)) continue;
    tried.add(profile.service);

    let svc: BluetoothRemoteGATTService | undefined;
    try { svc = await server.getPrimaryService(profile.service); } catch { continue; }

    // Try every known char UUID for this service first
    const knownChars = PRINTER_PROFILES.filter(p => p.service === profile.service).map(p => p.char);
    for (const uuid of knownChars) {
      try {
        const ch = await svc.getCharacteristic(uuid);
        if (ch.properties.write || ch.properties.writeWithoutResponse) return ch;
      } catch {}
    }

    // Fall back: enumerate every characteristic and pick the first writable one
    try {
      const chars = await svc.getCharacteristics();
      const ch = chars.find(c => c.properties.write || c.properties.writeWithoutResponse);
      if (ch) return ch;
    } catch {}
  }
  return null;
}

// ── Component ────────────────────────────────────────────────────────────────
export type PrintOrder = {
  _id: string;
  customerName: string;
  orderType: string;
  total: number;
  pickupTime?: string;
  specialInstructions?: string;
  items: { name: string; quantity: number; price: number }[];
};

type Props = { compact?: boolean };

export function BluetoothPrinter({ compact = false }: Props) {
  const deviceRef    = useRef<BluetoothDevice | null>(null);
  const charRef      = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const [status, setStatus]   = useState<'disconnected'|'connecting'|'connected'>('disconnected');

  const connect = async () => {
    if (!navigator.bluetooth) {
      toast.error('Web Bluetooth is not supported in this browser.\nUse Chrome or Edge on a desktop/Android device.');
      return;
    }

    setStatus('connecting');
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [...new Set(PRINTER_PROFILES.map(p => p.service))],
      });

      device.addEventListener('gattserverdisconnected', () => {
        setStatus('disconnected');
        charRef.current  = null;
        deviceRef.current = null;
      });

      const server = await device.gatt!.connect();
      const ch = await findWritableChar(server);

      if (ch) {
        charRef.current  = ch;
        deviceRef.current = device;
        setStatus('connected');
        toast.success(`Printer connected: ${device.name || 'Unknown device'}`);
      } else {
        device.gatt?.disconnect();
        setStatus('disconnected');
        toast.error('Printer found but no compatible service detected.\nCheck it is an ESC/POS Bluetooth printer and is in print mode.');
      }
    } catch (e: any) {
      setStatus('disconnected');
      if (e.name !== 'NotFoundError') {
        toast.error('Bluetooth connection failed: ' + (e.message || e.name));
      }
    }
  };

  const disconnect = () => {
    deviceRef.current?.gatt?.disconnect();
    charRef.current   = null;
    deviceRef.current = null;
    setStatus('disconnected');
  };

  const printOrder = async (order: PrintOrder) => {
    if (!charRef.current) {
      toast.error('No printer connected. Connect a printer first.');
      return;
    }

    const typeLabel = order.orderType === 'dinein' ? 'DINE-IN' : 'TAKEAWAY';
    const time      = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
    const date      = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
    const id        = order._id.slice(-6).toUpperCase();

    const esc = new ESCPOS()
      .init()
      // Header
      .align('C').size(2,2).bold(true).line("MUM'S KITCHEN").size(1,1).bold(false)
      .align('C').line('Tranmere SA 5073')
      .feed()
      // Order ID + time
      .align('C').bold(true).line(`ORDER #${id}`).bold(false)
      .align('C').line(`${date}  ${time}`)
      .divider('=')
      // Type + customer
      .align('C').bold(true).size(1,2).line(typeLabel).size(1,1).bold(false)
      .align('L').line(`Customer: ${order.customerName}`)

    if (order.pickupTime) {
      esc.line(`Pickup:   ${order.pickupTime}`);
    }

    esc.divider('-');

    // Items
    for (const item of order.items) {
      esc.bold(true).row(`${item.quantity}x ${item.name}`, `$${(item.price * item.quantity).toFixed(2)}`).bold(false);
    }

    esc.divider('-');
    esc.bold(true).row('TOTAL', `$${order.total.toFixed(2)} AUD`).bold(false);
    esc.divider('=');

    if (order.specialInstructions) {
      esc
        .align('L')
        .bold(true).line('SPECIAL INSTRUCTIONS:').bold(false)
        .line(order.specialInstructions);
      esc.divider('-');
    }

    esc.align('C').line('Thank you!').feed(3).cut();

    try {
      await writeChunked(charRef.current, esc.build());
      toast.success('Printed!');
    } catch (e: any) {
      toast.error('Print failed: ' + (e.message || 'Unknown error'));
      // Connection likely dropped
      setStatus('disconnected');
      charRef.current  = null;
      deviceRef.current = null;
    }
  };

  if (compact) {
    return { printOrder, connected: status === 'connected' };
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {status === 'connected' ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '7px 12px', fontSize: '12px', fontWeight: 600, color: '#15803d' }}>
            <Bluetooth size={13} />
            {deviceRef.current?.name || 'Printer'} connected
          </div>
          <button
            onClick={disconnect}
            style={{ padding: '7px 12px', background: 'none', border: '1px solid var(--stone-light)', borderRadius: '10px', cursor: 'pointer', color: '#ef4444', fontSize: '12px', fontFamily: 'Poppins, sans-serif', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <BluetoothOff size={13} /> Disconnect
          </button>
        </>
      ) : (
        <button
          onClick={connect}
          disabled={status === 'connecting'}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: status === 'connecting' ? 'var(--stone-light)' : '#1d4ed8', color: status === 'connecting' ? 'var(--brown-mid)' : 'white', border: 'none', borderRadius: '10px', padding: '8px 16px', cursor: status === 'connecting' ? 'wait' : 'pointer', fontSize: '13px', fontWeight: 500, fontFamily: 'Poppins, sans-serif' }}
        >
          {status === 'connecting' ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Connecting…</> : <><Bluetooth size={13} /> Connect Printer</>}
        </button>
      )}
    </div>
  );
}

// Hook form for use inside orders list
export function useBluetoothPrinter() {
  const deviceRef = useRef<BluetoothDevice | null>(null);
  const charRef   = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const [status, setStatus]         = useState<'disconnected'|'connecting'|'connected'>('disconnected');
  const [deviceName, setDeviceName] = useState<string | undefined>(undefined);

  const connect = async () => {
    if (!navigator.bluetooth) {
      toast.error('Web Bluetooth not supported. Use Chrome or Edge on desktop/Android.');
      return;
    }
    setStatus('connecting');
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [...new Set(PRINTER_PROFILES.map(p => p.service))],
      });
      device.addEventListener('gattserverdisconnected', () => {
        setStatus('disconnected');
        setDeviceName(undefined);
        charRef.current   = null;
        deviceRef.current = null;
      });
      const server = await device.gatt!.connect();
      const ch = await findWritableChar(server);

      if (ch) {
        charRef.current   = ch;
        deviceRef.current = device;
        setStatus('connected');
        setDeviceName(device.name || 'Printer');
        toast.success(`Printer connected: ${device.name || 'Printer'}`);
      } else {
        device.gatt?.disconnect();
        setStatus('disconnected');
        toast.error('Printer found but no compatible service detected.\nCheck it is an ESC/POS Bluetooth printer and is in print mode.');
      }
    } catch (e: any) {
      setStatus('disconnected');
      if (e.name !== 'NotFoundError') toast.error('Bluetooth error: ' + (e.message || e.name));
    }
  };

  const disconnect = () => {
    deviceRef.current?.gatt?.disconnect();
    charRef.current   = null;
    deviceRef.current = null;
    setStatus('disconnected');
    setDeviceName(undefined);
  };

  const printOrder = async (order: PrintOrder) => {
    if (!charRef.current) { toast.error('Connect a printer first.'); return; }
    const typeLabel = order.orderType === 'dinein' ? 'DINE-IN' : 'TAKEAWAY';
    const time = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
    const date = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
    const id   = order._id.slice(-6).toUpperCase();
    const esc  = new ESCPOS().init()
      .align('C').size(2,2).bold(true).line("MUM'S KITCHEN").size(1,1).bold(false)
      .align('C').line('Tranmere SA 5073').feed()
      .align('C').bold(true).line(`ORDER #${id}`).bold(false)
      .align('C').line(`${date}  ${time}`).divider('=')
      .align('C').bold(true).size(1,2).line(typeLabel).size(1,1).bold(false)
      .align('L').line(`Customer: ${order.customerName}`);
    if (order.pickupTime) esc.line(`Pickup:   ${order.pickupTime}`);
    esc.divider('-');
    for (const item of order.items) {
      esc.bold(true).row(`${item.quantity}x ${item.name}`, `$${(item.price * item.quantity).toFixed(2)}`).bold(false);
    }
    esc.divider('-').bold(true).row('TOTAL', `$${order.total.toFixed(2)} AUD`).bold(false).divider('=');
    if (order.specialInstructions) {
      esc.align('L').bold(true).line('SPECIAL INSTRUCTIONS:').bold(false).line(order.specialInstructions).divider('-');
    }
    esc.align('C').line('Thank you!').feed(3).cut();
    try {
      await writeChunked(charRef.current, esc.build());
      toast.success('Sent to printer!');
    } catch (e: any) {
      toast.error('Print failed: ' + (e.message || 'Unknown error'));
      setStatus('disconnected');
      setDeviceName(undefined);
      charRef.current   = null;
      deviceRef.current = null;
    }
  };

  return { connect, disconnect, printOrder, status, deviceName };
}
