import { BattleScene, GameScene } from "../lib/SceneTypes";
import { State } from "../lib/StateTypes";

import { BattleModel } from "../battle/model/BattleModel";
import { CommandSelectModel } from "../battle/model/CommandSelectModel";
import { TurnModel } from "../battle/model/TurnModel";

import { BattleSelectWindow } from "../battle/view/BattleSelectWindow";
import { PlayerPartyWindow } from "../battle/view/PlayerPartyWindow";
import { AttackSelectWindow } from '../battle/view/AttackSelectWindow';
import { EnemySelectWindow } from "../battle/view/EnemySelectWindow";
import { BattleMessageWindow } from "../battle/view/BattleMessageWindow";
import { SpecialSkillSelectWindow } from "../battle/view/SpecialSkillSelectWindow";
import { MagicSkillSelectWindow } from "../battle/view/MagicSkillSelectWindow";
import { ItemSelectWindow } from "../battle/view/ItemSelectWindow";

import { BattlePresenter } from "../battle/presenter/BattlePresenter";

import { Npc } from "../gamemain/view/character/Npc";

import { gameStateManager } from "../GameAllState/GameStateManager";
import { GameStateManager } from "../GameAllState/GameStateManager";
import { CacheDataUpdate } from "../core/CacheDataUpdate";

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
    private specialSkillSelectWindow: SpecialSkillSelectWindow;
    private magicSkillSelectWindow: MagicSkillSelectWindow;
    private itemSelectWindow: ItemSelectWindow;

    //presenter
    private battlePresenter: BattlePresenter;

    private cursorsKeys: Phaser.Types.Input.Keyboard.CursorKeys;//キーボード設定
    private mainCamera: Phaser.Cameras.Scene2D.Camera;

    constructor() { super('Battle'); }

    init() {//dataはマップ上の敵キャラ接触で連携されるデータ
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
        this.battleModel = new BattleModel(
            this,
            (battleData as { usePatern: string, fieldHitEnemy: Npc, canNotRunaway: boolean })
        );
        this.commandSelectModel = new CommandSelectModel();
        this.turnModel = new TurnModel();

        //view
        this.battleSelectWindow = new BattleSelectWindow(this, battleData.canNotRunaway);
        this.playerPartyWindow = new PlayerPartyWindow(this);
        this.attackSelectWindow = new AttackSelectWindow(this)
        this.enemySelectWindow = new EnemySelectWindow(this);
        this.battleMessageWindow = new BattleMessageWindow(this);
        this.specialSkillSelectWindow = new SpecialSkillSelectWindow(this);
        this.magicSkillSelectWindow = new MagicSkillSelectWindow(this);
        this.itemSelectWindow = new ItemSelectWindow(this, this.battleModel);

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
            this.battleMessageWindow,
            this.specialSkillSelectWindow,
            this.magicSkillSelectWindow,
            this.itemSelectWindow
        );
        this.battlePresenter.init();

        //マウスポインタ—を初期化
        //https://developer.mozilla.org/en-US/docs/Web/CSS/cursor
        //default,pointer,help,wait...etc
        //※phaserはブラウザが管理するマウス設定キーを使用しているだけなので上記のキーはphaserのドキュメントには無い。他にもありそう。
        this.input.setDefaultCursor('default');//カーソルを初期化
    }

    async create(data: { sceneKey: string }) {

        //Phaserのイベントエミッター
        this.events.on('BattleEnd', () => {

            this.endScene();

        }, this);

        // ゲームオーバーの監視
        const gameOverSub = gameStateManager.onGameOver$.subscribe(() => {
            this.input.enabled = false;
            this.cameras.main.fadeOut(1000);
        });
        this.events.once('shutdown', () => gameOverSub.unsubscribe());

        //背景画像
        //状態管理クラスから現在のバトル用データを取得
        const manager = GameStateManager.getInstance();
        this.add.image(Number(this.game.config.width) / 2, Number(this.game.config.height) / 2, manager.currentBattleBackGroundKey);

        this.battlePresenter.create(
            this.events,
            {
                battleSelect: this.battleSelectWindow,
                playerPartyWindow: this.playerPartyWindow,
                attackSelect: this.attackSelectWindow,
                enemySelectWindow: this.enemySelectWindow,
                specialSkillSelect: this.specialSkillSelectWindow,
                magicSkillSelect: this.magicSkillSelectWindow,
                itemSelectWindow: this.itemSelectWindow
            });
    }

    public endScene() {

        //rxjsのフラグを更新
        gameStateManager.endBattle();

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

                //キャッシュを更新
                const cacheDataUpdate = new CacheDataUpdate(this);
                cacheDataUpdate.phaserCacheDataUpdate();

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
    // public resumeScene() {
    //     this.mainCamera.postFX.clear();
    //     this.scene.resume();
    // }

}