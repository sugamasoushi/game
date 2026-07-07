import { BattleScene, ViewsContainer } from "../../lib/types";
import { BattleModel } from "../model/BattleModel";
import { CommandSelectModel } from "../model/CommandSelectModel";

import { BattleSelectWindow } from "../view/BattleSelectWindow";
import { PlayerPartyWindow } from "../view/PlayerPartyWindow";
import { AttackSelectWindow } from "../view/AttackSelectWindow";
import { EnemySelectWindow } from "../view/EnemySelectWindow";
import { BattleMessageWindow } from "../view/BattleMessageWindow";
import { SpecialSkillSelectWindow } from "../view/SpecialSkillSelectWindow";
import { MagicSkillSelectWindow } from "../view/MagicSkillSelectWindow";
import { ItemSelectWindow } from "../view/ItemSelectWindow";

import { StateMachine } from "./StateMachine";
import { Sound } from "../../scenes/Sound";

// 各Viewの生成・表示制御とStateMachineの状態遷移配線を担う
export class BattleViewCoordinator {
    private views: ViewsContainer;
    private stateMachine: StateMachine;

    constructor(
        private battleScene: BattleScene,
        private soundScene: Sound,
        private battleModel: BattleModel,
        private commandSelectModel: CommandSelectModel,
        private battleSelectWindow: BattleSelectWindow,
        private playerPartyWindow: PlayerPartyWindow,
        private attackSelectWindow: AttackSelectWindow,
        private enemySelectWindow: EnemySelectWindow,
        private battleMessageWindow: BattleMessageWindow,
        private specialSkillSelectWindow: SpecialSkillSelectWindow,
        private magicSkillSelectWindow: MagicSkillSelectWindow,
        private itemSelectWindow: ItemSelectWindow
    ) { }

    // 各Viewの初期化（Presenter.initから呼ばれる）
    public initWindows() {
        this.battleSelectWindow.init();
        this.playerPartyWindow.init();
        this.attackSelectWindow.init();
        this.enemySelectWindow.init(this.battleModel.getEnemyPartyList());
        this.battleMessageWindow.init();
        this.specialSkillSelectWindow.init();
        this.magicSkillSelectWindow.init();
        this.itemSelectWindow.init();
    }

    // Viewの生成・depth設定・状態遷移配線をまとめて実行
    public create(stateMachine: StateMachine, views: ViewsContainer) {
        this.stateMachine = stateMachine;
        this.views = views;

        // 各viewのcreateを実行
        this.battleSelectWindow.createBattleSelectWindow(250, Number(this.battleScene.game.config.height) - 200);
        this.playerPartyWindow.createBattleCharacterIcon(this.battleModel.getPlayerPartyList(), 400, Number(this.battleScene.game.config.height) - 200);
        // AttackSelectWindowはinitでcreate実施
        // EnemySelectWindowはinitでcreate実施
        // battleMessageWindowはinitでcreate実施
        // specialSkillSelectWindowはinitでcreate実施
        // magicSkillSelectWindowはinitでcreate実施
        // itemSelectWindowはinitでcreate実施

        // depth設定
        this.battleSelectWindow.setDepth(100);
        this.playerPartyWindow.setDepth(90);
        this.attackSelectWindow.setDepth(110);
        this.enemySelectWindow.setDepth(80);
        this.battleMessageWindow.setDepth(500);
        this.specialSkillSelectWindow.setDepth(120);
        this.magicSkillSelectWindow.setDepth(120);
        this.itemSelectWindow.setDepth(120);

        // 各ビューの設定
        this.settingBattleSelectWindow();
        this.settingCharacterSelectWindow();
        this.settingAttackSelectWindow();
        this.settingSpecialSkillSelectWindow();
        this.settingMagicSkillSelectWindow();
        this.settingEnemySelectWindow();
        this.settingItemSelectWindow();
    }

    // 設定：BattleSelectWindow
    private settingBattleSelectWindow() {

        // 表示・非表示設定
        this.stateMachine.addState('BATTLE_SELECT', {
            enter: (v) => {
                v.battleSelect.show();
                v.playerPartyWindow.show();
                v.attackSelect.hide();
            },
            exit: (v) => v.battleSelect.move()
        });

        // 【戦闘選択】【戦う】
        this.views.battleSelect.on('Battle_Select_Submit', () => {

            // 次のコマンド選択キャラクターを取得しアイコンを点滅
            this.playerPartyWindow.lightUpDown(this.commandSelectModel.getCurrentCharacter().name);

            // 攻撃方法選択ウィンドウに移動
            this.stateMachine.push('ATTACK_SELECT');
            this.soundScene.playSe('SE_Beep5');
        });

        // 【攻撃方法選択】【アイテム】
        this.views.battleSelect.on('Item_Select_Submit', () => {

            // アイテム選択ウィンドウに移動
            this.stateMachine.push('ITEM_SELECT');
            this.soundScene.playSe('SE_Beep5');
        });

        // シーン終了時にイベントを破棄
        this.battleScene.events.once('shutdown', () => {
            this.views.battleSelect.off('Battle_Select_Submit');
            this.views.battleSelect.off('Item_Select_Submit');
        });
    }

    // 設定：CharacterSelectWindow
    private settingCharacterSelectWindow() {
        // キャラ選択はせず左から順番に処理するためアイコンは選択処理しない
        // this.stateMachine.addState('CHARACTER_ICON', {
        //     enter: (v) => v.main.show(),
        //     exit: (v) => v.main.hide()
        // });
    }

    // 設定：AttackSelectWindow
    private settingAttackSelectWindow() {

        // 表示・非表示設定
        this.stateMachine.addState('ATTACK_SELECT', {
            enter: (v) => {
                v.attackSelect.show(
                    this.commandSelectModel.getCurrentCharacter(),
                    this.playerPartyWindow.getCharacterIcon(this.commandSelectModel.getCurrentCharacter().name)
                )
            },
            exit: (v) => v.attackSelect.hide()
        });

        // 【攻撃方法選択】【攻撃】
        this.views.attackSelect.on('Attack_Select_Submit', () => {
            this.stateMachine.push('ENEMY_SELECT');
            this.soundScene.playSe('SE_Beep5');
        });

        // 【攻撃方法選択】【戻る】
        this.views.attackSelect.on('Select_back_Submit', () => {

            // 点滅を停止
            const character = this.commandSelectModel.getCurrentCharacter().name;
            this.playerPartyWindow.deleteNowLightUpDown(character);// 現状はプレイヤーのみ

            // 前のキャラクターに戻れるかチェック
            const hasPrevious = this.commandSelectModel.previousTurn();

            if (hasPrevious) {
                // 前のキャラに戻ったので、そのキャラの点滅を開始
                this.playerPartyWindow.lightUpDown(this.commandSelectModel.getCurrentCharacter().name);
            }

            // 履歴を使って戻る
            this.stateMachine.pop();
        });

        // 【攻撃方法選択】【特技】
        this.views.attackSelect.on('SpecialSkill_Select_Submit', () => {

            this.stateMachine.push('SPECIAL_SKILL_SELECT');
            this.soundScene.playSe('SE_Beep5');
        });

        // 【攻撃方法選択】【魔法】
        this.views.attackSelect.on('MagicSkill_Select_Submit', () => {

            this.stateMachine.push('MAGIC_SKILL_SELECT');
            this.soundScene.playSe('SE_Beep5');
        });

        // シーン終了時にイベントを破棄
        this.battleScene.events.once('shutdown', () => {
            this.views.attackSelect.off('Attack_Select_Submit');
            this.views.attackSelect.off('Select_back_Submit');
            this.views.attackSelect.off('SpecialSkill_Select_Submit');
            this.views.attackSelect.off('MagicSkill_Select_Submit');
        });
    }

    // 設定：SpecialSkillSelectWindow
    private settingSpecialSkillSelectWindow() {

        // 表示・非表示設定
        this.stateMachine.addState('SPECIAL_SKILL_SELECT', {
            enter: (v) => {
                v.specialSkillSelect.show(
                    this.commandSelectModel.getCurrentCharacter(),
                    this.playerPartyWindow.getCharacterIcon(this.commandSelectModel.getCurrentCharacter().name)
                )
            },
            exit: (v) => v.specialSkillSelect.hide()
        });

        // 【特技選択】【特技】
        this.views.specialSkillSelect.on('Attack_Select_Submit', () => {
            this.stateMachine.push('ENEMY_SELECT');
            this.soundScene.playSe('SE_Beep5');
        });

        // 【特技選択】【攻撃しない】
        this.views.specialSkillSelect.on('No_Attack_Select_Submit', () => {

            // 点滅を停止
            const character = this.commandSelectModel.getCurrentCharacter().name;
            this.playerPartyWindow.deleteNowLightUpDown(character);
            this.soundScene.playSe('SE_Beep5');

            this.commandSelectModel.nextTurn();
        });

        // 【特技選択】【戻る】
        this.views.specialSkillSelect.on('Select_back_Submit', () => {

            // 履歴を使って戻る
            this.stateMachine.pop();
        });

        // シーン終了時にイベントを破棄
        this.battleScene.events.once('shutdown', () => {
            this.views.specialSkillSelect.off('Attack_Select_Submit');
            this.views.specialSkillSelect.off('Select_back_Submit');
            this.views.specialSkillSelect.off('No_Attack_Select_Submit');
        });
    }

    // 設定：MagicSkillSelectWindow
    private settingMagicSkillSelectWindow() {

        // 表示・非表示設定
        this.stateMachine.addState('MAGIC_SKILL_SELECT', {
            enter: (v) => {
                v.magicSkillSelect.show(
                    this.commandSelectModel.getCurrentCharacter(),
                    this.playerPartyWindow.getCharacterIcon(this.commandSelectModel.getCurrentCharacter().name)
                )
            },
            exit: (v) => v.magicSkillSelect.hide()
        });

        // 【魔法選択】【魔法】
        this.views.magicSkillSelect.on('Attack_Select_Submit', () => {
            this.stateMachine.push('ENEMY_SELECT');
            this.soundScene.playSe('SE_Beep5');
        });

        // 【魔法選択】【攻撃しない】
        this.views.magicSkillSelect.on('No_Attack_Select_Submit', () => {

            // 点滅を停止
            const character = this.commandSelectModel.getCurrentCharacter().name;
            this.playerPartyWindow.deleteNowLightUpDown(character);
            this.soundScene.playSe('SE_Beep5');

            this.commandSelectModel.nextTurn();
        });

        // 【魔法選択】【戻る】
        this.views.magicSkillSelect.on('Select_back_Submit', () => {

            // 履歴を使って戻る
            this.stateMachine.pop();
        });

        // シーン終了時にイベントを破棄
        this.battleScene.events.once('shutdown', () => {
            this.views.magicSkillSelect.off('Attack_Select_Submit');
            this.views.magicSkillSelect.off('No_Attack_Select_Submit');
            this.views.magicSkillSelect.off('Select_back_Submit');
        });
    }

    // 設定：EnemySelectWindow
    private settingEnemySelectWindow() {

        // 表示・非表示設定
        this.stateMachine.addState('ENEMY_SELECT', {
            enter: (v) => {
                v.enemySelectWindow.show(
                    this.commandSelectModel.getCurrentCharacter(),
                    this.playerPartyWindow.getCharacterIcon(this.commandSelectModel.getCurrentCharacter().name));
            },
            exit: (v) => v.enemySelectWindow.hide()
        });

        // 【敵キャラクター選択】
        this.views.enemySelectWindow.on('Enemy_Select_Submit', (enemy: Phaser.GameObjects.Image) => {

            // 点滅を停止
            const character = this.commandSelectModel.getCurrentCharacter().name;
            this.playerPartyWindow.deleteNowLightUpDown(character);
            this.soundScene.playSe('SE_decisionButton15');

            // キャラクターに選択対象の敵を登録
            this.commandSelectModel.getCurrentCharacter().setData('BattleTarget', enemy);
            this.commandSelectModel.nextTurn();

            // commandSelectModel()の処理へ
        });

        // 【敵キャラクター選択】【戻る】
        this.views.enemySelectWindow.on('Select_back_Submit', () => {
            this.stateMachine.pop();
        });

        // シーン終了時にイベントを破棄
        this.battleScene.events.once('shutdown', () => {
            this.views.enemySelectWindow.off('Enemy_Select_Submit');
            this.views.enemySelectWindow.off('Select_back_Submit');
        });
    }

    // 設定：ItemSelectWindow
    private settingItemSelectWindow() {

        this.stateMachine.addState('ITEM_SELECT', {
            enter: (v) => {
                v.itemSelectWindow.show();
            },
            exit: (v) => v.itemSelectWindow.hide()
        });

        // 【アイテム】
        this.views.itemSelectWindow.on('Use_Item_Submit', (listName: string) => {
            // this.stateMachine.push('ITEM_SELECT');
            /**
             * アイテム使用後、遷移無し
             */
            console.log('アイテム使用' + listName);
        });

        // 【アイテム】【戻る】
        this.views.itemSelectWindow.on('Select_back_Submit', () => {
            this.stateMachine.pop(); // 履歴を使って戻る
        });

        // シーン終了時にイベントを破棄
        this.battleScene.events.once('shutdown', () => {
            this.views.itemSelectWindow.off('Select_back_Submit');
            this.views.itemSelectWindow.off('Use_Item_Submit');
        });
    }
}
