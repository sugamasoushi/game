import { BattleScene, ViewsContainer, SkillDetail } from "../../lib/types";
import { BattleModel } from "../model/BattleModel";
import { CommandSelectModel } from "../model/CommandSelectModel";
import { TurnModel } from "../model/TurnModel";
import { BattleSelectWindow } from "../view/BattleSelectWindow";
import { PlayerPartyWindow } from '../view/PlayerPartyWindow';
import { AttackSelectWindow } from "../view/AttackSelectWindow";
import { EnemySelectWindow } from "../view/EnemySelectWindow";
import { BattleMessageWindow } from '../view/BattleMessageWindow';
import { SpecialSkillSelectWindow } from "../view/SpecialSkillSelectWindow";
import { MagicSkillSelectWindow } from "../view/MagicSkillSelectWindow";
import { ItemSelectWindow } from "../view/ItemSelectWindow";

import { StateMachine } from "./StateMachine";

import PlayerAttack from "./PlayerAttack";
import PlayerGuard from "./PlayerGuard";
import EnemyAttack from "./EnemyAttack";

import { gameStateManager } from "../../GameAllState/GameStateManager";
import { ItemUpdate } from "../../Data/ItemUpdate";

import { Sound } from "../../scenes/Sound";

export class BattlePresenter {
    private battleScene: BattleScene;
    private soundScene: Sound;
    private endEvents: Phaser.Events.EventEmitter

    private battleModel: BattleModel;
    private commandSelectModel: CommandSelectModel;
    private turnModel: TurnModel;

    private battleSelectWindow: BattleSelectWindow;
    private playerPartyWindow: PlayerPartyWindow;
    private attackSelectWindow: AttackSelectWindow;
    private enemySelectWindow: EnemySelectWindow;
    private battleMessageWindow: BattleMessageWindow;
    private specialSkillSelectWindow: SpecialSkillSelectWindow;
    private magicSkillSelectWindow: MagicSkillSelectWindow;
    private itemSelectWindow: ItemSelectWindow;

    private views: ViewsContainer

    private autoFlg: boolean = false;

    //履歴
    private stateMachine: StateMachine;

    constructor(
        battleScene: BattleScene,
        battleModel: BattleModel,
        commandSelectModel: CommandSelectModel,
        turnModel: TurnModel,

        battleSelectWindow: BattleSelectWindow,
        playerPartyWindow: PlayerPartyWindow,
        attackSelectWindow: AttackSelectWindow,
        enemySelectWindow: EnemySelectWindow,
        battleMessageWindow: BattleMessageWindow,
        specialSkillSelectWindow: SpecialSkillSelectWindow,
        magicSkillSelectWindow: MagicSkillSelectWindow,
        itemSelectWindow: ItemSelectWindow
    ) {
        this.battleScene = battleScene;
        this.battleModel = battleModel;
        this.commandSelectModel = commandSelectModel;
        this.turnModel = turnModel;
        this.battleSelectWindow = battleSelectWindow;
        this.playerPartyWindow = playerPartyWindow;
        this.attackSelectWindow = attackSelectWindow;
        this.enemySelectWindow = enemySelectWindow;
        this.battleMessageWindow = battleMessageWindow;
        this.specialSkillSelectWindow = specialSkillSelectWindow;
        this.magicSkillSelectWindow = magicSkillSelectWindow;
        this.itemSelectWindow = itemSelectWindow;
    }

    public init() {
        this.soundScene = this.battleScene.scene.get('Sound') as Sound;

        this.commandSelectModel.setupTurnOrder(this.battleModel.getPlayerPartyList());
        this.battleSelectWindow.init();
        this.playerPartyWindow.init();
        this.attackSelectWindow.init();
        this.enemySelectWindow.init(this.battleModel.getEnemyPartyList());
        this.battleMessageWindow.init();
        this.specialSkillSelectWindow.init();
        this.magicSkillSelectWindow.init();
        this.itemSelectWindow.init();
    }

    public async create(events: Phaser.Events.EventEmitter, views: ViewsContainer) {
        this.battleScene.game.events.emit('BGM_BATTLE', '');

        this.endEvents = events;

        this.views = views;

        //各viewのcreateを実行
        this.battleSelectWindow.createBattleSelectWindow(250, Number(this.battleScene.game.config.height) - 200);
        this.playerPartyWindow.createBattleCharacterIcon(this.battleModel.getPlayerPartyList(), 400, Number(this.battleScene.game.config.height) - 200);
        //AttackSelectWindowはinitでcreate実施
        //EnemySelectWindowはinitでcreate実施
        //battleMessageWindowはinitでcreate実施
        //specialSkillSelectWindowはinitでcreate実施
        //magicSkillSelectWindowはinitでcreate実施
        //itemSelectWindowはinitでcreate実施

        //depth設定
        this.battleSelectWindow.setDepth(100);
        this.playerPartyWindow.setDepth(90);
        this.attackSelectWindow.setDepth(110);
        this.enemySelectWindow.setDepth(80);
        this.battleMessageWindow.setDepth(500);
        this.specialSkillSelectWindow.setDepth(120);
        this.magicSkillSelectWindow.setDepth(120);
        this.itemSelectWindow.setDepth(120);

        //履歴を管理し、戻る操作の際に履歴通りのウィンドウを表示するための機能
        this.stateMachine = new StateMachine(this.views);

        //各ビューの設定
        this.settingBattleSelectWindow();
        this.settingCharacterSelectWindow();
        this.settingAttackSelectWindow();
        this.settingSpecialSkillSelectWindow();
        this.settingMagicSkillSelectWindow();
        this.settingEnemySelectWindow();
        this.settingItemSelectWindow();

        //コマンド選択モデルのイベント設定
        this.setCommandSelectModel();

        //ターンモデルのイベント設定
        this.setTurnModel();

        //イベントの設定
        this.setBattleEventEmitter();

        // 初期遷移
        this.stateMachine.push('BATTLE_SELECT');

        //冒頭メッセージ
        await this.battleMessageWindow.messageOutput('敵が現れた！', 1200);
    }

    //設定：BattleSelectWindow
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

        //【戦闘選択】【戦う】
        this.views.battleSelect.on('Battle_Select_Submit', () => {

            //次のコマンド選択キャラクターを取得しアイコンを点滅
            this.playerPartyWindow.lightUpDown(this.commandSelectModel.getCurrentCharacter().name);

            //攻撃方法選択ウィンドウに移動
            this.stateMachine.push('ATTACK_SELECT');
        });

        //【攻撃方法選択】【アイテム】
        this.views.battleSelect.on('Item_Select_Submit', () => {

            //アイテム選択ウィンドウに移動
            this.stateMachine.push('ITEM_SELECT');
        });

        // シーン終了時にイベントを破棄
        this.battleScene.events.once('shutdown', () => {
            this.views.battleSelect.off('Battle_Select_Submit');
            this.views.battleSelect.off('Item_Select_Submit');
        });
    }

    //設定：CharacterSelectWindow
    private settingCharacterSelectWindow() {
        // キャラ選択はせず左から順番に処理するためアイコンは選択処理しない
        // this.stateMachine.addState('CHARACTER_ICON', {
        //     enter: (v) => v.main.show(),
        //     exit: (v) => v.main.hide()
        // });
    }

    //設定：AttackSelectWindow
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

        //【攻撃方法選択】【攻撃】
        this.views.attackSelect.on('Attack_Select_Submit', () => {
            this.stateMachine.push('ENEMY_SELECT');
        });

        //【攻撃方法選択】【戻る】
        this.views.attackSelect.on('Select_back_Submit', () => {

            //点滅を停止
            const character = this.commandSelectModel.getCurrentCharacter().name;
            this.playerPartyWindow.deleteNowLightUpDown(character);//現状はプレイヤーのみ

            // 前のキャラクターに戻れるかチェック
            const hasPrevious = this.commandSelectModel.previousTurn();

            if (hasPrevious) {
                // 前のキャラに戻ったので、そのキャラの点滅を開始
                this.playerPartyWindow.lightUpDown(this.commandSelectModel.getCurrentCharacter().name);
            }

            // 履歴を使って戻る
            this.stateMachine.pop();
        });

        //【攻撃方法選択】【特技】
        this.views.attackSelect.on('SpecialSkill_Select_Submit', () => {

            this.stateMachine.push('SPECIAL_SKILL_SELECT');
        });

        //【攻撃方法選択】【魔法】
        this.views.attackSelect.on('MagicSkill_Select_Submit', () => {

            this.stateMachine.push('MAGIC_SKILL_SELECT');
        });

        // シーン終了時にイベントを破棄
        this.battleScene.events.once('shutdown', () => {
            this.views.attackSelect.off('Attack_Select_Submit');
            this.views.attackSelect.off('Select_back_Submit');
            this.views.attackSelect.off('SpecialSkill_Select_Submit');
            this.views.attackSelect.off('MagicSkill_Select_Submit');
        });
    }

    //設定：SpecialSkillSelectWindow
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

        //【特技選択】【特技】
        this.views.specialSkillSelect.on('Attack_Select_Submit', () => {
            this.stateMachine.push('ENEMY_SELECT');
        });

        //【特技選択】【攻撃しない】
        this.views.specialSkillSelect.on('No_Attack_Select_Submit', () => {

            //点滅を停止
            const character = this.commandSelectModel.getCurrentCharacter().name;
            this.playerPartyWindow.deleteNowLightUpDown(character);

            this.commandSelectModel.nextTurn();
        });

        //【特技選択】【戻る】
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

    //設定：MagicSkillSelectWindow
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

        //【魔法選択】【魔法】
        this.views.magicSkillSelect.on('Attack_Select_Submit', () => {
            this.stateMachine.push('ENEMY_SELECT');
        });

        //【魔法選択】【攻撃しない】
        this.views.magicSkillSelect.on('No_Attack_Select_Submit', () => {

            //点滅を停止
            const character = this.commandSelectModel.getCurrentCharacter().name;
            this.playerPartyWindow.deleteNowLightUpDown(character);

            this.commandSelectModel.nextTurn();
        });

        //【魔法選択】【戻る】
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

    //設定：EnemySelectWindow
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

        //【敵キャラクター選択】
        this.views.enemySelectWindow.on('Enemy_Select_Submit', (enemy: Phaser.GameObjects.Image) => {

            //点滅を停止
            const character = this.commandSelectModel.getCurrentCharacter().name;
            this.playerPartyWindow.deleteNowLightUpDown(character);

            //キャラクターに選択対象の敵を登録
            this.commandSelectModel.getCurrentCharacter().setData('BattleTarget', enemy);
            this.commandSelectModel.nextTurn();

            //commandSelectModel()の処理へ
        });

        //【敵キャラクター選択】【戻る】
        this.views.enemySelectWindow.on('Select_back_Submit', () => {
            this.stateMachine.pop();
        });

        // シーン終了時にイベントを破棄
        this.battleScene.events.once('shutdown', () => {
            this.views.enemySelectWindow.off('Enemy_Select_Submit');
            this.views.enemySelectWindow.off('Select_back_Submit');
        });
    }

    //設定：ItemSelectWindow
    private settingItemSelectWindow() {

        this.stateMachine.addState('ITEM_SELECT', {
            enter: (v) => {
                v.itemSelectWindow.show();
            },
            exit: (v) => v.itemSelectWindow.hide()
        });

        // 【アイテム】
        this.views.itemSelectWindow.on('Use_Item_Submit', (listName: string) => {
            //this.stateMachine.push('ITEM_SELECT');
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

    //キャラクターのコマンド選択順序を管理する
    private setCommandSelectModel() {

        //次キャラクターのコマンド選択
        this.commandSelectModel.on('CommandSelect', () => {

            //次のコマンド選択キャラクターを取得しアイコンを点滅
            this.playerPartyWindow.lightUpDown(this.commandSelectModel.getCurrentCharacter().name);

            this.stateMachine.push('ATTACK_SELECT');
        });

        //戦闘開始
        this.commandSelectModel.on('CommandSelectFinish', () => {

            //ターン順を設定
            this.turnModel.setupTurnOrder(this.battleModel.getBattlerList());

            //戦闘処理
            this.battle(this.turnModel.getCurrentCharacter());
        });

        //イベントの破棄
        this.commandSelectModel.on('shutdown', () => {
            this.commandSelectModel.off('CommandSelect');
            this.commandSelectModel.off('CommandSelectFinish');
        });

    }

    //戦闘時のキャラクター毎のターンを管理する
    private setTurnModel() {

        //次キャラクターのターンへ変更
        this.turnModel.on('TurnChange', (currentActive: Phaser.GameObjects.GameObject) => {
            this.battle(currentActive);
        })

        //全てのキャラクターのターンが終了
        this.turnModel.on('TurnFinish', () => {

            //防御をリセット
            this.battleModel.resetBattleStatus();

            //次のコマンド選択キャラクターをチェック
            this.commandSelectModel.checkNextCommandSelectStartCharacter();

            //オートフラグをリセット
            this.autoFlg = false;

            //最初のコマンドに戻る
            this.stateMachine.push('BATTLE_SELECT');
        })

        //イベントの破棄
        this.turnModel.on('shutdown', () => {
            this.turnModel.off('TurnChange');
            this.turnModel.off('TurnFinish');
        });

    }

    //現在ターンのキャラクターの攻撃処理
    async battle(battler: Phaser.GameObjects.GameObject) {
        let winner = '';

        //攻撃
        //対象の敵が設定されているかつ攻撃者のHPが0以上の場合のみ攻撃
        if (battler.getData('NpcType') !== 'enemy' && battler.data.values.HP > 0) {

            if (this.autoFlg) {
                //プレイヤーキャラクターの攻撃対象を設定
                const targetEnemy = this.battleModel.getPlayerAutoAttackTarget();
                battler.setData('BattleTarget', targetEnemy);
            }

            //攻撃対象が存在しない場合は防御スキルとなる（回復も含む）
            if (!battler.getData('BattleTarget')) {
                const playerGuard = new PlayerGuard(this.battleScene);
                await playerGuard.guard(this.battleMessageWindow, battler as Phaser.GameObjects.Sprite);
            } else {

                //攻撃対象のHPが0以上の場合は攻撃、0以下の場合は攻撃しない
                if (battler.getData('BattleTarget').getData('HP') > 0) {
                    const playerAttack = new PlayerAttack(this.battleScene);
                    await playerAttack.attack(this.battleMessageWindow, battler as Phaser.GameObjects.Sprite);
                } else {
                    await this.battleMessageWindow.messageOutput('相手がいない！！', 1000);
                }
            }

        } else if (battler.getData('NpcType') === 'enemy' && battler.data.values.HP > 0) {
            const enemyAttack = new EnemyAttack(this.battleScene, this.battleModel, this.playerPartyWindow);
            await enemyAttack.attack(this.battleMessageWindow, battler as Phaser.GameObjects.Image);
        }

        //味方のHPをチェック
        if (!this.checkPlayerStatus()) {
            console.log('enemy勝利')
            this.soundScene.stopAllBgm();
            winner = 'enemy';
        }

        //敵のHPをチェック
        if (!this.checkEnemyStatus()) {
            console.log('player勝利')
            this.soundScene.stopAllBgm();
            winner = 'player';
        }

        //勝利
        if (winner === 'player') {
            gameStateManager.addMoney(10);
            this.soundScene.SE_victory.play({ loop: false });

            //フィールドの敵を消去
            if (this.battleModel.getUsePatern() === 'normal') {
                this.battleModel.getFieldHitEnemy().deleteCharacter();
            }

            await this.battleMessageWindow.messageOutput('勝利！', 2000);

            //敵キャラを削除
            this.battleModel.deleteEnemy();

            //HPが0以下のメンバーは1にする（現状、戦闘終了後は必ず１残す）
            this.battleModel.checkPlayerPartyHP();

            this.endEvents.emit('BattleEnd');

        } else if (winner === 'enemy') {

            //フィールドの敵を消去
            if (this.battleModel.getUsePatern() === 'normal') {
                this.battleModel.getFieldHitEnemy().deleteCharacter();
            }

            await this.battleMessageWindow.messageOutput('ゲームオーバー', 1000);
            gameStateManager.triggerGameOver();
            this.endEvents.emit('BattleEnd');
        }

        //ターンを更新
        if (!winner) {
            this.turnModel.nextTurn();
        }
    }

    private checkPlayerStatus() {
        let continueFlag = false;
        for (const list of this.battleModel.getPlayerPartyList()) {
            if (list.data.values.HP > 0) {
                continueFlag = true;
            }
        }
        return continueFlag;
    }

    private checkEnemyStatus() {
        let continueFlag = false;
        for (const list of this.battleModel.getEnemyPartyList()) {
            if (list.data.values.HP > 0) {
                continueFlag = true;
            }
        }
        return continueFlag;
    }

    private setBattleEventEmitter() {

        //メッセージの出力
        this.battleScene.events.on('BATTLE_MESSAGE_OUTPUT', async (text: string, waitTime: number) => {
            await this.battleMessageWindow.messageOutput(text, waitTime);
        });

        //味方のコマンド選択キャラクターアイコンを点滅
        this.battleScene.events.on('PLAYER_ICON_LIGHTUP', (name: string) => {
            this.playerPartyWindow.lightUp(name);
        });

        //味方のコマンド選択キャラクターアイコンを点滅
        this.battleScene.events.on('PLAYER_ICON_LIGHTDOWN', (name: string) => {
            this.playerPartyWindow.lightDown(name);
        });

        //オート選択
        this.battleScene.events.on('AUTO_BATTLE_SELECT', (autoFlg: boolean) => {
            this.autoFlg = autoFlg;
            this.commandSelectModel.emit('CommandSelectFinish');
        });

        this.battleScene.events.on('USE_ITEM', this.onUseItem, this);

        //イベントの破棄
        this.battleScene.events.on('shutdown', () => {
            this.battleScene.events.off('BATTLE_MESSAGE_OUTPUT');
            this.battleScene.events.off('PLAYER_ICON_LIGHTUP');
            this.battleScene.events.off('PLAYER_ICON_LIGHTDOWN');
            this.battleScene.events.off('AUTO_BATTLE_SELECT');
        });
    }

    //アイテム使用
    private onUseItem(itemName: string, count: number, memberIndex: number = 0) {
        const itemUpdate = new ItemUpdate(this.battleScene);
        itemUpdate.useItem(itemName, count, memberIndex);
    }
}
