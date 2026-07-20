import { FieldScene } from "../../../lib/SceneTypes";

// Record で扱えるよう、MapKeys をトップレベルの定数に移動
const mapKeys = ['0001', '0002', '0101', '0102', '0103', '0104', '0105', '0106', '0201'] as const;

// 型定義：MapKeysの中のいずれかの文字列、という意味の型になります
type MapKey = typeof mapKeys[number];

export class MapTestButton {
    private fieldScene: FieldScene;

    private currentIndex = 2;//デフォルト

    constructor(private uiScene: Phaser.Scene) {
        this.fieldScene = this.uiScene.scene.get('Field') as FieldScene;
    }

    public execute() {
        const leftButton = this.uiScene.add.text(20, 140, '◀', {
            fontSize: '24px',
            color: '#ffffff'
        });
        leftButton.setDepth(101).setInteractive({ useHandCursor: true });

        const testButton = this.uiScene.add.text(50, 140, mapKeys[this.currentIndex], {
            fontSize: '24px',
            color: '#ffffff'
        });
        testButton.setDepth(101).setInteractive({ useHandCursor: true });

        const rightButton = this.uiScene.add.text(230, 140, '▶', {
            fontSize: '24px',
            color: '#ffffff'
        });
        rightButton.setDepth(101).setInteractive({ useHandCursor: true });

        leftButton.on(Phaser.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {
            event.stopPropagation();
            if (pointer.rightButtonReleased()) return;
            this.currentIndex = (this.currentIndex - 1 + mapKeys.length) % mapKeys.length;
            testButton.setText(mapKeys[this.currentIndex]);
        });

        rightButton.on(Phaser.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {
            event.stopPropagation();
            if (pointer.rightButtonReleased()) return;
            this.currentIndex = (this.currentIndex + 1) % mapKeys.length;
            testButton.setText(mapKeys[this.currentIndex]);
        });

        testButton.on(Phaser.Input.Events.POINTER_UP, async (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {

            //下層のオブジェクトのイベントを止める
            event.stopPropagation();

            //右クリックの場合は処理しない
            if (pointer.rightButtonReleased()) return;

            //イベントごとの設定
            this.setMap(mapKeys[this.currentIndex]);
        })
    }

    private setMap(mapKey: MapKey) {

        const handler = this.eventHandlers[mapKey];
        if (handler) {
            handler(mapKey);
        }
    }

    // デフォルトの処理
    private defaultMapSetup(mapKey: MapKey) {

        this.fieldScene.events.emit('FIELD_RESTART', {
            gameMode: 'DebugMode', x: 495, y: 337, mapKey: mapKey, initStandKey: 'stand_down'
        }, 'FieldMove');
    }

    private readonly eventHandlers: Record<MapKey, (key: MapKey) => void> = {
        '0001': (key) => this.defaultMapSetup(key),
        '0002': (key) => this.defaultMapSetup(key),
        '0101': (key) => this.defaultMapSetup(key),
        '0102': (key) => { this.fieldScene.events.emit('FIELD_RESTART', { gameMode: 'DebugMode', x: 688, y: 1232, mapKey: key, initStandKey: 'stand_down' }, 'FieldMove'); },
        '0103': (key) => this.defaultMapSetup(key),
        '0104': (key) => { this.fieldScene.events.emit('FIELD_RESTART', { gameMode: 'DebugMode', x: 1088, y: 352, mapKey: key, initStandKey: 'stand_down' }, 'FieldMove'); },
        '0105': (key) => { this.fieldScene.events.emit('FIELD_RESTART', { gameMode: 'DebugMode', x: 608, y: 608, mapKey: key, initStandKey: 'stand_down' }, 'FieldMove'); },
        '0106': (key) => { this.fieldScene.events.emit('FIELD_RESTART', { gameMode: 'DebugMode', x: 1216, y: 416, mapKey: key, initStandKey: 'stand_down' }, 'FieldMove'); },
        '0201': (key) => { this.fieldScene.events.emit('FIELD_RESTART', { gameMode: 'DebugMode', x: 896, y: 512, mapKey: key, initStandKey: 'stand_down' }, 'FieldMove'); },
    };
}