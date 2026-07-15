import { Scene } from 'phaser';
import { GameStateManager } from '../core/GameStateManager';
import { InputManager } from '../core/input/InputManager';
import { isDebug } from '../main';

export class Boot extends Scene {
    constructor() { super('Boot'); }

    preload() {
        console.log("boot scene")

        //状態管理クラスをリセット（Game Over時などの再スタート用）
        GameStateManager.getInstance().reset();

        // 入力管理を実行
        InputManager.getInstance(this).execute();

        // デバッグモード判定
        const gameStateManager = GameStateManager.getInstance();
        gameStateManager.updateState({ debugMode: isDebug }, 'system');

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
        // シーン再起動時（タイトルへ戻る等）に備えて一度リセットする
        //InputManager.getInstance(this).reset();
        // 入力管理を実行
        //InputManager.getInstance(this).execute();

        this.scene.launch('SceneController');
        this.scene.stop();
    }
}