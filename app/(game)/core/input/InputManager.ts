// Phaserの入力をRxJSに変換する基盤

import { Subject, BehaviorSubject, Observable, Subscription } from "rxjs";
import { InputAction, KEY_MAP } from "./InputConfig";

export class InputManager {
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;

    private subs = new Subscription(); // 購読をまとめる箱

    private inputFlgSubject$ = new BehaviorSubject<boolean>(false);

    // 外部(Presenter)はこのObservableを購読する
    private actionSubject = new Subject<InputAction>();
    public action$ = this.actionSubject.asObservable();//外部公開用、asObservable()を設定すると読み取り専用になり、subscribe()は可能だがnext()が不可となる。

    constructor(private scene: Phaser.Scene) { }

    public execute() {
        //設定
        this.scene.input.mouse!.disableContextMenu();//右クリックのコンテキストメニューを非表示にする
        this.cursors = this.scene.input.keyboard!.createCursorKeys();// Phaserのカーソルキー（上下左右+Space/Shift）を作成
        //this.keys = this.input.keyboard!.addKeys("P,H,A,S,E,R") as GameKeys;

        // Phaserのキーイベントを監視し、Actionに変換してSubjectへ
        Object.entries(KEY_MAP).forEach(([action, keyCode]) => {
            const keyObj = this.scene.input.keyboard!.addKey(keyCode);
            keyObj.on('down', () => this.actionSubject.next(action as InputAction));
        });

        // ゲーム状態により入力切替
        this.subs.add(
            this.inputFlgSubject$.subscribe(inputFlg => {
                if (this.scene?.input) {
                    // console.log('input切替')
                    this.scene.input.enabled = inputFlg;
                }
            })
        );
    }

    // 入力状態の更新
    public setState(inputFlg: boolean) { this.inputFlgSubject$.next(inputFlg); }

    public destroy() { this.subs.unsubscribe(); }

    // 現在の入力状態を取得
    public get currentInputFlg(): boolean { return this.inputFlgSubject$.value; }
    public get phaserInput(): Phaser.Input.InputPlugin { return this.scene.input; }
    public get phaserCursors(): Phaser.Types.Input.Keyboard.CursorKeys { return this.cursors }
}

// 4. なぜ「InputPresenter」を独立させないのか？
// 「InputPresenter」という単独のPresenterを作るより、各SceneのPresenterが InputManager(Provider) を利用する形をおすすめします。
// 理由は、**「同じ『上キー』でも、マップ中なら移動、メニュー中ならカーソル移動」**という具合に、文脈（Context）によって入力の意味が変わるからです。