import { FieldScene, State } from "../../lib/types";
import { InputManager } from "../../core/input/InputManager";
import { FieldPresenter } from "./FieldPresenter";
import { Player } from "../view/character/Player";
import { GameStateManager, gameStateManager } from "../../GameAllState/GameStateManager";
import { FieldAttack } from '../view/character/Action/FieldAttack';
import { DataDefinition } from '../../Data/DataDefinition';
import { FieldMapModel } from "../model/FieldMapModel";
import { Subscription } from "rxjs";

export class PlayerPresenter {
    private player: Player;
    private fieldAttack: FieldAttack;
    private subs = new Subscription();

    //移動時のタップ連打防止
    private lastTapTime: number = 0;

    constructor(
        private fieldScene: FieldScene,
        private fieldMapModel: FieldMapModel,
        private fieldPresenter: FieldPresenter,
        private inputManager: InputManager
    ) { }

    public execute() {
        this.execClickMove();
        this.execKeyMove();
        this.execFieldClick();

        //プレイヤーを作成
        this.player = this.fieldPresenter.getPlayer();
        this.player.setCursors(this.inputManager.phaserCursors);
        this.player.setInputManager(this.inputManager);

        //プレイヤーのパーティメンバーを作成
        const playerPartyList = gameStateManager.currentPlayerPartyList;
        if (playerPartyList[1]) {
            (playerPartyList[1] as Player).setLeader(playerPartyList[0] as Player);
            (playerPartyList[1] as Player).setCursors(this.inputManager.phaserCursors);
            (playerPartyList[1] as Player).setInputManager(this.inputManager);
        }

        //プレイヤーのパーティメンバーを作成
        if (playerPartyList[2]) {
            (playerPartyList[2] as Player).setLeader(playerPartyList[0] as Player);
            (playerPartyList[2] as Player).setCursors(this.inputManager.phaserCursors);
            (playerPartyList[2] as Player).setInputManager(this.inputManager);
        }

        this.fieldScene.events.once('shutdown', () => {
            this.subs.unsubscribe();
        });

        this.setAnyObject();
    }

    //画像などの紐づけを行う。※非同期になっているのか分からないがMapObjectで生成するとカメラ設定が先に動いてヌルポになる
    private setAnyObject() {
        const settingData = new DataDefinition();
        const imageKey = settingData.getCharacterImageKey(this.fieldScene, this.player.name)!.normal;
        this.player.setData('ImageKey', imageKey);
    }

    private execClickMove() {
        this.inputManager.phaserInput.on(Phaser.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer) => {//pointerdownでもいい

            //ゲーム状態の確認
            const manager = GameStateManager.getInstance();
            if (manager.currentState === State.BUBBLE_TALK || manager.currentState === State.EVENT || manager.currentState === State.BATTLE) { return; }

            //左クリック押下時
            if (pointer.leftButtonReleased()) {

                // Phaserの現在のゲーム内時間(ミリ秒)
                const currentTime = this.fieldScene.time.now;

                // 前回のタップから300ミリ秒以内の連打なら、処理を完全に無視する
                if (currentTime - this.lastTapTime < 300) {
                    return;
                }

                // タップ成功時間を更新
                this.lastTapTime = currentTime;

                //移動先座標を設定する
                this.player.setMoveToPosition(
                    this.inputManager.phaserInput.activePointer.worldX,
                    this.inputManager.phaserInput.activePointer.worldY,
                    0, false, 50, 1000);
                this.player.setInputClickFlg(true);

                const playerPartyList = gameStateManager.currentPlayerPartyList;

                if (playerPartyList[1]) {
                    (playerPartyList[1] as Player).setMoveToPosition(
                        this.inputManager.phaserInput.activePointer.worldX,
                        this.inputManager.phaserInput.activePointer.worldY,
                        1, false, 40, 1100);
                    (playerPartyList[1] as Player).setInputClickFlg(true);
                }

                if (playerPartyList[2]) {
                    (playerPartyList[2] as Player).setMoveToPosition(
                        this.inputManager.phaserInput.activePointer.worldX,
                        this.inputManager.phaserInput.activePointer.worldY,
                        2, false, 40, 1100);
                    (playerPartyList[2] as Player).setInputClickFlg(true);
                }
            }
        });
    }

    private execFieldClick() {

        //Pキー押下
        this.subs.add(this.inputManager.action$.subscribe((action) => {
            if (action === 'P') {
                console.log("Pキー押下")

                //ゲーム状態の確認
                const gameStateManager = GameStateManager.getInstance();
                if (gameStateManager.currentState !== State.NOSTATE) { return; }

                const fieldAttack = new FieldAttack(this.player, this.player.x, this.player.y);
                fieldAttack.frameBullet(this.player.x, this.player.y);
            }
        }));

        this.subs.add(this.inputManager.fieldAttackButton$.subscribe(() => {
            //ゲーム状態の確認
            const gameStateManager = GameStateManager.getInstance();
            if (gameStateManager.currentState !== State.NOSTATE) { return; }

            console.log("FieldAttackボタン押下")
            const fieldAttack = new FieldAttack(this.player, this.player.x, this.player.y);
            fieldAttack.frameBullet(this.player.x, this.player.y);
        }));

        this.subs.add(this.inputManager.menuButton$.subscribe(() => {
            console.log("メニューボタン押下")

            //ゲーム状態の確認
            const gameStateManager = GameStateManager.getInstance();

            //状態がNOSTATE以外の場合は、メニューを開かない
            if (gameStateManager.currentState !== State.NOSTATE) { return; }

            //ぼかし
            //https://newdocs.phaser.io/docs/3.70.0/Phaser.GameObjects.Components.FX#addBlur
            const mainCamera: Phaser.Cameras.Scene2D.Camera = this.fieldScene.cameras.main;
            mainCamera.postFX.addBlur(2, 1, 1, 1, 0xffffff, 1);

            //状態更新
            gameStateManager.updateState({ state: State.MENU }, 'menu');

        }))

        //右クリック
        this.inputManager.phaserInput.on('pointerdown', (pointer: Phaser.Input.Pointer) => {

            //ゲーム状態の確認
            const gameStateManager = GameStateManager.getInstance();
            if (gameStateManager.currentState !== State.NOSTATE) { return; }

            if (pointer.rightButtonDown()) {
                pointer.reset();//入力状態をリセット、リセットしないと押下中に連続で処理される
                const fieldAttack = new FieldAttack(this.player, this.player.x, this.player.y);
                fieldAttack.frameBullet(this.player.x, this.player.y);
            }
        })
    }

    private execKeyMove() {
        /**
         * Player()内で_updateKeyWalk()で実装。
         * rxjsを使用したホールドの実装を考えていたが面倒くさそうなのでいったん断念
         * 連続処理のため、普通にPhaserのupdate()に任せた方が良いとも考えた
         */
    }


}