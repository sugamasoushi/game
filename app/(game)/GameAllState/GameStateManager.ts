import { GameState, State, FieldData } from '../lib/types';
import { BehaviorSubject, Observable, distinctUntilChanged } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

const INITIAL_STATE: GameState = {
    state: State.NOSTATE,
    sceneKey: 'string', // 更新元のキーを追加
    money: 100,
    hp: 100,
    battleFlag: false,
    isGameOver: false,
    fieldData: { gameMode: 'string', mapKey: 'string', x: 0, y: 0, initStandKey: 'string' },
    battleData: { usePatern: 'string', fieldHitEnemy: undefined, canNotRunaway: false },
    eventObj: undefined
}

export class GameStateManager {
    private static instance: GameStateManager;

    // 内部保持用。初期値をセット。
    private gameState$ = new BehaviorSubject<GameState>(INITIAL_STATE);


    // 外部公開用のObservable。scoreだけを抜き出して公開。
    public readonly money$: Observable<number> = this.gameState$.pipe(map(gameState => gameState.money));

    // 外部公開用のObservable。
    public readonly state$: Observable<{ state: State, sceneKey: string }> = this.gameState$.pipe(
        // // distinctUntilChanged() を使うことで、同じ状態への遷移は通知しないようにする
        // //前後の state を比較して、変化があった時だけ通す
        //distinctUntilChanged((prev, curr) => prev.state === curr.state),
        distinctUntilChanged((prev, curr) => {
            // もし新しい状態が RESTART なら、強制的に「変更あり(false)」と判定して通知を通す
            if (curr.state === State.FIELD_RESTART) { return false; }
            // それ以外は通常通り、値が同じなら true（通知しない）を返す
            return prev.state === curr.state;
        }),

        map(gs => ({
            state: gs.state,
            fieldData: gs.fieldData,
            sceneKey: gs.sceneKey ?? 'unknown'
        }))// 購読側が使いやすいように、GameStateオブジェクトから state だけを抽出
    );

    //ゲームの状態が『FIELD』になった瞬間を一度だけ検知し、実行信号を送る
    public readonly onStartField$: Observable<void> = this.gameState$.pipe(
        filter(gameState => gameState.state === State.START),
        //gameState$ という全体の流れの中から、state が FIELD である時だけを通過させます。それ以外の状態（BATTLEやTITLEなど）の時は、この先には何も流れません。

        map(() => undefined),
        //流れてくるデータは GameState オブジェクト（HPやMoneyなど全部入り）ですが、これ以降の処理にはそれらの詳細データは不要で「開始したという事実」だけが欲しいので、データを空っぽ（undefined）に変換しています。
        // //そのため、型が Observable<void> になっています。

        take(1)
        //ここが重要です。 この条件に一致した「最初の1回」だけを流し、その瞬間にこのストリームを完了（Complete）させます。
        //これがないと、ゲーム中に何度も FIELD 状態になるたびに通知が飛んでしまいますが、take(1) があることで「初期化時の一回だけ」といった限定的な使い方が可能になります。
    );

    constructor() { }

    public static getInstance() {
        if (!this.instance) { this.instance = new GameStateManager(); } return this.instance;
    }

    // 状態更新用メソッド
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

    // 3. ゲームオーバー判定専用のストリーム
    // take(1) を使うことで、一度発火したら完了するように設計
    public readonly onGameOver$: Observable<void> = this.gameState$.pipe(
        filter(gameState => gameState.hp <= 0 && !gameState.isGameOver),
        map(() => undefined),
        take(1)
    );

    // 4. 状態更新メソッド
    //「今の状態をコピーして、HPだけを安全に計算し直し、新しい状態として再配布する」という一連の処理を安全に行っている
    public damage(amount: number): void {
        const currentState = this.gameState$.value;
        this.gameState$.next({
            ...currentState,//まずは全ての値を取得、※元の保持データ（参照先）の変更はこのように書く
            hp: Math.max(0, currentState.hp - amount)//値更新、０未満にはならないらしい
        });
    }

    // 戦闘中かどうかのチェック
    public startBattle(): void {
        this.gameState$.next({
            ...this.gameState$.value,
            battleFlag: true
        });
    }

    public endBattle(): void {
        this.gameState$.next({
            ...this.gameState$.value,
            battleFlag: false
        });
    }

    public addMoney(num: number) {
        const currentState = this.gameState$.value;
        this.gameState$.next({
            ...currentState,//まずは全ての値を取得、※元の保持データ（参照先）の変更はこのように書く
            money: currentState.money + num
        });
    }

    //状態のリセットは必ず意識する事
    public reset(): void { this.gameState$.next(INITIAL_STATE); }



    // 現在の値取得
    public get currentState(): State { return this.gameState$.value.state; }
    public get currentHP(): number { return this.gameState$.value.state; }
    public get currentBattleFlag(): boolean { return this.gameState$.value.battleFlag; }
    public get currentFieldData(): FieldData { return this.gameState$.value.fieldData!; }
    public get currentBattleData() {
        return {
            usePatern: this.gameState$.value.battleData.usePatern,
            fieldHitEnemy: this.gameState$.value.battleData.fieldHitEnemy,
            canNotRunaway: this.gameState$.value.battleData.canNotRunaway
        }
    }
    public get currentEventObj(): Phaser.Physics.Arcade.Sprite { return this.gameState$.value.eventObj! }
}

// 唯一のインスタンスを公開（シングルトン）
export const gameStateManager = new GameStateManager();


/**NPCとの衝突で更新する */