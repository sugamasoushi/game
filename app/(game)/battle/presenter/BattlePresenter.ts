import { BattleScene, ViewsContainer } from "../../lib/types";
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
import { BattleExecutor } from "./BattleExecutor";
import { BattleFlowController } from "./BattleFlowController";
import { BattleViewCoordinator } from "./BattleViewCoordinator";
import { BattleSceneEventBinder } from "./BattleSceneEventBinder";

import { Sound } from "../../scenes/Sound";

export class BattlePresenter {
    private battleScene: BattleScene;
    private soundScene: Sound;

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

    // 履歴を管理し、戻る操作の際に履歴通りのウィンドウを表示する
    private stateMachine: StateMachine;

    // 責務ごとに分割した協調オブジェクト
    private viewCoordinator: BattleViewCoordinator;
    private executor: BattleExecutor;
    private flowController: BattleFlowController;
    private sceneEventBinder: BattleSceneEventBinder;

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

        // コマンド選択順を初期化
        this.commandSelectModel.setupTurnOrder(this.battleModel.getPlayerPartyList());

        // View協調オブジェクトを生成し、各Viewを初期化
        this.viewCoordinator = new BattleViewCoordinator(
            this.battleScene,
            this.soundScene,
            this.battleModel,
            this.commandSelectModel,
            this.battleSelectWindow,
            this.playerPartyWindow,
            this.attackSelectWindow,
            this.enemySelectWindow,
            this.battleMessageWindow,
            this.specialSkillSelectWindow,
            this.magicSkillSelectWindow,
            this.itemSelectWindow
        );
        this.viewCoordinator.initWindows();
    }

    public async create(events: Phaser.Events.EventEmitter, views: ViewsContainer) {

        // 履歴を使った画面遷移を管理するステートマシン
        this.stateMachine = new StateMachine(views);

        // Viewの生成・depth設定・状態遷移配線
        this.viewCoordinator.create(this.stateMachine, views);

        // 戦闘実行・勝敗判定
        this.executor = new BattleExecutor(
            this.battleScene,
            this.soundScene,
            this.battleModel,
            this.turnModel,
            this.battleMessageWindow,
            this.playerPartyWindow
        );
        this.executor.setEndEvents(events);

        // コマンド選択順・ターン進行のイベント連携
        this.flowController = new BattleFlowController(
            this.battleScene,
            this.battleModel,
            this.commandSelectModel,
            this.turnModel,
            this.playerPartyWindow,
            this.stateMachine,
            this.executor
        );
        this.flowController.setup();

        // Sceneレベルのイベント配線
        this.sceneEventBinder = new BattleSceneEventBinder(
            this.battleScene,
            this.commandSelectModel,
            this.battleMessageWindow,
            this.playerPartyWindow,
            this.executor
        );
        this.sceneEventBinder.setup();

        // 初期遷移
        this.stateMachine.push('BATTLE_SELECT');

        // 冒頭メッセージ
        await this.battleMessageWindow.messageOutput('敵が現れた！', 1200);
    }
}
