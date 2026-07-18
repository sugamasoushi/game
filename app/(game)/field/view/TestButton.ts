import { FieldScene } from "../../lib/SceneTypes";
import { State, BgmState } from "../../lib/types";
import { GameStateManager } from "../../core/GameStateManager";
import { CacheDataUpdate } from './../../core/CacheDataUpdate';
import { SaveDataManager } from './../../core/SaveDataManager';
import { EventFlagData } from './../../Data/EventFlagData';
import { EventObjState } from "../../lib/types";
import { BaseEvent } from "../../core/BaseEvent";

export class TestButton {

    constructor(private gameScene: FieldScene) { }

    public async execute() { this.createButton(); }

    //テスト用のボタン
    private createButton() {

        const gameStateManager = GameStateManager.getInstance();
        const eventFlagData = new EventFlagData();

        const gameConfigWidth: number = Number(this.gameScene.game.config.width);
        const gameConfigHeight: number = Number(this.gameScene.game.config.height);

        const flameX = gameConfigWidth - 100;
        const flameY = gameConfigHeight - 250;

        const tapText = this.gameScene.add.text(
            flameX, flameY,
            "TEST!", { fontFamily: "Arial Black", fontSize: 24, color: "#df5757ff" });
        tapText.setOrigin(0.5, 0.5).setStroke('#582a2aff', 12).setShadow(4, 4, '#582a2aff', 8, false, true);
        tapText.setDepth(999999);
        tapText.setScrollFactor(0);

        tapText.setInteractive({ useHandCursor: true })

        tapText.on(Phaser.Input.Events.POINTER_UP, async (
            pointer: Phaser.Input.Pointer,
            localX: number,
            localY: number,
            event: Phaser.Types.Input.EventData) => {
            console.log('test')

            //下層のオブジェクトのイベントを止める
            event.stopPropagation();

            //右クリックの場合は処理しない
            if (pointer.rightButtonReleased()) return;

            // //クリア状態に更新
            // const gameStateManager = GameStateManager.getInstance();
            // gameStateManager.updateState({ gameClearFlg: true }, 'system');

            // //キャッシュデータ更新
            // const cacheDataUpdate = new CacheDataUpdate(this.gameScene);
            // cacheDataUpdate.phaserCacheDataUpdate();

            // //セーブ処理
            // const saveDataManager = new SaveDataManager();
            // saveDataManager.writeSaveData(this.gameScene);


            // //リスタート
            // const manager = GameStateManager.getInstance();
            // manager.updateState({ state: State.GAME_RESTART }, 'Test');


            // //現在のBGM状態を更新
            // manager.updateState({ bgmState: BgmState.NOSTATE }, 'sound');


            //セーブデータ更新。２番目の仲間フラグを立てる。
            this.gameScene.cache.json.get('savedata').playerData2.PartyMemberFlg = true;

            EventFlagData.updateFlag(this.gameScene, 'EVENT020201', true);
            this.switchingEventObjFlg('EVENT020201', true);

            //FieldPresenterに通知
            this.gameScene.events.emit('FIELD_RESTART', {
                gameMode: 'FieldMove',
                mapKey: '0101',
                x: 480,
                y: 448,
                initStandKey: 'stand_up'
            });




        })

    }

    //イベントオブジェクト検索
    protected switchingEventObjFlg(name: string, state: boolean) {
        const gameScene = this.gameScene.scene.get('Field');

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

}