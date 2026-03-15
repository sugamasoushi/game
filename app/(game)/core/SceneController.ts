/**
 * シャットダウンしない事
 */

import { Scene } from 'phaser';
import { State } from '../lib/types';
import { gameAllStateModel } from '../GameAllState/GameAllState';
import { GameStateManager } from '../GameAllState/GameStateManager';

export class SceneController extends Scene {
    constructor() { super('SceneController'); }

    preload() {
        //オープニング用ファイル読み込み
        //※Phaserやブラウザが読み込み完了を待ってくれないため、事前に読み込んでおく必要がある
        this.load.audio('opening', 'assets/audio/opening.mp3');

        this.load.image('meinaOpImage', 'assets/img/CharaStand/メイナOP画像.png');
        this.load.image('meinaOpImageHome', 'assets/img/background/ComfyUI_temp_xsgbd_00098_.png');
        this.load.image('lamyOpImage', 'assets/img/CharaStand/ラミィOP画像.png');
        this.load.image('lamyOpImageHome', 'assets/img/background/ComfyUI_temp_xsgbd_00071_.png');
        this.load.image('spark', 'assets/img/effect/elec3.png');
    }

    create() {
        console.log("SceneController")

        //スマホの画面回転時、100ミリ秒後に画面更新。
        this.scale.on('resize', () => {
            setTimeout(() => {
                this.scale.setGameSize(1280, 720);
                this.scale.scaleMode = Phaser.Scale.FIT;
            }, 100);
        });

        gameAllStateModel.isInitialize(this.registry, this.cache);

        //状態管理クラス
        const manager = GameStateManager.getInstance();

        // 状態の切り替わりを購読
        manager.state$.subscribe(({ state, sceneKey }) => {
            this.handleStateChange(state, sceneKey);
        });

        //状態をスタートに更新
        manager.updateState({ state: State.START }, '')
    }

    private handleStateChange(state: State, sceneKey: string) {
        switch (state) {
            case State.NOSTATE:
                //処理無
                break;
            case State.START:
                console.log('Title')
                this.scene.launch('Title', { sceneKey });
                break;
            case State.LOAD:
                console.log('Load')
                this.scene.launch('Load', { sceneKey });
                break;
            case State.FIELD:
                console.log('Game')
                this.scene.launch('Game', { sceneKey });
                break;
            case State.FIELD_RESTART:
                console.log('Game restart', sceneKey)
                this.scene.get('Game').scene.restart({ sceneKey });
                break;
            case State.FIELD_RESUME:
                console.log('Game resume', sceneKey)
                this.scene.get('Game').scene.resume();
                break;
            case State.BATTLE:
                console.log('Battle')
                //this.scene.pause('Game');
                this.scene.launch('Battle', { sceneKey });// launchで現在のシーンの上に重ねてシーンを出す
                break;
            case State.EVENT:
                console.log('Event')
                // this.scene.pause('Game');
                this.scene.launch('Event', { sceneKey });
                break;
            case State.BUBBLE_TALK:
                console.log('BubbleTalk')
                break;
        }
    }
}