import { BattleScene, FieldScene } from "../lib/SceneTypes";
import { State, BgmState } from "../lib/StateTypes";

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

import { Npc } from "../field/view/character/Npc";

import { gameStateManager } from "../core/GameStateManager";
import { GameStateManager } from "../core/GameStateManager";
import { CacheDataUpdate } from "../core/CacheDataUpdate";

export class Battle extends Phaser.Scene implements BattleScene {

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

    constructor() { super('Battle'); }

    init() {//dataはマップ上の敵キャラ接触で連携されるデータ

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

        //暗転からのフェードイン
        this.cameras.main.fadeIn(200);

        //現在のBGM状態を更新
        gameStateManager.setBgmState(BgmState.BATTLE);

        //Phaserのイベントエミッター
        this.events.on('BattleEnd', () => {
            this.endScene();
        }, this);

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

                //シーンの更新
                const manager = GameStateManager.getInstance();
                manager.updateState({ state: State.FIELD_RESUME }, 'resume');

                //現在のBGM状態を更新
                manager.setBgmState(BgmState.FIELD);

                //キャッシュを更新
                const cacheDataUpdate = new CacheDataUpdate(this);
                cacheDataUpdate.phaserCacheDataUpdate();

                //状態更新
                manager.updateState({ state: State.NOSTATE }, 'BattleEnd');

                this.events.emit('shutdown');

                //バトルシーンを停止
                this.scene.stop();
            }
        });
    }

    public getCursorsKeys(): Phaser.Types.Input.Keyboard.CursorKeys {
        return this.cursorsKeys;
    }

    public getMainCamera(): Phaser.Cameras.Scene2D.Camera {
        return this.cameras.main;
    }
}