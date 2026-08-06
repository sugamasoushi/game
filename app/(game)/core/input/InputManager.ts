import { Subject, BehaviorSubject, Observable, Subscription } from "rxjs";
import { InputAction, KEY_MAP } from "./InputConfig";

export class InputManager {
    private static instance: InputManager;
    private scene: Phaser.Scene;

    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private gameKeys: { [key: string]: Phaser.Input.Keyboard.Key } = {};

    private subs = new Subscription(); // 購読をまとめる箱
    private keyboardSubs = new Subscription(); // キーボードイベント用

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

    public execute() {

        if (this.isExecuted) return;
        this.isExecuted = true;
        console.log('InputManager.execute()');

        // 入力の有効/無効を切り替える（このクラスで管理）
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
        }, this);
        this.scene.game.events.on('VIRTUALPAD_ARROW_KEY_UP', () => {
            this._virtualPadDirection = null;
        }, this);
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
        }, this);
        this.scene.game.events.on('VIRTUALPAD_FACE_BUTTON_UP', () => {
            this._virtualPadDirection = null;
        }, this);

        // ゲームパッド入力の監視
        // ポーリング方式：特定のシーンの寿命に縛られず、ゲーム全体が動いている間はずっと一定間隔（1フレーム）で入力を監視し続ける
        this.scene.game.events.on('step', this.stepCallback, this);
    }

    // ゲームパッド設定
    private stepCallback() {
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
    }

    // キーボード設定
    public setKeyboardInput() {
        // 以前の登録をクリア
        this.keyboardSubs.unsubscribe();
        this.keyboardSubs = new Subscription();
        Object.values(this.gameKeys).forEach(keyObj => {
            keyObj.off('down');
        });
        this.gameKeys = {};

        //設定
        this.scene.input.mouse!.disableContextMenu();//右クリックのコンテキストメニューを非表示にする
        this.cursors = this.scene.input.keyboard!.createCursorKeys();// Phaserのカーソルキー（上下左右+Space/Shift）を作成

        // 1.Phaserのキーイベントを監視し、Actionに変換してSubjectへ
        Object.entries(KEY_MAP).forEach(([action, keyCode]) => {
            const keyObj = this.scene.input.keyboard!.addKey(keyCode);
            keyObj.on('down', () => {
                this.actionSubject.next(action as InputAction)
            });
            this.gameKeys[action] = keyObj;
        });

        // 2.Subjectから渡されたキーボード入力を変換
        this.keyboardSubs.add(this.action$.subscribe(action => {
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
            if (action === 'M') this.menuSubject.next();
            if (action === 'P') this.fieldAttackSubject.next();//FieldPreseterで実装してる
            if (action === 'D') this.rightSubject.next();
            if (action === 'A') this.leftSubject.next();
            if (action === 'W') this.upSubject.next();
            if (action === 'S') this.downSubject.next();
        }));

        // シーン終了（再スタート含む）時にキー参照をクリアする
        this.scene.events.off('shutdown', this.clearKeys, this);
        this.scene.events.once('shutdown', this.clearKeys, this);
    }

    private clearKeys() {
        this.gameKeys = {};
    }

    public clearCurrentPadInputState() {
        this.previousPadButtons = {};
        this._virtualPadDirection = null;
        this.inputAcceptable = false;

        this.scene?.time?.delayedCall(0, () => {
            this.inputAcceptable = true;
        });
    }

    public static getInstance(scene: Phaser.Scene) {
        if (!this.instance) {
            console.log('new InputManager()');
            this.instance = new InputManager();
        }
        // シーンが変わった場合、またはシーンが再起動されキー設定がクリアされている場合のみキーボード入力を再設定
        if (this.instance.scene !== scene || Object.keys(this.instance.gameKeys).length === 0) {
            this.instance.scene = scene;
            this.instance.clearCurrentPadInputState();
            this.instance.setKeyboardInput();
        }
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
    public get phaserGameKeys(): { [key: string]: Phaser.Input.Keyboard.Key } { return this.gameKeys }
    public get activeScene(): string | null { return this.scene.scene.key; }
}

// 4. なぜ「InputPresenter」を独立させないのか？
// 「InputPresenter」という単独のPresenterを作るより、各SceneのPresenterが InputManager(Provider) を利用する形をおすすめします。
// 理由は、**「同じ『上キー』でも、マップ中なら移動、メニュー中ならカーソル移動」**という具合に、文脈（Context）によって入力の意味が変わるからです。