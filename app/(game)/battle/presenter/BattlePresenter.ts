import { BattleScene, ViewsContainer } from "../../lib/types";
import { BattleModel } from "../model/BattleModel";
import { CommandSelectModel } from "../model/CommandSelectModel";
import { TurnModel } from "../model/TurnModel";
import { BattleSelectWindow } from "../view/BattleSelectWindow";
import { PlayerPartyWindow } from '../view/PlayerPartyWindow';
import { AttackSelectWindow } from "../view/AttackSelectWindow";
import { EnemySelectWindow } from "../view/EnemySelectWindow";
import { BattleMessageWindow } from '../view/BattleMessageWindow';

import { StateMachine } from "./StateMachine";

import PlayerAttack from "./PlayerAttack";
import EnemyAttack from "./EnemyAttack";

import { gameStateManager } from "../../GameAllState/GameStateManager";

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
        battleMessageWindow: BattleMessageWindow
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
    }

    public init() {
        this.soundScene = this.battleScene.scene.get('Sound') as Sound;

        this.commandSelectModel.setupTurnOrder(this.battleModel.getPlayerPartyList());
        this.battleSelectWindow.init();
        this.playerPartyWindow.init();
        this.attackSelectWindow.init();
        this.enemySelectWindow.init(this.battleModel.getEnemyParty());
        this.battleMessageWindow.init();
    }

    public async create(events: Phaser.Events.EventEmitter, views: ViewsContainer) {
        this.battleScene.game.events.emit('BGM_BATTLE', '');

        this.endEvents = events;

        //各viewのcreateを実行
        this.battleSelectWindow.createBattleSelectWindow(100, Number(this.battleScene.game.config.height) - 200);
        this.playerPartyWindow.createBattleCharacterIcon(this.battleModel.getPartyList(), 200, Number(this.battleScene.game.config.height) - 200);
        //AttackSelectWindowはinitでcreate実施
        //EnemySelectWindowはinitでcreate実施
        //battleMessageWindowはinitでcreate実施

        //depth設定
        this.battleSelectWindow.setDepth(100);
        this.playerPartyWindow.setDepth(90);
        this.attackSelectWindow.setDepth(110);
        this.enemySelectWindow.setDepth(80);
        this.battleMessageWindow.setDepth(500);

        /* ------------------履歴管理------------------ */
        this.stateMachine = new StateMachine(views);


        /* ------------------状態定義------------------ */

        await this.battleMessageWindow.messageOutput('敵が現れた！', 1000);

        this.stateMachine.addState('BATTLE_SELECT', {
            enter: (v) => {
                v.battleSelect.show();//ここでスプライトを渡してスキルとか選択させるとか
                v.playerPartyWindow.show();
                v.attackSelect.hide();
            },
            exit: (v) => v.battleSelect.move()
        });

        // キャラ選択はせず左から順番に処理するためアイコンは選択処理しない
        // this.stateMachine.addState('CHARACTER_ICON', {
        //     enter: (v) => v.main.show(),
        //     exit: (v) => v.main.hide()
        // });

        this.stateMachine.addState('ATTACK_SELECT', {
            enter: (v, data) => {
                // console.log("キャラクター:", data);
                v.attackSelect.show(data)
            },
            exit: (v) => v.attackSelect.hide()
        });

        this.stateMachine.addState('ENEMY_SELECT', {
            enter: (v) => {
                v.enemySelectWindow.show(undefined);
            },
            exit: (v) => v.enemySelectWindow.hide()
        });

        // this.stateMachine.addState('ITEM_SELECT', {
        //     enter: (v, data) => {
        //         console.log("アイテムリスト受信:", data);
        //         v.item.show();
        //     },
        //     exit: (v) => v.item.hide()
        // });


        /* ------------------イベントの購読------------------ */

        //【戦闘選択】【戦う】
        views.battleSelect.on('Battle_Select_Submit', () => {//コールバック

            //次のコマンド選択キャラクターを取得しアイコンを点滅
            const character = this.commandSelectModel.getCurrentCharacter().name;
            const characterIcon = this.playerPartyWindow.getCharacterIcon(character);
            this.attackSelectWindow.setNowCharacterIcon(characterIcon);
            this.playerPartyWindow.lightUpDown(character);

            this.stateMachine.push('ATTACK_SELECT', this.commandSelectModel.getCurrentCharacter());//攻撃方法の選択に移動
        });

        //【攻撃方法選択】【攻撃】
        views.attackSelect.on('Attack_Select_Submit', () => {
            this.stateMachine.push('ENEMY_SELECT');//通常攻撃選択時、敵キャラクターの選択に移動
        });

        //【攻撃方法選択】【戻る】
        views.attackSelect.on('Select_back_Submit', () => {
            this.stateMachine.pop(); // 履歴を使って戻る
            this.playerPartyWindow.deleteNowLightUpDown('player');//現状はプレイヤーのみ
            views.attackSelect.hide();
        });

        //【敵キャラクター選択】
        views.enemySelectWindow.on('Enemy_Select_Submit', (enemy: Phaser.GameObjects.Image) => {

            //点滅を停止
            const character = this.commandSelectModel.getCurrentCharacter().name;
            this.playerPartyWindow.deleteNowLightUpDown(character);

            //キャラクターに選択対象の敵を登録
            this.commandSelectModel.getCurrentCharacter().setData('BattleTarget', enemy);
            this.commandSelectModel.nextTurn();
        });

        //【敵キャラクター選択】【戻る】
        views.enemySelectWindow.on('Select_back_Submit', () => {
            this.stateMachine.pop();
        });


        // 【アイテム】
        // views.battleSelect.on('Battle_Item_Submit', () => {
        //     this.stateMachine.push('ITEM', ["ポーション", "エリクサー"]);
        // });

        //【アイテム】【戻る】
        views.item.on('Select_back_Submit', () => {
            this.stateMachine.pop(); // 履歴を使って戻る
        });

        // 初期遷移
        this.stateMachine.push('BATTLE_SELECT');



        //---------コマンド選択-----------
        this.commandSelectModel.on('CommandSelect', () => {
            console.log(`次キャラクターのコマンド選択`);

            //次のコマンド選択キャラクターを取得しアイコンを点滅
            const character = this.commandSelectModel.getCurrentCharacter().name;
            const characterIcon = this.playerPartyWindow.getCharacterIcon(character);
            this.attackSelectWindow.setNowCharacterIcon(characterIcon);
            this.playerPartyWindow.lightUpDown(character);

            this.stateMachine.push('ATTACK_SELECT');
        });

        this.commandSelectModel.on('CommandSelectFinish', () => {
            console.log('戦闘開始')

            //敵の攻撃対象を設定
            this.battleModel.setEnemyAttackTarget(this.playerPartyWindow.getCharacterIcon('player'));
            this.turnModel.setupTurnOrder(this.battleModel.getBattlerList());

            this.battle2(this.turnModel.getCurrentCharacter());

            // this.stateMachine.push('BATTLE_SELECT', undefined);
        });

        //---------ターン-----------
        this.turnModel.on('TurnChange', (currentActive: Phaser.GameObjects.GameObject) => {

            this.battle2(currentActive);
        })

        this.turnModel.on('TurnFinish', () => {

            //最初のコマンドに戻る
            this.stateMachine.push('BATTLE_SELECT');
        })

        //シーン終了時にイベントをoff
        this.battleScene.events.once('shutdown', () => {
            views.battleSelect.off('Battle_Select_Submit');
            views.attackSelect.off('Attack_Select_Submit');
            views.attackSelect.off('Select_back_Submit');
            views.enemySelectWindow.off('Enemy_Select_Submit');
            views.enemySelectWindow.off('Select_back_Submit');
            this.turnModel.off('TurnChange');
        })
    }

    async battle2(battler: Phaser.GameObjects.GameObject) {
        gameStateManager.damage(100);
        let winner = '';

        //攻撃
        if (battler.getData('NpcType') !== 'enemy') {
            const playerAttack = new PlayerAttack(this.battleScene);
            await playerAttack.attack(this.battleMessageWindow, battler as Phaser.GameObjects.Sprite);

        } else if (battler.getData('NpcType') === 'enemy' && battler.data.values.HP > 0) {
            const enemyAttack = new EnemyAttack(this.battleScene);
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


        if (winner === 'player') {
            gameStateManager.addMoney(10);
            this.soundScene.SE_victory.play({ loop: false });

            //フィールドの敵を消去
            if (this.battleModel.getUsePatern() === 'normal') {
                this.battleModel.getFieldHitEnemy().deleteCharacter();
            }

            await this.battleMessageWindow.messageOutput('勝利！', 2000);

            this.endEvents.emit('BattleEnd');

        } else if (winner === 'enemy') {
            await this.battleMessageWindow.messageOutput('ゲームオーバー', 1000);
            this.battleScene.scene.launch('GameOver');
        }

        //ターンを更新
        if (!winner) {
            this.turnModel.nextTurn();
        }
    }

    private checkPlayerStatus() {
        let continueFlag = false;
        this.battleModel.getPlayerParty().forEach(list => {
            if (list.data.values.HP > 0) {
                continueFlag = true;
            }
        });
        return continueFlag;
    }

    private checkEnemyStatus() {
        let continueFlag = false;
        this.battleModel.getEnemyParty().forEach(list => {
            if (list.data.values.HP > 0) {
                continueFlag = true;
            }
        })
        return continueFlag;
    }

}
