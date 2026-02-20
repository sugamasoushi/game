import { Events } from 'phaser';

// コンポーネント、HTML、Phaserシーン間でイベントを発行するために使用されます。
export const EventBus = new Events.EventEmitter();