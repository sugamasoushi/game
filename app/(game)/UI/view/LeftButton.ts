import { MessageWindow } from "../../util/MessageWindow";
import { MessageObject } from "../../util/MessageObject";

export class LeftButton {

    private uiScene: Phaser.Scene;
    private gameScene: Phaser.Scene;
    private buttonTexts: Phaser.GameObjects.Text[] = [];  // 表示用テキスト
    private buttonZones: Phaser.GameObjects.Zone[] = [];   // クリック判定用ゾーン
    private menuWindow: MessageWindow;
    private hitZone: Phaser.GameObjects.Zone;

    constructor(uiScene: Phaser.Scene) {
        this.uiScene = uiScene;
        this.gameScene = uiScene.scene.get('Field') as Phaser.Scene;
    }

    public async execute() {
        this.createMenuButton();
    }

    private createMenuButton() {
        const gameConfigHeight: number = Number(this.uiScene.game.canvas.height);

        const buttonSize = 64; // ボタン1つ分のサイズ
        const centerX = buttonSize * 1.5 + 2; // 十字パッドの中心X
        const centerY = gameConfigHeight - buttonSize * 1.5 - 2; // 十字パッドの中心Y

        const messageObjectInstance = new MessageObject();
        messageObjectInstance.init(this.uiScene);

        // 背景ウィンドウを作成
        this.menuWindow = new MessageWindow(this.uiScene);
        this.menuWindow.init();
        this.menuWindow.createCrossWindow(centerX, centerY, buttonSize);
        this.menuWindow.setDepth(400);

        // 全体をまとめる円形ヒットゾーン（伝播防止用）
        const radius = buttonSize * 2.4;
        this.hitZone = this.uiScene.add.zone(centerX, centerY, radius * 2, radius * 2);
        this.hitZone.setDepth(405);
        this.hitZone.setInteractive(new Phaser.Geom.Circle(radius, radius, radius), Phaser.Geom.Circle.Contains);
        this.hitZone.on(Phaser.Input.Events.POINTER_DOWN, (_p: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
            event.stopPropagation();
        });
        this.hitZone.on(Phaser.Input.Events.POINTER_UP, (_p: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
            event.stopPropagation();
        });
        this.hitZone.disableInteractive();

        // 斜め方向のオフセット距離
        const d = Math.round(buttonSize * 1);

        /**
         * 8方向ボタン定義
         * x/y は各ゾーン・テキストの「中央座標」（centerX/centerY を基準に指定）
         */
        const padInfo = [
            { char: '⇑', x: centerX, y: centerY - buttonSize, dir: 'up' },
            { char: '⇓', x: centerX, y: centerY + buttonSize, dir: 'down' },
            { char: '⇐', x: centerX - buttonSize, y: centerY, dir: 'left' },
            { char: '⇒', x: centerX + buttonSize, y: centerY, dir: 'right' },
            { char: '⇖', x: centerX - d, y: centerY - d, dir: 'up-left' },
            { char: '⇗', x: centerX + d, y: centerY - d, dir: 'up-right' },
            { char: '⇙', x: centerX - d, y: centerY + d, dir: 'down-left' },
            { char: '⇘', x: centerX + d, y: centerY + d, dir: 'down-right' },
        ];

        for (const info of padInfo) {
            // 表示用テキスト（クリック判定には使わない）
            const text = messageObjectInstance.createTextObject(this.uiScene, 0, 0, [info.char], 28);
            text.setOrigin(0.5);
            text.setPosition(info.x, info.y);
            text.setDepth(410);
            text.setAlpha(0);
            this.buttonTexts.push(text);

            // クリック判定用ゾーン（中央座標 = info.x, info.y）
            const zone = this.uiScene.add.zone(info.x, info.y, buttonSize, buttonSize);
            zone.setDepth(415);

            zone.on(Phaser.Input.Events.POINTER_DOWN, () => {
                this.uiScene.game.events.emit('VIRTUALPAD_ARROW_KEY_DOWN', info.dir);
            });
            zone.on(Phaser.Input.Events.POINTER_UP, (_p: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
                this.uiScene.game.events.emit('VIRTUALPAD_ARROW_KEY_UP');
                event.stopPropagation();
            });
            zone.on(Phaser.Input.Events.POINTER_OUT, () => {
                this.uiScene.game.events.emit('VIRTUALPAD_ARROW_KEY_UP');
            });

            zone.disableInteractive();
            this.buttonZones.push(zone);
        }

        this.menuWindow.setAlpha(0);
    }

    public fadeIn() {
        const duration = 200;

        const radius = 48 * 1.6;
        this.hitZone.setInteractive(new Phaser.Geom.Circle(radius, radius, radius), Phaser.Geom.Circle.Contains);

        for (const text of this.buttonTexts) {
            this.uiScene.tweens.add({
                targets: text,
                alpha: 1,
                duration: duration,
                ease: 'Power1',
            });
        }

        for (const zone of this.buttonZones) {
            zone.setInteractive({ useHandCursor: true });
        }

        this.uiScene.tweens.add({
            targets: this.menuWindow,
            alpha: this.menuWindow.currentAlphaValue,
            duration: duration,
            ease: 'Power1'
        });
    }

    public fadeOut() {
        const duration = 200;

        this.hitZone.disableInteractive();

        for (const text of this.buttonTexts) {
            this.uiScene.tweens.add({
                targets: text,
                alpha: 0,
                duration: duration,
                ease: 'Power1',
            });
        }

        for (const zone of this.buttonZones) {
            zone.disableInteractive();
        }

        this.uiScene.tweens.add({
            targets: this.menuWindow,
            alpha: 0,
            duration: duration,
            ease: 'Power1'
        });
    }

    public setEnable() {
        this.hitZone.setInteractive();
        for (const text of this.buttonTexts) {
            text.setAlpha(1);
        }
        for (const zone of this.buttonZones) {
            zone.setInteractive({ useHandCursor: true });
        }
        this.menuWindow.setAlpha(this.menuWindow.currentAlphaValue);
    }

    public setDisable() {
        this.hitZone.disableInteractive();
        for (const text of this.buttonTexts) {
            text.setAlpha(0.3);
        }
        for (const zone of this.buttonZones) {
            zone.disableInteractive();
        }
        this.menuWindow.setAlpha(0.3);
    }
}
