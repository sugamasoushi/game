import { BattleScene, GameScene, State } from "../lib/types";

import { BattleModel } from "../battle/model/BattleModel";
import { CommandSelectModel } from "../battle/model/CommandSelectModel";
import { TurnModel } from "../battle/model/TurnModel";

import { BattleSelectWindow } from "../battle/view/BattleSelectWindow";
import { PlayerPartyWindow } from "../battle/view/PlayerPartyWindow";
import { AttackSelectWindow } from '../battle/view/AttackSelectWindow';
import { EnemySelectWindow } from "../battle/view/EnemySelectWindow";
import { BattleMessageWindow } from "../battle/view/BattleMessageWindow";

import { BattlePresenter } from "../battle/presenter/BattlePresenter";

import { Npc } from "../gamemain/view/character/Npc";

import { gameStateManager } from "../GameAllState/GameStateManager";
import { GameStateManager } from "../GameAllState/GameStateManager";
import { resolve } from "path";

export class Battle extends Phaser.Scene implements BattleScene {
    private gameScene: GameScene;

    //model
    private battleModel: BattleModel;
    private commandSelectModel: CommandSelectModel
    private turnModel: TurnModel

    //view
    private battleSelectWindow: BattleSelectWindow;
    private playerPartyWindow: PlayerPartyWindow;
    private attackSelectWindow: AttackSelectWindow;
    private enemySelectWindow: EnemySelectWindow;
    private battleMessageWindow: BattleMessageWindow;

    //presenter
    private battlePresenter: BattlePresenter;

    private cursorsKeys: Phaser.Types.Input.Keyboard.CursorKeys;//キーボード設定
    private mainCamera: Phaser.Cameras.Scene2D.Camera;

    constructor() { super('Battle'); }

    init(data: { sceneKey: string }) {//dataはマップ上の敵キャラ接触で連携されるデータ
        this.gameScene = (this.scene.get('Game') as GameScene);

        //rxjsのフラグを更新
        gameStateManager.startBattle();

        //状態管理クラスから現在のバトル用データを取得
        const manager = GameStateManager.getInstance();
        const battleData = manager.currentBattleData;

        //フェードイン
        this.cameras.main.fadeIn(100);

        //キーボード設定
        this.cursorsKeys = this.input.keyboard!.createCursorKeys();//キーボード設定

        //model
        this.battleModel = new BattleModel(this, (battleData as { usePatern: string, fieldHitEnemy: Npc, canNotRunaway: boolean }));
        this.commandSelectModel = new CommandSelectModel();
        this.turnModel = new TurnModel();

        //view
        this.battleSelectWindow = new BattleSelectWindow(this, battleData.canNotRunaway);
        this.playerPartyWindow = new PlayerPartyWindow(this);
        this.attackSelectWindow = new AttackSelectWindow(this)
        this.enemySelectWindow = new EnemySelectWindow(this);
        this.battleMessageWindow = new BattleMessageWindow(this);

        //presenter
        this.battlePresenter = new BattlePresenter(
            this,
            this.battleModel,
            this.commandSelectModel,
            this.turnModel,
            this.battleSelectWindow,
            this.playerPartyWindow,
            this.attackSelectWindow,
            this.enemySelectWindow,
            this.battleMessageWindow
        );
        this.battlePresenter.init();

        //マウスポインタ—を初期化
        //https://developer.mozilla.org/en-US/docs/Web/CSS/cursor
        //default,pointer,help,wait...etc
        //※phaserはブラウザが管理するマウス設定キーを使用しているだけなので上記のキーはphaserのドキュメントには無い。他にもありそう。
        this.input.setDefaultCursor('default');//カーソルを初期化
    }

    async create() {

        //Phaserのイベントエミッター
        this.events.on('BattleEnd', () => {

            this.endScene();
            resolve()
        }, this);

        //背景画像
        this.add.image(Number(this.game.config.width) / 2, Number(this.game.config.height) / 2, 'hill_ComfyUI');

        this.battlePresenter.create(
            this.events,
            {
                battleSelect: this.battleSelectWindow,
                playerPartyWindow: this.playerPartyWindow,
                attackSelect: this.attackSelectWindow,
                enemySelectWindow: this.enemySelectWindow,

                item: this.playerPartyWindow,//まだ使ってない
            });
    }

    public endScene() {

        //rxjsのフラグを更新
        gameStateManager.endBattle();

        //逃げるを選択した場合
        // if (this.battleModel.getFieldHitEnemy()) {
        //     this.battleModel.getFieldHitEnemy().deleteCharacter();
        //     this.battleModel.deleteEnemy();
        // }

        // FX
        const pixelated = this.cameras.main.postFX.addPixelate(-1);
        this.add.tween({
            targets: pixelated,
            duration: 700,
            amount: 40,
            onComplete: () => {
                this.cameras.main.fadeOut(100);

                //バトルシーンを停止
                this.scene.stop();

                //フィールドBGMを再開
                this.game.events.emit('BGM_FIELD');

                //状態管理クラス
                const manager = GameStateManager.getInstance();
                manager.updateState({ state: State.FIELD_RESUME }, 'resume');

                this.events.emit('shutdown')
            }
        });
    }

    public getCursorsKeys(): Phaser.Types.Input.Keyboard.CursorKeys {
        return this.cursorsKeys;
    }

    public getMainCamera(): Phaser.Cameras.Scene2D.Camera {
        return this.mainCamera;
    }

    //画面更新を再開。このメソッドは別シーンから参照される。
    public resumeScene() {
        this.mainCamera.postFX.clear();
        this.scene.resume();
    }

}