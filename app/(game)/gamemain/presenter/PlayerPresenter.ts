import { GameScene, State } from "../../lib/types";
import { InputManager } from "../../core/input/InputManager";
import { FieldPresenter } from "./FieldPresenter";
import { Player } from "../view/character/Player";
import { GameStateManager } from "../../GameAllState/GameStateManager";
import { FieldAttack } from '../view/character/Action/FieldAttack';
import { DataDefinition } from '../../Data/DataDefinition';
import { FieldMapModel } from "../model/FieldMapModel";

export class PlayerPresenter {
    private player: Player;
    private playerPartyList: Phaser.Physics.Arcade.Sprite[] = [];
    private fieldAttack: FieldAttack;

    constructor(
        private gameScene: GameScene,
        private fieldMapModel: FieldMapModel,
        private fieldPresenter: FieldPresenter,
        private inputManager: InputManager
    ) { }

    public execute() {
        this.execClickMove();
        this.execKeyMove();
        this.execFieldAttack();

        //プレイヤーを作成
        this.player = this.fieldPresenter.getPlayer();
        this.player.setCursors(this.inputManager.phaserCursors);

        //プレイヤーのパーティメンバーを作成
        this.playerPartyList = this.fieldPresenter.getPlayerPartyList();
        if (this.playerPartyList[1]) {
            (this.playerPartyList[1] as Player).setCursors(this.inputManager.phaserCursors);
            //this.player.setPlayer1(this.player);
        }

        //プレイヤーのパーティメンバーを作成
        if (this.playerPartyList[2]) {
            (this.playerPartyList[2] as Player).setCursors(this.inputManager.phaserCursors);
        }

        this.setAnyObject();
        this.fieldAttack = new FieldAttack(this.player, this.player.x, this.player.y);
    }

    //画像などの紐づけを行う。※非同期になっているのか分からないがMapObjectで生成するとカメラ設定が先に動いてヌルポになる
    private setAnyObject() {
        const settingData = new DataDefinition();
        const imageKey = settingData.getCharacterImageKey(this.gameScene, this.player.name)!.normal;
        this.player.setData('ImageKey', imageKey);
    }

    private execClickMove() {
        this.inputManager.phaserInput.on(Phaser.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer) => {//pointerdownでもいい

            //状態管理クラス
            const manager = GameStateManager.getInstance();
            if (manager.currentState === State.BUBBLE_TALK || manager.currentState === State.EVENT || manager.currentState === State.BATTLE) { return; }

            //左クリック押下時
            if (pointer.leftButtonReleased()) {

                //移動先座標を設定する
                this.player.setMoveToPosition(
                    this.inputManager.phaserInput.activePointer.worldX,
                    this.inputManager.phaserInput.activePointer.worldY,
                    0, false, 50, 1000);

                if (this.playerPartyList[1]) {
                    (this.playerPartyList[1] as Player).setMoveToPosition(
                        this.inputManager.phaserInput.activePointer.worldX,
                        this.inputManager.phaserInput.activePointer.worldY,
                        1, false, 40, 1100);
                }

                if (this.playerPartyList[2]) {
                    (this.playerPartyList[2] as Player).setMoveToPosition(
                        this.inputManager.phaserInput.activePointer.worldX,
                        this.inputManager.phaserInput.activePointer.worldY,
                        2, false, 40, 1100);
                }
            }
        });
    }

    private execFieldAttack() {

        //Pキー押下
        this.inputManager.action$.subscribe((action) => {
            if (action === 'P') {
                console.log("Pキー押下")
                this.fieldAttack.frameBullet(this.player.x, this.player.y);
            }
        });

        //右クリック
        this.inputManager.phaserInput.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.rightButtonDown()) {
                pointer.reset();//入力状態をリセット、リセットしないと押下中に連続で処理される
                this.fieldAttack.frameBullet(this.player.x, this.player.y);
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