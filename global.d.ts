// Allow TypeScript to accept plain CSS file imports (handled at runtime by Next.js/webpack)
declare module '*.css';

// Web Bluetooth API — not in lib.dom by default in all TS versions
interface BluetoothCharacteristicProperties {
  write: boolean;
  writeWithoutResponse: boolean;
  read: boolean;
  notify: boolean;
  indicate: boolean;
}
interface BluetoothRemoteGATTCharacteristic {
  properties: BluetoothCharacteristicProperties;
  writeValue(value: BufferSource): Promise<void>;
  writeValueWithoutResponse(value: BufferSource): Promise<void>;
}
interface BluetoothRemoteGATTService {
  getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
  getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
}
interface BluetoothRemoteGATTServer {
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
  getPrimaryServices(): Promise<BluetoothRemoteGATTService[]>;
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
