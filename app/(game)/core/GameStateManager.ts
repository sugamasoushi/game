import { FieldData, OptionData } from '../lib/FieldTypes';
import { State, BgmState, GameState } from '../lib/StateTypes';
import { BehaviorSubject, Observable, distinctUntilChanged } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

const INITIAL_STATE: GameState = {
    state: State.NOSTATE,
    sceneKey: 'string', // 更新元のキーを追加
    money: 100,
    playerPartyList: [],
    fieldNpcList: [],
    fieldEnemyList: [],
    fieldData: { gameMode: 'string', mapKey: 'init', x: 0, y: 0, x2: 0, y2: 0, initStandKey: 'string' },
    battleData: { usePatern: 'string', fieldHitEnemy: undefined, canNotRunaway: false },
    battleFieldKey: 'string',
    eventObj: undefined,
    bgmState: BgmState.NOSTATE,
    optionData: { masterVolume: 100, bgmVolume: 100, bgsVolume: 100, seVolume: 100, textSpeed: 50 },
    highDraw: true,
    virtualPad: true,
    gameClearFlg: false,
    debugMode: false
}

export class GameStateManager {
    private static instance: GameStateManager;

    // 内部保持用。初期値をセット。
    private gameState$ = new BehaviorSubject<GameState>(INITIAL_STATE);

    // 外部公開用のObservable。
    public readonly state$: Observable<{ state: State, fieldData: FieldData, sceneKey: string }> = this.gameState$.pipe(

        //GameStateの中から、「シーンの切り替えに必要な情報だけ」を抽出
        map(gs => ({
            state: gs.state,
            fieldData: gs.fieldData,
            sceneKey: gs.sceneKey ?? 'unknown'
        })),

        // distinctUntilChanged() を使うことで、同じ状態への遷移は通知しないようにする
        //前後の state を比較して、変化があった時だけ通す
        distinctUntilChanged((prev, curr) => {
            // もし新しい状態が RESTART なら、目的地(fieldData)やキーが同じ場合のみ「変更なし(true)」と判定
            if (curr.state === State.FIELD_RESTART) {
                return (
                    /**
                     * FIELD_RESTART時、state、fieldData、sceneKeyがすべて同じであれば、trueを返しフィールド移動となる。
                     * 
                     * ■処理内容
                     * FIELD_RESTART 状態であっても、「移動先のマップデータ（fieldData）」や「シーンキー（sceneKey）」が前回と同一であれば、再起動の通知をブロックする
                     * 
                     * prev.state === curr.state
                     * prev.sceneKey === curr.sceneKey
                     * JSON.stringify(prev.fieldData) === JSON.stringify(curr.fieldData)
                     * 前回と現在のデータが同じかどうかをチェックし、同じであれば次のステップには進まない
                     * 
                     * ■状況例
                     * 外部からpushPlayerPartyList を呼び出し更新された場合、データ変更を検知してしまうため、
                     * フィルタにより「目的地もシーンキーも前回と同じなので、この通知は不要」と判断し、処理をスキップする
                     * 
                     * ■効果
                     * これにより、playerPartyList 以外にも「所持金（money）」や「HP」などのデータがシーン初期化中や実行中に更新されたとしても、不必要なシーン再起動が発生しなくなる。
                     */
                    prev.state === curr.state &&
                    prev.sceneKey === curr.sceneKey &&
                    JSON.stringify(prev.fieldData) === JSON.stringify(curr.fieldData)
                );
            }
            // それ以外は通常通り、値が同じなら true（通知しない）を返す
            return prev.state === curr.state;
        })
    );

    //ゲームの状態が『FIELD』になった瞬間を一度だけ検知し、実行信号を送る
    public readonly onStartField$: Observable<void> = this.gameState$.pipe(
        filter(gameState => gameState.state === State.TITLE),
        //gameState$ という全体の流れの中から、state が FIELD である時だけを通過させます。それ以外の状態（BATTLEやTITLEなど）の時は、この先には何も流れません。

        map(() => undefined),
        //流れてくるデータは GameState オブジェクト（HPやMoneyなど全部入り）ですが、これ以降の処理にはそれらの詳細データは不要で「開始したという事実」だけが欲しいので、データを空っぽ（undefined）に変換しています。
        //そのため、型が Observable<void> になっています。

        take(1)
        //ここが重要です。 この条件に一致した「最初の1回」だけを流し、その瞬間にこのストリームを完了（Complete）させます。
        //これがないと、ゲーム中に何度も FIELD 状態になるたびに通知が飛んでしまいますが、take(1) があることで「初期化時の一回だけ」といった限定的な使い方が可能になります。
    );

    public readonly bgmState$: Observable<{ bgmState: BgmState; mapKey: string }> = this.gameState$.pipe(
        // 💡 欲しい2つのデータをオブジェクトにまとめて下流に流す
        map(gameState => ({
            bgmState: gameState.bgmState,
            mapKey: gameState.fieldData.mapKey
        })),

        // 💡 「bgmState」と「mapKey」のどちらか片方でも前回から変化した時だけ通知する（重複を完全ガード）
        distinctUntilChanged((prev, curr) => {
            return prev.bgmState === curr.bgmState && prev.mapKey === curr.mapKey;
        })
    );

    public readonly optionData$: Observable<OptionData> = this.gameState$.pipe(
        map(gameState => gameState.optionData),
        distinctUntilChanged()
    );

    public readonly virtualPad$: Observable<boolean> = this.gameState$.pipe(
        map(gameState => gameState.virtualPad),

        //同じ入力値だった場合は通知しない
        distinctUntilChanged()
    );

    // ゲームオーバー判定専用のストリーム
    public readonly onGameOver$: Observable<void> = this.gameState$.pipe(
        filter(gameState => {
            const party = gameState.playerPartyList;

            // すべてのメンバーのHPが0以下であるかを確認
            const isAllDead = party.every(member => {
                const hp = member.getData('HP');
                return hp !== undefined && hp <= 0;
            });
            return isAllDead;
        }),
        map(() => undefined),//戻り値を強制的に voidに変換し、その他の不要データを消している
        take(1)//onGameOver$を購読している対象を全て解除する
    );

    constructor() { }

    // シングルトンパターンでインスタンスを取得
    public static getInstance() {
        if (!this.instance) {
            console.log('new GameStateManager()');
            this.instance = new GameStateManager();
        }
        return this.instance;
    }

    // ゲーム状態を部分更新する
    public updateState(next: Partial<GameState>, sceneKey: string) {
        const currentState = this.gameState$.value;

        // 1. まずは新しい状態（RESTARTなどを含む）を適用して通知
        const nextState = {
            ...currentState,// ① 今のデータをバラバラに展開
            ...next,// ② 新しい変更分をバラバラに展開（上書き）。TypeScript（JavaScript）の スプレッド構文（Spread Syntax） と呼ばれる非常に便利な機能です。
            sceneKey: sceneKey// ここでキーを保存
        };
        this.gameState$.next(nextState);
    }

    // プレイヤーパーティリストを設定
    public setPlayerPartyList(playerPartyMemberList: Phaser.GameObjects.Sprite[]) {
        const currentState = this.gameState$.value;
        this.gameState$.next({
            ...currentState,
            playerPartyList: playerPartyMemberList
        });
    }

    // フィールドのNPCリストを設定
    public setFieldNpcList(npcList: Phaser.GameObjects.Sprite[]) {
        const currentState = this.gameState$.value;
        this.gameState$.next({
            ...currentState,
            fieldNpcList: npcList
        });
    }

    // フィールドの敵リストを設定
    public setFieldEnemyList(enemyList: Phaser.GameObjects.Sprite[]) {
        const currentState = this.gameState$.value;
        this.gameState$.next({
            ...currentState,
            fieldEnemyList: enemyList
        });
    }

    // オプションデータ（音量・テキスト速度）を設定
    public setOptionData(master: number, bgm: number, bgs: number, se: number, textSpeed: number = 50): void {
        const currentState = this.gameState$.value;
        this.gameState$.next({
            ...currentState,
            optionData: {
                masterVolume: master,
                bgmVolume: bgm,
                bgsVolume: bgs,
                seVolume: se,
                textSpeed: textSpeed
            }
        });
    }

    // ゲーム状態を初期状態にリセット
    public reset(): void { this.gameState$.next(INITIAL_STATE); }


    public get currentMoney(): State { return this.gameState$.value.money; }
    public get currentState(): State { return this.gameState$.value.state; }
    public get currentFieldData(): FieldData { return this.gameState$.value.fieldData!; }
    public get currentBattleData() {
        return {
            usePatern: this.gameState$.value.battleData.usePatern,
            fieldHitEnemy: this.gameState$.value.battleData.fieldHitEnemy,
            canNotRunaway: this.gameState$.value.battleData.canNotRunaway,
        }
    }
    public get currentEventObj(): Phaser.Physics.Arcade.Sprite { return this.gameState$.value.eventObj! }
    public get currentPlayerPartyList(): Phaser.GameObjects.Sprite[] { return this.gameState$.value.playerPartyList; }
    public get currentFieldNpcList(): Phaser.GameObjects.Sprite[] { return this.gameState$.value.fieldNpcList; }
    public get currentFieldEnemyList(): Phaser.GameObjects.Sprite[] { return this.gameState$.value.fieldEnemyList; }
    public get currentBattleFieldKey(): string { return this.gameState$.value.battleFieldKey; }
    public get currentOptionData(): OptionData { return this.gameState$.value.optionData; }
    public get isHighDraw(): boolean { return this.gameState$.value.highDraw; }
    public get isVirtualPad(): boolean { return this.gameState$.value.virtualPad; }
    public get isGameClearFlg(): boolean { return this.gameState$.value.gameClearFlg; }
    public get isDebugMode(): boolean { return this.gameState$.value.debugMode; }
}

// 唯一のインスタンスを公開（シングルトン）
export const gameStateManager = GameStateManager.getInstance();