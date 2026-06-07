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
} as const;
export type VolumeItemType = typeof VolumeItem[keyof typeof VolumeItem];

/** 各音量項目のバー描画に必要なオブジェクト群 */
interface VolumeBarSet {
    left: Phaser.GameObjects.Text;
    bar: Phaser.GameObjects.Text;
    right: Phaser.GameObjects.Text;
}

export class Option {
    private optionGroup: Phaser.GameObjects.Group | null = null;

    /** 各音量項目のバーオブジェクト（master/bgm/bgs/se 順） */
    private volumeBars: VolumeBarSet[] = [];

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

    /** 戻るボタンが押されたときのコールバック（Presenterで設定） */
    public onBack: () => void = () => { };

    public onVolumeClick: (item: VolumeItemType, volume: number) => void = () => { };

    constructor(private titleScene: Title) { }

    // public update(time: number, delta: number): void { }

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
        }
    }

    /** フォーカスを次の項目へ移動 */
    public focusNext() {
        const max = VolumeItem.TEXT_SPEED;
        this.focusedItem = (this.focusedItem < max
            ? this.focusedItem + 1
            : VolumeItem.MASTER) as VolumeItemType;
        this.updateCursor();
    }

    /** フォーカスを前の項目へ移動 */
    public focusPrev() {
        const max = VolumeItem.TEXT_SPEED;
        this.focusedItem = (this.focusedItem > VolumeItem.MASTER
            ? this.focusedItem - 1
            : max) as VolumeItemType;
        this.updateCursor();
    }

    /** オプションメニューを表示 */
    public showOptionMenu(volumes: OptionData) {
        this.pendingVolumes = { ...volumes };
        this.focusedItem = VolumeItem.MASTER;
        this.volumeBars = [];
        this.cursorTexts = [];

        const height = Number(this.titleScene.game.config.height);
        const textX = 270;
        const textY = 300;
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
        ];
        labels.forEach(t => t.setDepth(depth));

        const messageWindow = new MessageWindow(this.titleScene);
        messageWindow.init();
        messageWindow.createEventMessageWindow(labels[0]);

        // 各音量項目のバー描画
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

        const rows = [textY + 125, textY + 175, textY + 225, textY + 275, textY + 325];

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

        this.optionGroup = this.titleScene.add.group(allObjects);
        this.updateCursor();

        // 戻るボタンを作成してグループに追加
        this.backButtonCreate(textX + 780, textY + 90);
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
}
