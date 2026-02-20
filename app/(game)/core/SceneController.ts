/**
 * シャットダウンしない事
 */

import { Scene } from 'phaser';
import { State } from '../lib/types';
import { gameAllStateModel } from '../GameAllState/GameAllState';
import { GameStateManager } from '../GameAllState/GameStateManager';

export class SceneController extends Scene {
    constructor() { super('SceneController'); }

    create() {
        console.log("SceneController")

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