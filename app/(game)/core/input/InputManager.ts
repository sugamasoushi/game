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

    private _virtualPadDirection: string | null = null;
    public get virtualPadDirection(): string | null {
        if (this._virtualPadDirection) return this._virtualPadDirection;

        // ゲームパッドのアナログスティックまたは十字キーから方向を取得
        const pad = this.scene?.input?.gamepad?.pad1;
        if (!pad) return null;

        const threshold = 0.5;
        let dx = 0;
        let dy = 0;
        
        if (pad.leftStick.x < -threshold || pad.left) dx = -1;
        else if (pad.leftStick.x > threshold || pad.right) dx = 1;
        
        if (pad.leftStick.y < -threshold || pad.up) dy = -1;
        else if (pad.leftStick.y > threshold || pad.down) dy = 1;

        if (dx === -1 && dy === -1) return 'up-left';
        if (dx === 1 && dy === -1) return 'up-right';
        if (dx === -1 && dy === 1) return 'down-left';
        if (dx === 1 && dy === 1) return 'down-right';
        if (dy === -1) return 'up';
        if (dy === 1) return 'down';
        if (dx === -1) return 'left';
        if (dx === 1) return 'right';

        return null;
    }
    private isExecuted: boolean = false;

    private previousPadButtons: { [index: number]: boolean } = {};
    private inputAcceptable: boolean = true;

    // 入力状態をリセットし、シーン遷移時などの誤爆（入力状態の復活）を防ぐ
    public clearGamepadState() {
        this.previousPadButtons = {};
        this.inputAcceptable = false;
        // 300ms間はゲームパッドの入力を無視する
        setTimeout(() => {
            this.inputAcceptable = true;
        }, 300);
    }

    public execute() {
        if (this.isExecuted) return;
        this.isExecuted = true;
        console.log('InputManager.execute()');
        //設定
        this.scene.input.mouse!.disableContextMenu();//右クリックのコンテキストメニューを非表示にする
        this.cursors = this.scene.input.keyboard!.createCursorKeys();// Phaserのカーソルキー（上下左右+Space/Shift）を作成

        // Phaserのキーイベントを監視し、Actionに変換してSubjectへ
        Object.entries(KEY_MAP).forEach(([action, keyCode]) => {
            const keyObj = this.scene.input.keyboard!.addKey(keyCode);
            keyObj.on('down', () => this.actionSubject.next(action as InputAction));
        });

        this.subs.add(
            this.inputFlgSubject$.subscribe(inputFlg => {
                if (this.scene?.input) {
                    this.scene.input.enabled = inputFlg;
                }
            })
        );

        // 仮想パッドのイベント
        this.scene.game.events.on('VIRTUALPAD_ARROW_KEY_DOWN', (direction: string) => {
            this._virtualPadDirection = direction;
            if (direction === 'right') this.rightSubject.next();
            if (direction === 'left') this.leftSubject.next();
            if (direction === 'up') this.upSubject.next();
            if (direction === 'down') this.downSubject.next();
        });
        this.scene.game.events.on('VIRTUALPAD_ARROW_KEY_UP', () => {
            this._virtualPadDirection = null;
        });
        this.scene.game.events.on('VIRTUALPAD_FACE_BUTTON_DOWN', (direction: string) => {
            this._virtualPadDirection = direction;
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
            this._virtualPadDirection = null;
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

        // ゲームパッド入力（ポーリング方式：シーン破棄によるイベント無効化を防ぐため）
        this.scene.game.events.on('step', () => {
            if (!this.inputAcceptable) return;

            const pad = this.scene?.input?.gamepad?.pad1;
            if (!pad) return;

            const buttons = pad.buttons;
            for (let i = 0; i < buttons.length; i++) {
                const isDown = buttons[i].pressed;
                const wasDown = this.previousPadButtons[i] || false;
                
                if (isDown && !wasDown) {
                    // ボタンマッピング: 0=南(A/✕), 1=東(B/〇), 2=西(X/□), 3=北(Y/△)
                    if (i === 1) this.decideSubject.next();
                    if (i === 0) this.cancelSubject.next();
                    if (i === 2) this.fieldAttackSubject.next();
                    if (i === 3) this.menuSubject.next();

                    // 十字キー（メニュー操作などの単発入力用）
                    if (i === 12) this.upSubject.next();
                    if (i === 13) this.downSubject.next();
                    if (i === 14) this.leftSubject.next();
                    if (i === 15) this.rightSubject.next();
                }
                this.previousPadButtons[i] = isDown;
            }
        });
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
    public setVirtualPadDirectionNull() { this._virtualPadDirection = null; }

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