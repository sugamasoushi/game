import { StateDefinition, ViewsContainer } from "../../lib/types";

// /** Viewが必ず持っておくべき機能 */
// interface IWindowView extends Phaser.GameObjects.Container {
//     show(): void;
//     hide(): void;
// }

// /** 状態（State）の振る舞い */
// interface StateDefinition {
//     enter: (views: ViewsContainer, payload?: any) => void;
//     exit: (views: ViewsContainer) => void;
// }

// /** Presenterが管理するViewの集まり */
// interface ViewsContainer {
//     main: IWindowView;
//     item: IWindowView;
// }

export class StateMachine {
    private states: Map<string, StateDefinition> = new Map();
    private history: string[] = [];
    private currentStateKey: string | null = null;

    constructor(private views: ViewsContainer) { }

    addState(key: string, definition: StateDefinition) {
        this.states.set(key, definition);
    }

    /** 次の状態へ進む */
    push(nextStateKey: string, payload?: Phaser.GameObjects.Sprite) {
        // 現在の状態があれば履歴に保存して終了
        if (this.currentStateKey) {
            this.history.push(this.currentStateKey);
            this.states.get(this.currentStateKey)?.exit(this.views);
            // console.log(payload)
        }

        this.currentStateKey = nextStateKey;
        this.states.get(nextStateKey)?.enter(this.views, payload);
    }

    /** 前の状態に戻る */
    pop() {
        if (this.history.length === 0) return;
        console.log(this.history)

        // 現在の終了
        if (this.currentStateKey) {
            this.states.get(this.currentStateKey)?.exit(this.views);
        }

        // 履歴から復元
        const previousKey = this.history.pop()!;
        this.currentStateKey = previousKey;
        this.states.get(previousKey)?.enter(this.views);
    }
}