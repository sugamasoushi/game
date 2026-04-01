import { Scene } from 'phaser';
import { GameStateManager } from '../GameAllState/GameStateManager';

export class Boot extends Scene {
    constructor() { super('Boot'); }

    preload() {
        console.log("boot scene")

        //状態管理クラスをリセット（Game Over時などの再スタート用）
        GameStateManager.getInstance().reset();

        //キャッシュクリア
        if (this.cache.json.exists('savedata')) {
            this.cache.json.remove('savedata');
        }

        //this.load.image('background', 'assets/bg.png');
        this.load.image('LondonBridge', 'assets/img/LondonBridge/LondonBridge.bmp');
        this.load.image('GameStartAlert', 'assets/img/background/ゲームスタートお知らせ.png');
        this.load.json('savedata', 'assets/data/savedata.json');

    }

    create() {
        this.scene.launch('SceneController');
    }
}