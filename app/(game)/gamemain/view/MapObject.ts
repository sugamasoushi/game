import { GameScene, EventObjState, ObjState, CharacterState } from "../../lib/types";
import { TileMap } from "./TileMap";
import { DataDefinition } from '../../Data/DataDefinition';
import { Npc } from "./character/Npc";
import { BaseSprite } from "../../core/BaseSprite";
import { BubbleTalk } from "./character/Action/BubbleTalk";
import { FieldData } from "../../lib/types";
import { Player } from './character/Player';
import { SpriteType_3x4 } from './character/SpriteType_3x4';
import { SpriteType_4x4 } from './character/SpriteType_4x4';
import { FieldObjectCheck } from '@/app/(game)/util/FieldObjectCheck';
import { CaharacterNameData } from "../../Data/NameData";

export class MapObject {
    private fieldData: FieldData;

    private phaserEvents: Phaser.Events.EventEmitter;

    private gameScene: GameScene;
    private TileMap: TileMap;
    private dataDefinition: DataDefinition;
    private player: Player;
    private playerPartyList: Phaser.Physics.Arcade.Sprite[] = [];
    private npcNormalList: Npc[] = [];
    private npcEnemyList: Npc[] = [];

    private eventObjects: Phaser.Physics.Arcade.StaticGroup;
    private clickEventObjects: Phaser.Physics.Arcade.StaticGroup;
    private mapMoveObjects: Phaser.Physics.Arcade.StaticGroup;

    constructor(scene: GameScene) {
        this.gameScene = scene;
        this.dataDefinition = new DataDefinition();
    }

    public async execute(phaserEvents: Phaser.Events.EventEmitter, tileMap: TileMap, fieldData: FieldData) {
        this.phaserEvents = phaserEvents;
        this.fieldData = fieldData;
        this.TileMap = tileMap;

        this.createPlayer();
        this.createNPC();
        this.createObject();

    }

    private createPlayer() {
        const playerX = this.fieldData.x;
        const playerY = this.fieldData.y;
        const initStandKey = this.fieldData.initStandKey;

        //プレイヤー作成
        const player: Player = new Player(this.gameScene, playerX, playerY, 'meina', initStandKey)
        player.state = CharacterState.normal;
        player.setData('name', CaharacterNameData[player.name as keyof typeof CaharacterNameData])

        //各種設定
        player.setDataEnabled();
        player.setData(this.gameScene.cache.json.get('savedata').playerData.status);
        player.setData(this.gameScene.cache.json.get('savedata').playerData.Equip);
        player.setData(this.gameScene.cache.json.get('savedata').playerData.Skill);
        player.setData(this.gameScene.cache.json.get('savedata').playerData.Item);

        //プレイヤーと衝突判定の設定
        this.gameScene.setPlayer(player);
        if (this.TileMap.getCollisionLayer()) {
            this.gameScene.physics.add.collider(player, this.TileMap.getCollisionLayer());
        }

        this.player = player;
        this.playerPartyList.push(player);
    }

    private createNPC() {

        //NPC作成
        if (this.TileMap.getMakeTilemap().objects) {
            for (const makeTilemapObj of this.TileMap.getMakeTilemap().objects) {
                if (makeTilemapObj.name === 'NPC') {
                    for (const npcObj of makeTilemapObj.objects) {
                        const nameArray = npcObj.name.split(',');

                        try {
                            const npc = this.createSprite(
                                nameArray[0], //npcType : npcのタイプ
                                nameArray[1], //spritetype : spriteのタイプ
                                this.gameScene,
                                npcObj.x!,
                                npcObj.y!,
                                nameArray[2], //spriteSheetKey : タイル画像のキー
                                nameArray[3], //name : ゲーム内変数としてのキャラ名、画像などで使用
                                nameArray[4] ? nameArray[4] : 'stand_down',//指定されていなければ下向き配置
                                nameArray[5] ? nameArray[5] : '', //imageKey : 立ち絵のキー、アイコンにも使用
                                nameArray[6] ? nameArray[6] : ''//指定されていれば吹き出し会話を設定する。「bubbleTalk0000.talk000」
                            );

                            npc!.init();

                            if (nameArray[0] === 'normal') {
                                this.npcNormalList.push(npc as Npc);
                            } else {
                                this.npcEnemyList.push(npc as Npc);
                            }

                            if (this.TileMap.getCollisionLayer()) {
                                this.gameScene.physics.add.collider(npc as Phaser.Physics.Arcade.Sprite, this.TileMap.getCollisionLayer());
                            }

                        } catch {
                            console.log('NPC作成エラー')
                            console.log(nameArray)
                        }

                    }
                }
            }
        }
    }

    public createSprite(npcType: string, spritetype: string, gameScene: GameScene, x: number, y: number, spriteSheetKey: string, name: string, initStandKey: string, imageKey: string, bubbleTalkKey: string) {
        if (spritetype === '0404') { return new SpriteType_4x4(gameScene, x, y, npcType, spriteSheetKey, name, initStandKey, imageKey, bubbleTalkKey); }
        if (spritetype === '0304') { return new SpriteType_3x4(gameScene, x, y, npcType, spriteSheetKey, name, initStandKey, imageKey, bubbleTalkKey); }
    }

    /**
     * オブジェクト作成
     *
     * @param {*} scene
     * @memberof MapManage
     */
    private createObject() {
        const makeTileMap: Phaser.Tilemaps.Tilemap = this.TileMap.getMakeTilemap();

        const eventObjects: Phaser.GameObjects.GameObject[] = makeTileMap.createFromObjects('EVENT', {}, false);
        const clickEventObjects: Phaser.GameObjects.GameObject[] = makeTileMap.createFromObjects('CLICKEVENT', {}, false);
        const mapMoveObjects: Phaser.GameObjects.GameObject[] = makeTileMap.createFromObjects('MAPMOVE', {}, false);

        //静的オブジェクトに設定
        this.eventObjects = this.gameScene.physics.add.staticGroup(eventObjects);
        this.clickEventObjects = this.gameScene.physics.add.staticGroup(clickEventObjects);
        this.mapMoveObjects = this.gameScene.physics.add.staticGroup(mapMoveObjects);

        const eventObjectStaticGroupChildren: Phaser.GameObjects.GameObject[] = this.eventObjects.getChildren();
        const clickEventObjectStaticGroupChildren: Phaser.GameObjects.GameObject[] = this.clickEventObjects.getChildren();
        const mapMoveObjectStaticGroupChildren: Phaser.GameObjects.GameObject[] = this.mapMoveObjects.getChildren();

        for (const obj of eventObjectStaticGroupChildren) {
            this.settingEventObject(obj as Phaser.Physics.Arcade.Sprite);
        }
        for (const obj of clickEventObjectStaticGroupChildren) {
            this.settingClickEventObject(obj as Phaser.Physics.Arcade.Sprite);
        }
        for (const obj of mapMoveObjectStaticGroupChildren) {
            this.settingMapMoveObject(obj as Phaser.Physics.Arcade.Sprite);
        }
        // console.log(this.eventObjects)
        // console.log(this.clickEventObjects)
        // console.log(this.clickEventObjects)
    }

    //イベントオブジェクト作成
    private settingEventObject(obj: Phaser.Physics.Arcade.Sprite): void {

        //状態設定
        obj.state = this.dataDefinition.getEventFlgFromSaveDataInfomation(this.gameScene, obj.name);

        //イベントステータスがfalseの場合
        if (obj.state === EventObjState.false) {

            //衝突判定をOFF
            (obj.body as Phaser.Physics.Arcade.StaticBody).collisionCategory = 0;//衝突判定のON/OFFを切り替える
        }

        //高さを設定（phaserで自動的に32に補正される模様）
        obj.displayHeight = 1;

        //オブジェクトに衝突した場合、イベントを発生させる
        this.gameScene.physics.add.world.addCollider(this.gameScene.getPlayer(), obj, () => {

            this.gameScene.events.emit('EVENT_START', obj)

            // obj.destroy();//オブジェクトを削除
        }, undefined, this.gameScene);

        if (this.gameScene.physics.world.defaults.debugShowBody === false) {
            obj.setVisible(false);
        }

        // シーン終了時にイベントを破棄
        this.gameScene.events.once('shutdown', () => {
            obj.destroy();
        });
    }

    private settingClickEventObject(obj: Phaser.Physics.Arcade.Sprite): void {

        //プレイヤーとオブジェクトのチェック
        const fieldPlayerChk = new FieldObjectCheck(this.gameScene.getPlayer(), obj as BaseSprite);

        //吹き出し会話を設定
        const bubbleTalk = new BubbleTalk(this.gameScene, undefined, obj.name);//obj.name : 会話データのキー。例：bubbleTalk0000.talk000
        bubbleTalk.init();

        //有効状態に設定
        obj.state = ObjState.true;

        obj.setInteractive({ useHandCursor: true });//クリック可能にする
        //objectArray.setDepth(-1000);

        obj.on('pointerdown', () => {
            if (Phaser.Math.Difference(obj.x, this.gameScene.getPlayer().x) < 40 && Phaser.Math.Difference(obj.y, this.gameScene.getPlayer().y) < 40) {

                //キャラ向きとオブジェクト位置からイベント発生可否をチェック
                if (fieldPlayerChk.checkPlayerClickEvent()) {
                    bubbleTalk!.execTalk();
                }
            }
        })
        //プレイヤーとの距離が40未満の場合
        if (Phaser.Math.Difference(obj.x, this.gameScene.getPlayer().x) < 40 && Phaser.Math.Difference(obj.y, this.gameScene.getPlayer().y) < 40) {
            obj.on('pointerdown', () => {

                //キー押下
                // this.scene.input.keyboard.on(this.keyCode, async () => {
                //     this.scene.keys.P.setEmitOnRepeat(false)//押下時、一度だけイベントを発行する。（設定しないと押下中にイベントが発行され続ける）

                //     this._positionLeftRightCheck();//キャラの位置関係を確認
                //     this.sprite.turnAround();
                //     this.scene.deviceSetting.deviceEventFalse();
                //     this.scene.mapManage.mapNpcList.forEach(list => {
                //         list.bubbleTalkFlag = true;
                //     });

                //     for (let i = 0; i < talkData.length; i++) {
                //         await this._execTalk(Object.keys(talkData[i])[0], talkData[i][Object.keys(talkData[i])]);
                //     }
                //     this._reSetting();
                // })
            })
        }
        obj.setDepth(-100);

        // シーン終了時にイベントを破棄
        this.gameScene.events.once('shutdown', () => {
            obj.destroy();
        });
    }

    private settingMapMoveObject(obj: Phaser.Physics.Arcade.Sprite): void {
        const moveMapKey = obj.name.substring(0, 4);
        let moveMapX = Number(obj.name.substring(5, 9));
        let moveMapY = Number(obj.name.substring(10, 14));
        const direction = obj.name.substring(15, 16);
        const moveCorrection = 32 / 2 + 2;//マップ切り替え時のキャラクター位置調整用
        let initStandKey: string;

        //有効状態に設定
        obj.state = ObjState.true;

        //非表示
        obj.setVisible(false);

        //移動後の初期位置を補正
        if (direction === "R") {
            moveMapX += moveCorrection;

            //サイズを変更
            obj.body!.setSize(2, obj.body!.height);

            //右向き
            initStandKey = 'stand_right';

        } else if (direction === "L") {
            moveMapX += -(moveCorrection);

            //サイズを変更
            obj.body!.setSize(2, obj.body!.height);

            //左向き
            initStandKey = 'stand_left'

        } else if (direction === "U") {
            moveMapY += -(moveCorrection);

            //サイズを変更
            obj.body!.setSize(obj.body!.width, 2);

            //上向き
            initStandKey = 'stand_up'

        } else if (direction === "D") {
            moveMapY += moveCorrection;

            //サイズを変更
            obj.body!.setSize(obj.body!.width, 2);

            //右向き
            initStandKey = 'stand_down';
        }

        //オブジェクトに衝突したらマップを変更する
        this.gameScene.physics.add.overlap(this.gameScene.getPlayer(), obj, () => {
            (obj.body as Phaser.Physics.Arcade.StaticBody).collisionCategory = 0;//衝突判定のON/OFFを切り替える

            //FieldPresenterに通知
            this.phaserEvents.emit('FIELD_RESTART', {
                gameMode: 'FieldMove',
                mapKey: moveMapKey,
                x: moveMapX,
                y: moveMapY,
                initStandKey: initStandKey
            });

            //アニメーション用配列を初期化。※TileMapのcreate時に初期化している。
            // this.TileMap.initAnimationTileMapLayer();

        }, undefined, this.gameScene);

        // シーン終了時にイベントを破棄
        this.gameScene.events.once('shutdown', () => {
            obj.destroy();
        });
    }

    public getPlayer(): Player {
        return this.player;
    }
    public getPlayerPartyList(): Phaser.GameObjects.Sprite[] {
        return this.playerPartyList;
    }
    public getFieldEnemyList(): Npc[] {
        return this.npcEnemyList;
    }
    public getFieldNpclList(): Npc[] {
        return this.npcNormalList;
    }

}