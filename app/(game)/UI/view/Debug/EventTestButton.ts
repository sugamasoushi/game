import { FieldScene } from "../../../lib/SceneTypes";
import { EventFlagData } from '../../../Data/EventFlagData';
import { EventObjState } from "../../../lib/types";

// Record で扱えるよう、eventKeys をトップレベルの定数に移動
const eventKeys = [
    'EVENT010101', 'EVENT010201', 'EVENT010202', 'EVENT010301', 'EVENT010302',
    'EVENT010401', 'EVENT020101', 'EVENT020201', 'EVENT020301'
] as const;

// 型定義：eventKeysの中のいずれかの文字列、という意味の型になります
type EventKey = typeof eventKeys[number];

export class EventTestButton {
    private fieldScene: FieldScene;

    private currentIndex = 7; // Default to EVENT020201

    constructor(private uiScene: Phaser.Scene) {
        this.fieldScene = this.uiScene.scene.get('Field') as FieldScene;
    }

    public execute() {
        const leftButton = this.uiScene.add.text(20, 120, '◀', {
            fontSize: '24px',
            color: '#ffffff'
        });
        leftButton.setDepth(101).setInteractive({ useHandCursor: true });

        const testButton = this.uiScene.add.text(50, 120, eventKeys[this.currentIndex], {
            fontSize: '24px',
            color: '#ffffff'
        });
        testButton.setDepth(101).setInteractive({ useHandCursor: true });

        const rightButton = this.uiScene.add.text(230, 120, '▶', {
            fontSize: '24px',
            color: '#ffffff'
        });
        rightButton.setDepth(101).setInteractive({ useHandCursor: true });

        leftButton.on(Phaser.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {
            event.stopPropagation();
            if (pointer.rightButtonReleased()) return;
            this.currentIndex = (this.currentIndex - 1 + eventKeys.length) % eventKeys.length;
            testButton.setText(eventKeys[this.currentIndex]);
        });

        rightButton.on(Phaser.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {
            event.stopPropagation();
            if (pointer.rightButtonReleased()) return;
            this.currentIndex = (this.currentIndex + 1) % eventKeys.length;
            testButton.setText(eventKeys[this.currentIndex]);
        });

        testButton.on(Phaser.Input.Events.POINTER_UP, async (
            pointer: Phaser.Input.Pointer,
            localX: number,
            localY: number,
            event: Phaser.Types.Input.EventData) => {

            //下層のオブジェクトのイベントを止める
            event.stopPropagation();

            //右クリックの場合は処理しない
            if (pointer.rightButtonReleased()) return;

            //イベントごとの設定
            this.setEvent(eventKeys[this.currentIndex]);

        })

    }

    //イベントオブジェクト切替
    protected switchingEventObjFlg(name: string, state: boolean) {
        const gameScene = this.uiScene.scene.get('Field');

        //イベントが完了してない場合は衝突判定をOFFにしておく
        gameScene.children.list.forEach(obj => {
            if (obj.name === name) {
                if (state === true) {
                    //衝突判定をON
                    obj.state = EventObjState.true;
                    (obj.body as Phaser.Physics.Arcade.StaticBody).collisionCategory = 1;//衝突判定のON/OFFを切り替える
                } else {
                    //衝突判定をOFF
                    obj.state = EventObjState.false;
                    (obj.body as Phaser.Physics.Arcade.StaticBody).collisionCategory = 0;//衝突判定のON/OFFを切り替える
                }
            }
        });
    }

    private setEvent(eventKey: EventKey) {

        // if文の羅列をなくし、Record から関数を取り出して実行
        const handler = this.eventHandlers[eventKey];
        if (handler) {
            handler(eventKey);
        }
    }

    // 多くのイベントで共通するデフォルトの処理
    private defaultEventSetup(eventKey: EventKey) {
        EventFlagData.updateFlag(this.uiScene, eventKey, true);
        this.switchingEventObjFlg(eventKey, true);
    }

    private readonly eventHandlers: Record<EventKey, (key: EventKey) => void> = {
        'EVENT010101': (key) => this.defaultEventSetup(key),
        'EVENT010201': (key) => this.defaultEventSetup(key),
        'EVENT010202': (key) => this.defaultEventSetup(key),
        'EVENT010301': (key) => this.defaultEventSetup(key),
        'EVENT010302': (key) => this.defaultEventSetup(key),
        'EVENT010401': (key) => this.defaultEventSetup(key),
        'EVENT020101': (key) => this.defaultEventSetup(key),
        'EVENT020201': (key) => {

            //イベントフラグを立てる
            EventFlagData.updateFlag(this.uiScene, key, true);
            this.switchingEventObjFlg(key, true);

            //セーブデータ更新。２番目の仲間フラグを立てる。
            if (!this.uiScene.cache.json.get('savedata').playerData2.PartyMemberFlg) {
                this.uiScene.cache.json.get('savedata').playerData2.PartyMemberFlg = true;
            }

            //FieldPresenterに通知
            this.fieldScene.events.emit('FIELD_RESTART', {
                gameMode: 'FieldMove',
                mapKey: '0101',
                x: 832,
                y: 464,
                initStandKey: 'stand_left'
            });
        },
        'EVENT020301': (key) => this.defaultEventSetup(key),
    };
}