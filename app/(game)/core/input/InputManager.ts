// Phaserの入力をRxJSに変換する基盤

/**
 * ゲーム全体のマウス入力有無くらいしか使用していない
 */

import { Subject, BehaviorSubject, Observable, Subscription } from "rxjs";
import { InputAction, KEY_MAP } from "./InputConfig";

export class InputManager {
    private static instance: InputManager;
    private scene: Phaser.Scene;

    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;

    private subs = new Subscription(); // 購読をまとめる箱

    private inputFlgSubject$ = new BehaviorSubject<boolean>(false);

    // 外部(Presenter)はこのObservableを購読する
    private actionSubject = new Subject<InputAction>();
    public action$ = this.actionSubject.asObservable();//外部公開用、asObservable()を設定すると読み取り専用になり、subscribe()は可能だがnext()が不可となる。

    public virtualPadDirection: string | null = null;
    private isExecuted: boolean = false;

    constructor() { }

    public execute() {
        if (this.isExecuted) return;
        this.isExecuted = true;
        console.log('InputManager.execute()');
        //設定
        this.scene.input.mouse!.disableContextMenu();//右クリックのコンテキストメニューを非表示にする
        this.cursors = this.scene.input.keyboard!.createCursorKeys();// Phaserのカーソルキー（上下左右+Space/Shift）を作成
        //this.keys = this.input.keyboard!.addKeys("P,H,A,S,E,R") as GameKeys;

        // Phaserのキーイベントを監視し、Actionに変換してSubjectへ
        Object.entries(KEY_MAP).forEach(([action, keyCode]) => {
            const keyObj = this.scene.input.keyboard!.addKey(keyCode);
            keyObj.on('down', () => this.actionSubject.next(action as InputAction));
        });

        /**
         * ゲーム状態により入力切替
         * シングルトンであるため、各シーンを設定して使用した後に他シーンで使用する場合はシーンを再設定する必要がある
         * 
         */
        this.subs.add(
            this.inputFlgSubject$.subscribe(inputFlg => {
                if (this.scene?.input) {
                    // console.log('input切替')
                    this.scene.input.enabled = inputFlg;
                }
            })
        );

        // 仮想パッドのイベント
        this.scene.game.events.on('VIRTUALPAD_ARROW_KEY_DOWN', (direction: string) => {
            this.virtualPadDirection = direction;
            if (direction === 'right') this.rightSubject.next();
            if (direction === 'left') this.leftSubject.next();
            if (direction === 'up') this.upSubject.next();
            if (direction === 'down') this.downSubject.next();
        });
        this.scene.game.events.on('VIRTUALPAD_ARROW_KEY_UP', () => {
            this.virtualPadDirection = null;
        });
        this.scene.game.events.on('VIRTUALPAD_FACE_BUTTON_DOWN', (direction: string) => {
            this.virtualPadDirection = direction;
            if (direction === 'faceCircle') {
                this.decideSubject.next();
            }
            if (direction === 'faceCross') {
                this.cancelSubject.next();
            }
            if (direction === 'faceSquare') {
                this.fieldAttackSubject.next();
            }
            if (direction === 'faceTriangle') {
                this.menuSubject.next();
            }
        });
        this.scene.game.events.on('VIRTUALPAD_FACE_BUTTON_UP', () => {
            this.virtualPadDirection = null;
        });

        // キーボード入力からの変換
        this.subs.add(this.action$.subscribe(action => {
            if (action === 'CURSOR_RIGHT') this.rightSubject.next();
            if (action === 'CURSOR_LEFT') this.leftSubject.next();
            if (action === 'CURSOR_UP') this.upSubject.next();
            if (action === 'CURSOR_DOWN') this.downSubject.next();
            if (action === 'RIGHT') this.rightSubject.next();
            if (action === 'LEFT') this.leftSubject.next();
            if (action === 'UP') this.upSubject.next();
            if (action === 'DOWN') this.downSubject.next();
            if (action === 'SPACE') this.decideSubject.next();
            if (action === 'ESC') this.cancelSubject.next();
        }));

        // ゲームパッド入力（接続されている場合）
        if (this.scene.input.gamepad) {
            this.scene.input.gamepad.on('down', (pad: Phaser.Input.Gamepad.Gamepad, button: Phaser.Input.Gamepad.Button) => {
                // button.index: 0=A/✕, 1=B/〇 と仮定し、両方を決定ボタンとして扱う
                if (button.index === 0 || button.index === 1) {
                    this.decideSubject.next();
                }
            });
        }
    }

    public static getInstance(scene: Phaser.Scene) {
        if (!this.instance) {
            console.log('new InputManager()');
            this.instance = new InputManager();
        }
        this.instance.scene = scene;
        return this.instance;
    }

    // 入力状態の更新
    public setState(inputFlg: boolean) { this.inputFlgSubject$.next(inputFlg); }
    public setVirtualPadDirectionNull() { this.virtualPadDirection = null; }

    public destroy() { this.subs.unsubscribe(); }

    private decideSubject = new Subject<void>();
    public decideButton$: Observable<void> = this.decideSubject.asObservable();

    private cancelSubject = new Subject<void>();
    public cancelButton$: Observable<void> = this.cancelSubject.asObservable();

    private fieldAttackSubject = new Subject<void>();
    public fieldAttackButton$: Observable<void> = this.fieldAttackSubject.asObservable();

    private menuSubject = new Subject<void>();
    public menuButton$: Observable<void> = this.menuSubject.asObservable();

    private rightSubject = new Subject<void>();
    public rightButton$: Observable<void> = this.rightSubject.asObservable();

    private leftSubject = new Subject<void>();
    public leftButton$: Observable<void> = this.leftSubject.asObservable();

    private upSubject = new Subject<void>();
    public upButton$: Observable<void> = this.upSubject.asObservable();

    private downSubject = new Subject<void>();
    public downButton$: Observable<void> = this.downSubject.asObservable();

    // 現在の入力状態を取得
    public get currentInputFlg(): boolean { return this.inputFlgSubject$.value; }
    public get phaserInput(): Phaser.Input.InputPlugin { return this.scene.input; }
    public get phaserCursors(): Phaser.Types.Input.Keyboard.CursorKeys { return this.cursors }
}

// 4. なぜ「InputPresenter」を独立させないのか？
// 「InputPresenter」という単独のPresenterを作るより、各SceneのPresenterが InputManager(Provider) を利用する形をおすすめします。
// 理由は、**「同じ『上キー』でも、マップ中なら移動、メニュー中ならカーソル移動」**という具合に、文脈（Context）によって入力の意味が変わるからです。