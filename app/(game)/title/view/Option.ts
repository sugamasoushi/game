import { MessageWindow } from '../../util/MessageWindow';
import { MessageObject } from '../../util/MessageObject';
import { Title } from '../../scenes/Title';
import { OptionData } from '../../lib/FieldTypes';

/** 音量項目の識別子 */
export const VolumeItem = {
    MASTER: 0,
    BGM: 1,
    BGS: 2,
    SE: 3,
    TEXT_SPEED: 4,
    RENDER_MODE: 5,
    VIRTUAL_PAD_SELECT: 6
} as const;
export type VolumeItemType = typeof VolumeItem[keyof typeof VolumeItem];

/** 各音量項目のバー描画に必要なオブジェクト群 */
interface VolumeBarSet {
    left: Phaser.GameObjects.Text;
    bar: Phaser.GameObjects.Text;
    right: Phaser.GameObjects.Text;
}

/** 描画・仮想パッド選択に必要なオブジェクト群 */
interface BinarySelector {
    left: Phaser.GameObjects.Text;
    value: Phaser.GameObjects.Text;
    right: Phaser.GameObjects.Text;
}

export class Option {
    private optionGroup: Phaser.GameObjects.Group | null = null;

    /** 各音量項目のバーオブジェクト（master/bgm/bgs/se/textSpeed 順） */
    private volumeBars: VolumeBarSet[] = [];

    /** 描画モード選択UI */
    private renderModeSelector: BinarySelector | null = null;

    /** 仮想パッド選択UI */
    private virtualPadSelector: BinarySelector | null = null;

    /** 現在の描画モード（true: PC / false: スマートフォン） */
    private pendingHighDraw: boolean = true;

    /** 現在の仮想パッド設定（true: ON / false: OFF） */
    private pendingVirtualPad: boolean = true;

    /** 現在の音量データ（表示・操作用の一時データ） */
    private pendingVolumes: OptionData = {
        masterVolume: 100,
        bgmVolume: 100,
        bgsVolume: 100,
        seVolume: 100,
        textSpeed: 50,
    };

    /** 現在フォーカスされている音量項目 */
    private focusedItem: VolumeItemType = VolumeItem.MASTER;

    /** カーソルテキスト（▶） */
    private cursorTexts: Phaser.GameObjects.Text[] = [];

    /** 戻るボタン */
    private backButton: Phaser.GameObjects.Text | null = null;
    private backButtonWindow: MessageWindow | null = null;

    /** コールバック（Presenterで設定） */
    public onBack: () => void = () => { };
    public onVolumeClick: (item: VolumeItemType, volume: number) => void = () => { };
    public onRenderModeClick: (highDraw: boolean) => void = () => { };
    public onVirtualPadClick: (enabled: boolean) => void = () => { };

    constructor(private titleScene: Title) { }

    // public update(time: number, delta: number): void { }

    /** オプションメニューを表示 */
    public showOptionMenu(volumes: OptionData, highDraw: boolean, virtualPad: boolean) {
        this.pendingVolumes = { ...volumes };
        this.pendingHighDraw = highDraw;
        this.pendingVirtualPad = virtualPad;
        this.focusedItem = VolumeItem.MASTER;
        this.volumeBars = [];
        this.cursorTexts = [];
        this.renderModeSelector = null;
        this.virtualPadSelector = null;

        const height = Number(this.titleScene.game.config.height);
        const textX = 270;
        const rowGap = 100;
        const textY = 300 - rowGap; // 描画モード追加行分、全体を上にずらす
        const depth = height + 10000;

        const messageObject = new MessageObject();
        messageObject.init(this.titleScene, 'Title');

        // ラベルテキスト
        const labels = [
            messageObject.createTextObject(this.titleScene, textX, textY + 125, ['マスタ音量']),
            messageObject.createTextObject(this.titleScene, textX, textY + 175, ['BGM音量']),
            messageObject.createTextObject(this.titleScene, textX, textY + 225, ['環境音量']),
            messageObject.createTextObject(this.titleScene, textX, textY + 275, ['効果音量']),
            messageObject.createTextObject(this.titleScene, textX, textY + 325, ['テキストスピード']),
            messageObject.createTextObject(this.titleScene, textX, textY + 375, ['描画モード']),
            messageObject.createTextObject(this.titleScene, textX, textY + 425, ['仮想パッド']),
        ];
        labels.forEach(t => t.setDepth(depth));

        const messageWindow = new MessageWindow(this.titleScene);
        messageWindow.init();
        messageWindow.createEventMessageWindow(labels[0]);

        const itemVolumes: number[] = [
            volumes.masterVolume,
            volumes.bgmVolume,
            volumes.bgsVolume,
            volumes.seVolume,
            volumes.textSpeed,
        ];

        const allObjects: Phaser.GameObjects.GameObject[] = [
            ...labels,
            messageWindow as unknown as Phaser.GameObjects.GameObject,
        ];

        const rows = [
            textY + 125,
            textY + 175,
            textY + 225,
            textY + 275,
            textY + 325,
            textY + 375,
            textY + 425
        ];

        for (let i = 0; i < itemVolumes.length; i++) {
            const rowY = rows[i];

            // カーソル
            const cursor = messageObject.createTextObject(this.titleScene, textX - 30, rowY, ['']);
            cursor.setDepth(depth);

            // バー左端ラベル（0）
            const left = messageObject.createTextObject(this.titleScene, textX + 300, rowY, ['0']);
            left.setDepth(depth);

            // バー本体
            const bar = messageObject.createTextObject(this.titleScene, textX + 330, rowY, ['']);
            bar.setDepth(depth);

            // バー右端ラベル（100）
            const right = messageObject.createTextObject(this.titleScene, textX + 700, rowY, ['100']);
            right.setDepth(depth);

            // クリック操作
            bar.setInteractive({ useHandCursor: true });
            const itemIndex = i as VolumeItemType;

            bar.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                const localX = pointer.x - (bar.x - bar.width * bar.originX);
                const percentage = Phaser.Math.Clamp(localX / bar.width, 0, 1);
                const step = Math.round(percentage * 10);
                const clampedValue = step * 10;
                this.setPendingVolume(itemIndex, clampedValue);
                this.onVolumeClick(itemIndex, clampedValue);
            });

            this.volumeBars.push({ left, bar, right });
            this.cursorTexts.push(cursor);
            allObjects.push(cursor, left, bar, right);

            // 初期表示
            this.updateBarDisplay(i as VolumeItemType, itemVolumes[i]);
        }

        // 描画モード行
        const renderModeY = rows[VolumeItem.RENDER_MODE];
        const renderModeCursor = messageObject.createTextObject(this.titleScene, textX - 30, renderModeY, ['']);
        renderModeCursor.setDepth(depth);

        const renderModeLeft = messageObject.createTextObject(this.titleScene, textX + 300, renderModeY, ['◀']);
        renderModeLeft.setDepth(depth);

        const renderModeValue = messageObject.createTextObject(this.titleScene, textX + 400, renderModeY, ['']);
        renderModeValue.setDepth(depth);

        const renderModeRight = messageObject.createTextObject(this.titleScene, textX + 700, renderModeY, ['▶']);
        renderModeRight.setDepth(depth);

        renderModeLeft.setInteractive({ useHandCursor: true });
        renderModeRight.setInteractive({ useHandCursor: true });

        renderModeLeft.on('pointerdown', () => {
            this.setPendingHighDraw(false);
            this.onRenderModeClick(false);
        });
        renderModeRight.on('pointerdown', () => {
            this.setPendingHighDraw(true);
            this.onRenderModeClick(true);
        });

        this.renderModeSelector = { left: renderModeLeft, value: renderModeValue, right: renderModeRight };
        this.cursorTexts.push(renderModeCursor);
        allObjects.push(renderModeCursor, renderModeLeft, renderModeValue, renderModeRight);
        this.updateRenderModeDisplay();

        // 仮想パッド行
        const virtualPadY = rows[VolumeItem.VIRTUAL_PAD_SELECT];
        const virtualPadCursor = messageObject.createTextObject(this.titleScene, textX - 30, virtualPadY, ['']);
        virtualPadCursor.setDepth(depth);

        const virtualPadLeft = messageObject.createTextObject(this.titleScene, textX + 300, virtualPadY, ['◀']);
        virtualPadLeft.setDepth(depth);

        const virtualPadValue = messageObject.createTextObject(this.titleScene, textX + 400, virtualPadY, ['']);
        virtualPadValue.setDepth(depth);

        const virtualPadRight = messageObject.createTextObject(this.titleScene, textX + 700, virtualPadY, ['▶']);
        virtualPadRight.setDepth(depth);

        virtualPadLeft.setInteractive({ useHandCursor: true });
        virtualPadRight.setInteractive({ useHandCursor: true });

        virtualPadLeft.on('pointerdown', () => {
            this.setPendingVirtualPad(false);
            this.onVirtualPadClick(false);
        });
        virtualPadRight.on('pointerdown', () => {
            this.setPendingVirtualPad(true);
            this.onVirtualPadClick(true);
        });

        this.virtualPadSelector = { left: virtualPadLeft, value: virtualPadValue, right: virtualPadRight };
        this.cursorTexts.push(virtualPadCursor);
        allObjects.push(virtualPadCursor, virtualPadLeft, virtualPadValue, virtualPadRight);
        this.updateVirtualPadDisplay();

        this.optionGroup = this.titleScene.add.group(allObjects);
        this.updateCursor();

        // 戻るボタンを作成してグループに追加
        this.backButtonCreate(textX + 780, textY + 90);
    }

    /** 描画モード表示を更新 */
    private updateRenderModeDisplay() {
        if (!this.renderModeSelector) return;
        this.renderModeSelector.value.setText(this.pendingHighDraw ? 'ＰＣ（高負荷）' : 'ＳＰ（低負荷）');
    }

    /** 仮想パッド表示を更新 */
    private updateVirtualPadDisplay() {
        if (!this.virtualPadSelector) return;
        this.virtualPadSelector.value.setText(this.pendingVirtualPad ? 'ＯＮ' : 'ＯＦＦ');
    }

    /** バー表示を更新 */
    public updateBarDisplay(item: VolumeItemType, volume: number) {
        const barSet = this.volumeBars[item];
        if (!barSet) return;

        const step = Math.round(volume / 10);
        let barStr = '';
        for (let i = 0; i <= 10; i++) {
            barStr += i === step ? '●' : '━';
        }

        barSet.left.setText('0');
        barSet.bar.setText(barStr);
        barSet.right.setText(`${Math.round(volume)}`);
    }

    /** カーソル（▶）の表示を更新 */
    private updateCursor() {
        this.cursorTexts.forEach((cursor, i) => {
            cursor.setText(i === this.focusedItem ? '▶' : '');
        });
    }

    /** オプションメニューを非表示 */
    public hideOptionMenu() {
        if (this.optionGroup) {
            this.optionGroup.destroy(true);
            this.optionGroup = null;
        }
        if (this.backButton) {
            this.backButton.destroy();
            this.backButton = null;
        }
        if (this.backButtonWindow) {
            this.backButtonWindow.destroy(true);
            this.backButtonWindow = null;
        }
        this.volumeBars = [];
        this.cursorTexts = [];
        this.renderModeSelector = null;
        this.virtualPadSelector = null;
    }

    private backButtonCreate(x: number, y: number) {
        const messageObjectInstance = new MessageObject();
        messageObjectInstance.init(this.titleScene, 'Title');

        this.backButton = messageObjectInstance.createTextObject(this.titleScene, x, y, '✖');
        this.backButton.setDepth(Number(this.titleScene.game.config.height) + 11000);

        // ウィンドウ作成
        this.backButtonWindow = new MessageWindow(this.titleScene);
        this.backButtonWindow.init();
        // createOneColumnOneWindow内で(rectR, rectR)の位置に描画されるため、-rectRして位置を合わせる
        this.backButtonWindow.createOneColumnOneWindow(this.backButton, 16);

        // 左右の余白を等しく設定
        this.backButtonWindow.x = x;
        this.backButtonWindow.y = y;
        this.backButtonWindow.setDepth(this.backButton.depth - 1);

        this.backButton.setInteractive({ useHandCursor: true });
        this.backButton.on('pointerdown', () => {
            this.backSubmit();
        }, this);
    }

    /** 戻るボタンが押されたときの処理 */
    private backSubmit() {
        this.hideOptionMenu();
        this.onBack();
    }

    /** 現在の保留中音量データを返す */
    public getPendingVolumes(): OptionData {
        return { ...this.pendingVolumes };
    }

    /** マスタ音量を設定（後方互換用） */
    public setPendingMasterVolume(volume: number) {
        this.pendingVolumes.masterVolume = Phaser.Math.Clamp(volume, 0, 100);
        this.updateBarDisplay(VolumeItem.MASTER, this.pendingVolumes.masterVolume);
    }

    /** 指定項目の音量を設定 */
    public setPendingVolume(item: VolumeItemType, volume: number) {
        const clamped = Phaser.Math.Clamp(volume, 0, 100);
        this.focusedItem = item;
        switch (item) {
            case VolumeItem.MASTER: this.pendingVolumes.masterVolume = clamped; break;
            case VolumeItem.BGM: this.pendingVolumes.bgmVolume = clamped; break;
            case VolumeItem.BGS: this.pendingVolumes.bgsVolume = clamped; break;
            case VolumeItem.SE: this.pendingVolumes.seVolume = clamped; break;
            case VolumeItem.TEXT_SPEED: this.pendingVolumes.textSpeed = clamped; break;
        }
        this.updateBarDisplay(item, clamped);
        this.updateCursor();
    }

    /** 現在フォーカス中の項目 */
    public getFocusedItem(): VolumeItemType { return this.focusedItem; }

    /** フォーカス項目の音量 */
    public getFocusedVolume(): number {
        switch (this.focusedItem) {
            case VolumeItem.MASTER: return this.pendingVolumes.masterVolume;
            case VolumeItem.BGM: return this.pendingVolumes.bgmVolume;
            case VolumeItem.BGS: return this.pendingVolumes.bgsVolume;
            case VolumeItem.SE: return this.pendingVolumes.seVolume;
            case VolumeItem.TEXT_SPEED: return this.pendingVolumes.textSpeed ?? 50;
            default: return 0;
        }
    }

    /** フォーカスを次の項目へ移動 */
    public focusNext() {
        const max = VolumeItem.VIRTUAL_PAD_SELECT;
        this.focusedItem = (this.focusedItem < max
            ? this.focusedItem + 1
            : VolumeItem.MASTER) as VolumeItemType;
        this.updateCursor();
    }

    /** フォーカスを前の項目へ移動 */
    public focusPrev() {
        const max = VolumeItem.VIRTUAL_PAD_SELECT;
        this.focusedItem = (this.focusedItem > VolumeItem.MASTER
            ? this.focusedItem - 1
            : max) as VolumeItemType;
        this.updateCursor();
    }

    /** 描画モードを設定（true: PC / false: スマートフォン） */
    public setPendingHighDraw(highDraw: boolean) {
        console.log(highDraw)
        this.pendingHighDraw = highDraw;
        this.focusedItem = VolumeItem.RENDER_MODE;
        this.updateRenderModeDisplay();
        this.updateCursor();
    }

    /** 描画モードを左右キー方向に循環切り替え（スマートフォン ⇔ PC） */
    public cycleRenderMode(delta: number): boolean {
        const options = [false, true] as const;
        const currentIndex = this.pendingHighDraw ? 1 : 0;
        const nextIndex = delta > 0
            ? (currentIndex + 1) % options.length
            : (currentIndex - 1 + options.length) % options.length;
        this.setPendingHighDraw(options[nextIndex]);
        return options[nextIndex];
    }

    /** 仮想パッドを設定（true: ON / false: OFF） */
    public setPendingVirtualPad(enabled: boolean) {
        this.pendingVirtualPad = enabled;
        this.focusedItem = VolumeItem.VIRTUAL_PAD_SELECT;
        this.updateVirtualPadDisplay();
        this.updateCursor();
    }

    /** 仮想パッドを左右キー方向に循環切り替え（OFF ⇔ ON） */
    public cycleVirtualPad(delta: number): boolean {
        const options = [false, true] as const;
        const currentIndex = this.pendingVirtualPad ? 1 : 0;
        const nextIndex = delta > 0
            ? (currentIndex + 1) % options.length
            : (currentIndex - 1 + options.length) % options.length;
        this.setPendingVirtualPad(options[nextIndex]);
        return options[nextIndex];
    }
}
