// Allow TypeScript to accept plain CSS file imports (handled at runtime by Next.js/webpack)
declare module '*.css';

// Web Bluetooth API — not in lib.dom by default in all TS versions
interface BluetoothRemoteGATTCharacteristic {
  writeValue(value: BufferSource): Promise<void>;
}
interface BluetoothRemoteGATTService {
  getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
}
interface BluetoothRemoteGATTServer {
  connect(): Promise<BluetoothRemoteGATTServer>;
  getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
  disconnect(): void;
}
interface BluetoothDevice {
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
  addEventListener(type: 'gattserverdisconnected', listener: () => void): void;
}
interface Bluetooth {
  requestDevice(options: { acceptAllDevices?: boolean; optionalServices?: string[]; filters?: { name?: string; namePrefix?: string }[] }): Promise<BluetoothDevice>;
}
interface Navigator {
  bluetooth?: Bluetooth;
}
