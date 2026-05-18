import { GameScene } from "../../lib/SceneTypes";
import { EventObjState, ObjState, CharacterState, FieldData, MapLayerDepth } from "../../lib/FieldTypes";
import { TileMap } from "./TileMap";
import { DataDefinition } from '../../Data/DataDefinition';
import { Npc } from "./character/Npc";
import { BaseSprite } from "../../core/BaseSprite";
import { BubbleTalk } from "./character/Action/BubbleTalk";
import { Player } from './character/Player';
import { SpriteType_3x4 } from './character/SpriteType_3x4';
import { SpriteType_4x4 } from './character/SpriteType_4x4';
import { FieldObjectCheck } from '@/app/(game)/util/FieldObjectCheck';
import { Sound } from "../../scenes/Sound";
import { GameStateManager } from '@/app/(game)/GameAllState/GameStateManager';
import { SearchCharacterData } from '../../Data/SearchCharacterData';
import { TiledObjectEntity } from './character/TiledObjectEntity';
import { CacheDataUpdate } from '@/app/(game)/core/CacheDataUpdate';
import { InputManager } from '../../core/input/InputManager';
import { State } from "../../lib/types";
import { Subscription } from "rxjs";

export class MapObject extends Phaser.GameObjects.Container {
    private debugFlg: boolean | undefined;
    private fieldData: FieldData;

    private phaserEvents: Phaser.Events.EventEmitter;
    private inputManager: InputManager
    private subs = new Subscription();

    private gameScene: GameScene;
    private TileMap: TileMap;
    private dataDefinition: DataDefinition;
    private player: Player;
    private playerPartyList: Phaser.Physics.Arcade.Sprite[] = [];
    private npcNormalList: Npc[] = [];
    private npcEnemyList: Npc[] = [];

    private eventObjects: Phaser.Physics.Arcade.StaticGroup;
    private clickEventObjects: Phaser.Physics.Arcade.Sprite[] = [];
    private mapMoveObjects: Phaser.Physics.Arcade.StaticGroup;
    private chestSpriteObjects: Phaser.Physics.Arcade.Sprite[] = [];
    private treeGlassSpriteObjects: Phaser.Physics.Arcade.StaticGroup;
    private treeStemSpriteObjects: Phaser.Physics.Arcade.StaticGroup;

    private soundScene: Sound;

    private playerLight: Phaser.GameObjects.Light;
    private playerLightFlg: boolean = false;
    private light: Phaser.GameObjects.Light[] = [];
    private lightObjectLayer: Phaser.Tilemaps.ObjectLayer;
    private lightFlg: boolean = false;
    private ellipse: Phaser.Geom.Ellipse[] = [];
    private timerEventObj: Phaser.Time.TimerEvent | null = null;

    private renderTexture: Phaser.GameObjects.RenderTexture | null = null;
    private bgRenderTexture: Phaser.GameObjects.RenderTexture | null = null;
    private renderTextureUpdateFlg: boolean = false;

    constructor(scene: GameScene) {
        super(scene);
        this.gameScene = scene;
        this.addToUpdateList();
        this.dataDefinition = new DataDefinition();
        this.soundScene = this.gameScene.scene.get('Sound') as Sound;
        this.debugFlg = scene.game.config.physics.arcade?.debug;
    }

    public async execute(phaserEvents: Phaser.Events.EventEmitter, tileMap: TileMap, fieldData: FieldData, sceneKey: string, inputManager: InputManager) {
        this.phaserEvents = phaserEvents;
        this.fieldData = fieldData;
        this.TileMap = tileMap;
        this.inputManager = inputManager;

        // リストを初期化
        this.playerPartyList = [];
        this.npcNormalList = [];
        this.npcEnemyList = [];
        this.light = [];
        this.ellipse = [];
        this.timerEventObj = null;

        await Promise.all([
            this.createPlayer(sceneKey),
            this.createNPC(),
            this.createObject(),
            this.setupInput()
        ]);

        //this.createFog()
        this.createShader()
        await this.createBgRenderTexture();
        await this.createRendertexture();
        await this.createWaterSurface();

        //エフェクトの作成
        this.createEffect();

        //lightの設定　※レンダーテクスチャ生成の後に作成しないとテクスチャが生成されない
        this.setLight2DPipeline()
        this.createLight();

        this.gameScene.events.once('shutdown', () => {
            this.subs.unsubscribe();
        });
    }

    private setupInput() {
        this.subs.add(this.inputManager.decideButton$.subscribe(() => {
            //操作ロックされている場合、何もしない
            const manager = GameStateManager.getInstance();
            if (manager.currentState !== State.NOSTATE) return;

            //クリックイベント
            for (const obj of this.clickEventObjects) {
                if (Phaser.Geom.Intersects.RectangleToRectangle(obj.getBounds(), this.gameScene.getPlayer().getBounds())) {
                    this.execClickEvent(obj);
                }
            }

            //宝箱を開ける
            for (const obj of this.chestSpriteObjects) {
                if (Phaser.Geom.Intersects.RectangleToRectangle(obj.getBounds(), this.gameScene.getPlayer().getBounds())) {
                    this.execOpenChest(obj);
                }
            }
        }));
    }

    preUpdate(time: number, delta: number) {
        this.updateRenderTexture();

        if (!this.playerLightFlg) return;
        this.playerLight.x = this.player.x;
        this.playerLight.y = this.player.y;
    }

    private createPlayer(sceneKey: string) {
        return new Promise<void>(async (resolve) => {
            const gameStateManager = GameStateManager.getInstance();

            const playerX = this.fieldData.x;
            const playerY = this.fieldData.y;
            const initStandKey = this.fieldData.initStandKey;

            //プレイヤー作成
            const player: Player = new Player(this.gameScene, playerX, playerY, 'meina', initStandKey)
            player.state = CharacterState.normal;

            const searchCharacterData = new SearchCharacterData(this.gameScene.cache.json);
            player.setData('name', searchCharacterData.getCharacterData(player.name).name)

            //各種設定
            player.setDataEnabled();
            player.setData(this.gameScene.cache.json.get('savedata').playerData.status);
            player.setData(this.gameScene.cache.json.get('savedata').playerData.Equip);
            player.setData(this.gameScene.cache.json.get('savedata').playerData.Skill);
            player.setData(this.gameScene.cache.json.get('savedata').playerData.Item);
            player.setDepth(MapLayerDepth.High + player.y);

            //プレイヤーと衝突判定の設定
            this.gameScene.setPlayer(player);
            if (this.TileMap.getCollisionLayer()) {
                this.gameScene.physics.add.collider(player, this.TileMap.getCollisionLayer());
            }

            this.player = player;
            this.playerPartyList.push(player);

            //プレイヤー2作成
            if (this.gameScene.cache.json.get('savedata').playerData2.PartyMemberFlg) {

                //座標設定されている場合は設定済み座標を、設定されていない場合はプレイヤーの座標を使用
                const playerX2 = this.fieldData.x2 > 0 ? this.fieldData.x2 : playerX;
                const playerY2 = this.fieldData.y2 > 0 ? this.fieldData.y2 : playerY;

                const player2: Player = new Player(this.gameScene, playerX2, playerY2, 'lamy', initStandKey)
                player2.state = CharacterState.normal;
                player2.setData('name', searchCharacterData.getCharacterData(player2.name).name)

                //各種設定
                player2.setDataEnabled();
                player2.setData(this.gameScene.cache.json.get('savedata').playerData2.status);
                player2.setData(this.gameScene.cache.json.get('savedata').playerData2.Equip);
                player2.setData(this.gameScene.cache.json.get('savedata').playerData2.Skill);
                player2.setDepth(MapLayerDepth.High + player2.y);

                //プレイヤーと衝突判定の設定
                if (this.TileMap.getCollisionLayer()) {
                    this.gameScene.physics.add.collider(player2, this.TileMap.getCollisionLayer());
                }

                this.playerPartyList.push(player2);
            }

            //プレイヤー3作成
            if (this.gameScene.cache.json.get('savedata').playerData3.PartyMemberFlg) {

                const player3: Player = new Player(this.gameScene, playerX, playerY, 'lamy', initStandKey)
                player3.state = CharacterState.normal;
                player3.setData('name', searchCharacterData.getCharacterData(player3.name).name)

                //各種設定
                player3.setDataEnabled();
                player3.setData(this.gameScene.cache.json.get('savedata').playerData3.status);
                player3.setData(this.gameScene.cache.json.get('savedata').playerData3.Equip);
                player3.setData(this.gameScene.cache.json.get('savedata').playerData3.Skill);
                player3.setDepth(MapLayerDepth.High + player3.y);

                this.playerPartyList.push(player3);
            }

            // 状態管理クラスのパーティリストを更新
            gameStateManager.setPlayerPartyList(this.playerPartyList);

            resolve();
        });
    }

    private createNPC() {
        return new Promise<void>(async (resolve) => {
            //NPC作成
            if (this.TileMap.getMakeTilemap().objects) {
                for (const makeTilemapObj of this.TileMap.getMakeTilemap().objects) {
                    if (makeTilemapObj.name === 'NPC') {
                        for (const npcObj of makeTilemapObj.objects) {

                            try {
                                const entity = new TiledObjectEntity(npcObj.properties);

                                //イベント関連の敵の場合、イベントフラグが立ってなければ作成しない
                                if (entity.eventKey) {
                                    const eventFlgData = this.gameScene.cache.json.get('savedata').EventFlag;
                                    for (const key in eventFlgData) {
                                        const k = key as keyof typeof eventFlgData;
                                        if (k === entity.eventKey && !eventFlgData[k]) {
                                            // console.log(key, eventFlgData[k])
                                            resolve();
                                            return;
                                        }
                                    }
                                }

                                const npc = this.createSprite(
                                    entity.npcType, //npcType : npcのタイプ
                                    entity.spriteType, //spritetype : spriteのタイプ
                                    this.gameScene,
                                    npcObj.x!,
                                    npcObj.y!,
                                    entity.spritesheetKey, //spriteSheetKey : タイル画像のキー
                                    entity.name, //name : ゲーム内変数としてのキャラ名、画像などで使用
                                    entity.standkey, //指定されていなければ下向き配置
                                    entity.imageKey, //imageKey : 立ち絵のキー、アイコンにも使用
                                    entity.bubbleTalkKey //指定されていれば吹き出し会話を設定する。「bubbleTalk0000.talk000」
                                );

                                npc!.init();

                                npc!.setVisible(entity.isVisible);

                                if (entity.scale) {
                                    npc!.setScale(entity.scale);
                                }

                                if (entity.npcType === 'normal') {
                                    this.npcNormalList.push(npc as Npc);
                                } else {
                                    this.npcEnemyList.push(npc as Npc);
                                }

                                if (this.TileMap.getCollisionLayer()) {
                                    this.gameScene.physics.add.collider(npc as Phaser.Physics.Arcade.Sprite, this.TileMap.getCollisionLayer());
                                }

                                for (const player of this.playerPartyList) {
                                    this.gameScene.physics.add.collider(npc!, player);
                                }

                                npc!.setInputManager(this.inputManager);

                            } catch (e) {
                                console.log('NPC作成エラー')
                                console.log(e)
                            }
                        }
                    }
                }
            }

            resolve();
        });
    }

    public createSprite(npcType: string, spritetype: string, gameScene: GameScene, x: number, y: number, spriteSheetKey: string, name: string, initStandKey: string, imageKey: string, bubbleTalkKey: string) {
        if (spritetype === '0404') { return new SpriteType_4x4(gameScene, x, y, npcType, spriteSheetKey, name, initStandKey, imageKey, bubbleTalkKey); }
        if (spritetype === '0304') { return new SpriteType_3x4(gameScene, x, y, npcType, spriteSheetKey, name, initStandKey, imageKey, bubbleTalkKey); }
    }

    private createObject() {
        return new Promise<void>(async (resolve) => {
            const makeTileMap: Phaser.Tilemaps.Tilemap = this.TileMap.getMakeTilemap();

            // オブジェクトレイヤーの存在チェックを行い、警告を回避する
            let eventObjects: Phaser.GameObjects.GameObject[] = [];
            let clickEventObjects: Phaser.GameObjects.GameObject[] = [];
            let mapMoveObjects: Phaser.GameObjects.GameObject[] = [];
            let chestSpriteObjects: Phaser.GameObjects.GameObject[] = [];
            let treeGlassSpriteObjects: Phaser.GameObjects.GameObject[] = [];
            let treeStemSpriteObjects: Phaser.GameObjects.GameObject[] = [];
            let lightObject: Phaser.Tilemaps.ObjectLayer;

            if (makeTileMap.getObjectLayer('EVENT')) {
                eventObjects = makeTileMap.createFromObjects('EVENT', {}, false);
            }
            if (makeTileMap.getObjectLayer('CLICKEVENT')) {
                clickEventObjects = makeTileMap.createFromObjects('CLICKEVENT', {}, false);
            }
            if (makeTileMap.getObjectLayer('MAPMOVE')) {
                mapMoveObjects = makeTileMap.createFromObjects('MAPMOVE', {}, false);
            }
            if (makeTileMap.getObjectLayer('LIGHT')) {
                this.lightFlg = true;
                this.lightObjectLayer = (makeTileMap.getObjectLayer('LIGHT')!);

            }

            if (makeTileMap.getObjectLayer('SPRITE')) {

                //同じ名前のオブジェクトをまとめて作成する。
                chestSpriteObjects = makeTileMap.createFromObjects('SPRITE', {
                    name: 'chest',  // Tiledでオブジェクトに付けた「名前」を指定
                    key: 'tex_Chests' // ロード済みのspritesheetKey
                });


                treeGlassSpriteObjects = makeTileMap.createFromObjects('SPRITE', {
                    name: 'tree_glass',  // Tiledでオブジェクトに付けた「名前」を指定
                    key: 'tex_tree_glass' // spritesheetKey
                });
                treeStemSpriteObjects = makeTileMap.createFromObjects('SPRITE', {
                    name: 'tree_stem',  // Tiledでオブジェクトに付けた「名前」を指定
                    key: 'tex_tree_stem' // spritesheetKey
                });
            }


            //静的オブジェクトに設定
            this.eventObjects = this.gameScene.physics.add.staticGroup(eventObjects);
            const clickEventObjectsArcadeStaticGroup = this.gameScene.physics.add.staticGroup(clickEventObjects);
            this.mapMoveObjects = this.gameScene.physics.add.staticGroup(mapMoveObjects);

            const chestSpriteObjectsArcadeStaticGroup: Phaser.Physics.Arcade.StaticGroup = this.gameScene.physics.add.staticGroup(chestSpriteObjects);
            this.treeGlassSpriteObjects = this.gameScene.physics.add.staticGroup(treeGlassSpriteObjects);
            this.treeStemSpriteObjects = this.gameScene.physics.add.staticGroup(treeStemSpriteObjects);

            //静的オブジェクトの子要素を取得
            const eventObjectStaticGroupChildren: Phaser.GameObjects.GameObject[] = this.eventObjects.getChildren();
            const clickEventObjectStaticGroupChildren: Phaser.GameObjects.GameObject[] = clickEventObjectsArcadeStaticGroup.getChildren();
            const mapMoveObjectStaticGroupChildren: Phaser.GameObjects.GameObject[] = this.mapMoveObjects.getChildren();

            const chestSpriteObjectStaticGroupChildren: Phaser.GameObjects.GameObject[] = chestSpriteObjectsArcadeStaticGroup.getChildren();
            const treeGlassSpriteObjectStaticGroupChildren: Phaser.GameObjects.GameObject[] = this.treeGlassSpriteObjects.getChildren();
            const treeStemSpriteObjectStaticGroupChildren: Phaser.GameObjects.GameObject[] = this.treeStemSpriteObjects.getChildren();

            for (const obj of eventObjectStaticGroupChildren) {
                await this.settingEventObject(obj as Phaser.Physics.Arcade.Sprite);
            }
            for (const obj of clickEventObjectStaticGroupChildren) {
                await this.settingClickEventObject(obj as Phaser.Physics.Arcade.Sprite);
                this.clickEventObjects.push(obj as Phaser.Physics.Arcade.Sprite);
            }
            for (const obj of mapMoveObjectStaticGroupChildren) {
                await this.settingMapMoveObject(obj as Phaser.Physics.Arcade.Sprite);
            }

            for (const obj of chestSpriteObjectStaticGroupChildren) {
                await this.settingChestSpriteObject(obj as Phaser.Physics.Arcade.Sprite, 'tex_Chests');
                this.chestSpriteObjects.push(obj as Phaser.Physics.Arcade.Sprite);
            }
            for (const obj of treeGlassSpriteObjectStaticGroupChildren) {
                await this.settingTreeGlassSpriteObjects(obj as Phaser.Physics.Arcade.Sprite);
            }
            for (const obj of treeStemSpriteObjectStaticGroupChildren) {
                await this.settingTreeStemSpriteObjects(obj as Phaser.Physics.Arcade.Sprite);
            }

            resolve();
        });
    }

    //イベントオブジェクト作成
    private settingEventObject(obj: Phaser.Physics.Arcade.Sprite) {
        return new Promise<void>(async (resolve) => {

            //状態設定
            obj.state = this.dataDefinition.getEventFlgFromSaveDataInfomation(this.gameScene, obj.name);

            obj.setDepth(-1000);

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

            resolve();
        });
    }

    private settingClickEventObject(obj: Phaser.Physics.Arcade.Sprite) {
        return new Promise<void>(async (resolve) => {

            //有効状態に設定
            obj.state = ObjState.true;

            obj.setInteractive({ useHandCursor: true });//クリック可能にする
            //objectArray.setDepth(-1000);

            obj.on('pointerdown', () => {
                this.gameScene.getPlayer().stopAnimation();
                if (Phaser.Math.Difference(obj.x, this.gameScene.getPlayer().x) < 40 && Phaser.Math.Difference(obj.y, this.gameScene.getPlayer().y) < 40) {

                    this.execClickEvent(obj);
                }
            })

            obj.setDepth(-100);

            // シーン終了時にイベントを破棄
            this.gameScene.events.once('shutdown', () => {
                obj.destroy();
            });

            resolve();
        });
    }

    private settingMapMoveObject(obj: Phaser.Physics.Arcade.Sprite) {
        return new Promise<void>(async (resolve) => {

            const tileSize = 2;

            const moveMapKey = obj.getData('moveToMap');
            let moveMapX = obj.getData('moveX');
            let moveMapY = obj.getData('moveY');
            const direction = obj.getData('direction');

            //マップ切り替え時のキャラクター位置調整用
            const moveCorrection = 32 / 2 + 2;

            //初期立ち絵のキー
            let initStandKey: string;

            //有効状態に設定
            obj.state = ObjState.true;

            //非表示
            obj.setVisible(false);

            //移動後の初期位置を補正
            if (direction === "R") {
                moveMapX += moveCorrection;

                //サイズを変更
                obj.body!.setSize(tileSize, obj.body!.height);

                //右向き
                initStandKey = 'stand_right';

            } else if (direction === "L") {
                moveMapX += -(moveCorrection);

                //サイズを変更
                obj.body!.setSize(tileSize, obj.body!.height);

                //左向き
                initStandKey = 'stand_left'

            } else if (direction === "U") {
                moveMapY += -(moveCorrection);

                //サイズを変更
                obj.body!.setSize(obj.body!.width, tileSize);

                //上向き
                initStandKey = 'stand_up'

            } else if (direction === "D") {
                moveMapY += moveCorrection;

                //サイズを変更
                obj.body!.setSize(obj.body!.width, tileSize);

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

                //キャッシュを更新
                const cacheDataUpdate = new CacheDataUpdate(this.gameScene);
                cacheDataUpdate.phaserCacheDataUpdate();

                //プレイヤーを停止（FIELD_RESTARTによりプレイヤーが再生成されるため、リセットされる）
                this.gameScene.getPlayer().state = CharacterState.stop;
                this.gameScene.getPlayer().setVelocity(0);

            }, undefined, this.gameScene);

            // シーン終了時にイベントを破棄
            this.gameScene.events.once('shutdown', () => {
                obj.destroy();
            });

            resolve();
        });
    }

    private settingChestSpriteObject(obj: Phaser.Physics.Arcade.Sprite, imageKey: string) {

        return new Promise<void>(async (resolve) => {

            // id無し宝箱はランダム生成
            if (obj.getData('id') == null) {
                if (new Phaser.Math.RandomDataGenerator().between(0, 2) >= 1) {
                    obj.destroy();
                    resolve();
                    return;
                }
            }

            // //衝突判定の追加
            for (const player of this.playerPartyList) {
                this.gameScene.physics.add.collider(player, obj);
            }

            // //深度設定
            obj.setDepth(MapLayerDepth.Highest + obj.y);
            //obj.setPipeline('Light2D');

            //アニメーション設定
            obj.anims.create({
                key: 'chest_open',
                frames: this.gameScene.anims.generateFrameNumbers(imageKey, { start: 4, end: 4 }),
                frameRate: 1,
                repeat: 0
            });
            obj.anims.create({
                key: 'chest_close',
                frames: this.gameScene.anims.generateFrameNumbers(imageKey, { start: 0, end: 0 }),
                frameRate: 1,
                repeat: 0
            });

            //配置時の状態設定
            const boxId = obj.getData('id');
            if (boxId != null && this.gameScene.cache.json.get('savedata').itemboxFlg[boxId] === 0) {
                obj.play('chest_open');
            } else {

                //クリック可能にする
                obj.setInteractive({ useHandCursor: true });

                // //クリックイベント
                obj.on('pointerdown', async () => {
                    this.execOpenChest(obj);
                })

                // シーン終了時にイベントを破棄
                this.gameScene.events.once('shutdown', () => {
                    obj.destroy();
                });
            }

            resolve();
        });
    }

    //------------------------オブジェクトサンプル
    private settingTreeGlassSpriteObjects(obj: Phaser.Physics.Arcade.Sprite) {
        return new Promise<void>(async (resolve) => {

            obj.setDepth(this.gameScene.getTilemap().getMakeTilemap().heightInPixels > this.gameScene.getTilemap().getMakeTilemap().widthInPixels ? this.gameScene.getTilemap().getMakeTilemap().heightInPixels : this.gameScene.getTilemap().getMakeTilemap().widthInPixels);

            obj.setOrigin(0.5, 1);

            obj.setPosition(obj.x, obj.y + 96 / 2).setPipeline('Light2D');

            // 風で揺れるTweenアニメーションを作成
            this.gameScene.tweens.add({
                targets: obj,
                angle: { from: -2, to: 2 },
                ease: 'sine.easeInOut',
                duration: 2000,
                yoyo: true,
                repeat: -1,
                delay: Phaser.Math.Between(0, 2000)
            });

            resolve();
        });
    }
    private settingTreeStemSpriteObjects(obj: Phaser.Physics.Arcade.Sprite) {
        obj.setDepth(obj.y);
    }
    //------------------------オブジェクトサンプル

    public getPlayer(): Player {
        return this.player;
    }
    public getPlayerPartyList(): Phaser.Physics.Arcade.Sprite[] {
        return this.playerPartyList;
    }
    public getFieldEnemyList(): Npc[] {
        return this.npcEnemyList;
    }
    public getFieldNpclList(): Npc[] {
        return this.npcNormalList;
    }

    private execClickEvent(obj: Phaser.Physics.Arcade.Sprite) {

        //状態管理クラス
        const manager = GameStateManager.getInstance();

        //操作ロックされている場合、何もしない
        if (manager.currentState !== State.NOSTATE) return;

        //吹き出し会話を設定
        const bubbleTalk = new BubbleTalk(this.gameScene, undefined, obj.name);//obj.name : 会話データのキー。例：bubbleTalk0000.talk000
        bubbleTalk.init();

        //プレイヤーとオブジェクトのチェック
        const fieldPlayerChk = new FieldObjectCheck(this.gameScene.getPlayer(), obj as BaseSprite);

        //キャラ向きとオブジェクト位置からイベント発生可否をチェック
        if (fieldPlayerChk.checkPlayerClickEvent()) {
            bubbleTalk!.execTalk();
        }
    }

    private execOpenChest(obj: Phaser.Physics.Arcade.Sprite) {

        if (obj.getData('num') <= 0) return;

        //プレイヤーとの距離が近い場合
        if (Phaser.Math.Difference(obj.x, this.gameScene.getPlayer().x) < 40 && Phaser.Math.Difference(obj.y, this.gameScene.getPlayer().y) < 40) {

            for (const player of this.playerPartyList) {
                player.state = CharacterState.event;
                player.setVelocity(0);
            }

            const getItemName = obj.getData('item');
            const getItemNum = obj.getData('num');
            const bubbleTalkKey = obj.getData('bubbleTalkKey');

            //吹き出し会話を設定
            let bubbleTalk: BubbleTalk;
            if (bubbleTalkKey) {
                bubbleTalk = new BubbleTalk(this.gameScene, undefined, bubbleTalkKey);//obj.name : 会話データのキー。例：bubbleTalk0000.talk000
                bubbleTalk.init();
            }

            //プレイヤーとオブジェクトのチェック
            const fieldPlayerChk = new FieldObjectCheck(this.gameScene.getPlayer(), obj as BaseSprite);

            //キャラ向きとオブジェクト位置からイベント発生可否をチェック
            if (fieldPlayerChk.checkPlayerClickEvent()) {

                //メッセージ表示
                new Promise<void>(resolve => {
                    const time = 1500
                    this.gameScene.time.delayedCall(time, () => {

                        //待機時間後、吹き出しメッセージがある場合は開始
                        if (bubbleTalk) { bubbleTalk.execTalk(); }
                        this.gameScene.events.emit('GAME_INPUT_TRUE');
                        for (const player of this.playerPartyList) { player.state = CharacterState.normal; }
                        resolve();
                    }, [], this.scene);
                    this.gameScene.events.emit('GAME_INPUT_FALSE');
                    this.gameScene.events.emit('FREE_MESSAGE_WINDOW', getItemName + 'を' + getItemNum + '個手に入れた！', time);
                });

                obj.play('chest_open');
                this.soundScene.SE_chestOpen.play();

                //プレイヤーの持ち物を更新
                this.gameScene.getPlayer().stopAnimation();

                //アイテムを持ってない場合、初期化
                if (!this.gameScene.getPlayer().getData(getItemName)) {
                    this.gameScene.getPlayer().setData(getItemName, 0);
                }
                this.gameScene.getPlayer().data.values[getItemName] += getItemNum;

                //idが存在する場合はキャッシュのフラグを更新
                if (obj.getData('id') !== null) {
                    this.gameScene.cache.json.get('savedata').itemboxFlg[obj.getData('id')] = 0;
                }

                //個数を更新
                obj.setData('num', 0);

                //キャッシュを更新
                const cacheDataUpdate = new CacheDataUpdate(this.gameScene);
                cacheDataUpdate.phaserCacheDataUpdate();

                //オブジェクトのインタラクティブを無効化
                obj.setInteractive({ useHandCursor: false });
                obj.off('pointerdown');
            }
        }

    }

    private createLight() {
        if (!this.lightFlg) return;
        return new Promise<void>(async (resolve) => {

            for (const obj of this.lightObjectLayer.objects) {

                //初期値
                let radius = 200;//光の半径
                let color = 0xffffff;//光の色
                let intensity = 1.0;//光の強さ

                for (const property of obj.properties) {
                    if (property.name === 'radius' && property.value !== '') { radius = property.value; }
                    if (property.name === 'color' && property.value !== '') { color = property.value; }
                    if (property.name === 'intensity' && property.value !== '') { intensity = property.value; }
                }

                const light = this.gameScene.lights.addLight(obj.x, obj.y, radius);
                light.setColor(color);
                light.setIntensity(intensity);

                const ellipse = new Phaser.Geom.Ellipse(obj.x, obj.y, 10, 10);

                this.timerEventObj = this.gameScene.time.addEvent({
                    delay: 100,
                    callback: function () {
                        Phaser.Geom.Ellipse.Random(ellipse, light);
                    },
                    callbackScope: this,
                    repeat: -1
                });

                this.light.push(light);
                this.ellipse.push(ellipse);
            }

            if (this.debugFlg) {
                this.playerLight = this.gameScene.lights.addLight(this.player.x, this.player.y, 200);
                this.playerLight.setIntensity(0.5);
                this.playerLightFlg = true;
            }

            this.gameScene.lights.enable()
            this.gameScene.lights.setAmbientColor(0xffffff);

            //タイルマップのプロパティからeffect情報を設定
            const makeTileMap: Phaser.Tilemaps.Tilemap = this.TileMap.getMakeTilemap();
            if (Array.isArray(makeTileMap.properties)) {
                for (const prop of makeTileMap.properties) {
                    if (prop.name === 'ambientColor') {
                        //環境光の色を設定
                        this.gameScene.lights.setAmbientColor(prop.value);
                        //0xffffff
                        //0x222244
                    }
                }
            }
            resolve();
        });
    }

    private createBgRenderTexture() {
        return new Promise<void>(resolve => {

            // 背景専用のRenderTexture（絶対にクリアしない、マップ情報保持用）
            if (this.gameScene.textures.exists('bg_captured_image')) { this.gameScene.textures.removeKey('bg_captured_image'); }

            const width = this.TileMap.getMakeTilemap().widthInPixels;
            const height = this.TileMap.getMakeTilemap().heightInPixels;

            this.bgRenderTexture = this.gameScene.add.renderTexture(0, 0, width, height);
            for (const tilemapLayer of this.TileMap.getTilemapLayerList()) {
                this.bgRenderTexture.draw(tilemapLayer);
            }
            this.bgRenderTexture.saveTexture('bg_captured_image');
            this.bgRenderTexture.setVisible(false);

            resolve();
        });
    }

    private createEffect() {
        const makeTileMap: Phaser.Tilemaps.Tilemap = this.TileMap.getMakeTilemap();

        //タイルマップのプロパティからeffect情報を設定
        if (Array.isArray(makeTileMap.properties)) {
            for (const prop of makeTileMap.properties) {
                if (prop.name === 'fog') {
                    //エフェクトオブジェクトを作成
                    this.createFog(prop.value);
                }
            }
        }
    }

    //霧を作成
    private createFog(fogData: string) {

        // create 内
        const width = this.TileMap.getMakeTilemap().widthInPixels;
        const height = this.TileMap.getMakeTilemap().heightInPixels;

        // 1. 通常の画像ではなく「TileSprite（並べて敷き詰められるスプライト）」として配置
        // 画面サイズより少し大きめにしておくと端が綺麗になります
        const fog = this.gameScene.add.tileSprite(width / 2, height / 2, width, height, 'noise');

        // 2. 霧っぽく見せるための設定
        fog.setBlendMode(Phaser.BlendModes.SCREEN); // 黒背景を透過させて白だけ残す
        fog.setAlpha(0.1);                         // 透明度を下げて「うっすら」にする

        if (fogData === 'Lowest') {
            fog.setDepth(MapLayerDepth.Lowest + 10);
        } else {
            fog.setDepth(MapLayerDepth.Highest);
        }

        // 必要なら少し拡大してノイズの目を粗く（霧っぽく）する
        fog.setScale(1.5);

        // 1. 通常の画像ではなく「TileSprite（並べて敷き詰められるスプライト）」として配置
        // 画面サイズより少し大きめにしておくと端が綺麗になります
        const fog2 = this.gameScene.add.tileSprite(width / 2, height / 2, width, height, 'noise2');

        // 2. 霧っぽく見せるための設定
        fog2.setBlendMode(Phaser.BlendModes.SCREEN); // 黒背景を透過させて白だけ残す
        fog2.setAlpha(0.3);                         // 透明度を下げて「うっすら」にする

        if (fogData === 'Lowest') {
            fog2.setDepth(MapLayerDepth.Lowest + 10);
        } else {
            fog2.setDepth(MapLayerDepth.Highest);
        }

        // 必要なら少し拡大してノイズの目を粗く（霧っぽく）する
        fog2.setScale(1.5);

        // 3. 毎フレーム、テクスチャの表示位置をずらす（スクロール）
        this.gameScene.events.on('update', () => {
            // X方向とY方向に少しずつずらすことで、斜めに流れる霧を表現
            fog.tilePositionX += 0.3;
            fog.tilePositionY += 0.2;
            fog2.tilePositionX += 0.9;
            fog2.tilePositionY += 0.4;
        });

        //マップ外を非表示にするためのマスクを作成
        //以下はbgRenderTextureとBitmapMaskの座標位置を補正するための変換処理
        // キャプチャしたテクスチャ名を使って、位置調整用のダミースプライトを作成する
        // ※座標を「画面の中心」にし、Originを「(0.5, 0.5)」にすることで、Phaserのマスク計算と完全一致させます。
        const maskDummySprite = this.gameScene.add.sprite(width / 2, height / 2, 'bg_captured_image');
        maskDummySprite.setOrigin(0.5, 0.5);
        maskDummySprite.setVisible(false); // 画面には表示しない

        // 3. このダミースプライトをソースにして BitmapMask を作成（型エラーは一切起きません）
        const mapMask = new Phaser.Display.Masks.BitmapMask(this.gameScene, maskDummySprite);

        // 4. 霧にマスクを適用
        fog.setMask(mapMask);
        fog2.setMask(mapMask);
    }

    private createShader() {
        const width = this.TileMap.getMakeTilemap().widthInPixels;
        const height = this.TileMap.getMakeTilemap().heightInPixels;

        //this.gameScene.add.shader('fireball', 400, 300, 800, 600);

        //this.gameScene.add.shader('cloud', width / 2, height / 2, width, height);
        //this.gameScene.add.shader('blueSky', width / 2, height / 2, width, height);
        //this.gameScene.add.shader('nightsky', width / 2, height / 2, width, height);
    }

    private createRendertexture(): Promise<void> {

        /**
         * 水面に映すテクスチャの生成
         * まずフィールドマップはcreateBgRenderTexture()で作成済みかつ削除対象としない。
         * 動き回るキャラクターなどを再描画対象とする。
         * 
         */

        return new Promise<void>(resolve => {

            const width = this.TileMap.getMakeTilemap().widthInPixels;
            const height = this.TileMap.getMakeTilemap().heightInPixels;

            // 1. 【超重要】すでに古い RenderTexture やテクスチャキーが存在している場合は、完全に破棄・消去する
            if (this.renderTexture) {
                this.renderTexture.destroy(); // 既存のオブジェクトを破棄
                this.renderTexture = null;
            }

            // Phaserのテクスチャマネージャー内から古いキー名自体を消去する
            if (this.gameScene.textures.exists('char_captured_image')) { this.gameScene.textures.removeKey('char_captured_image'); }

            // 2. 毎フレーム更新・シェーダー渡し用のメインRenderTexture
            this.renderTexture = this.gameScene.add.renderTexture(0, 0, width, height);

            // 初回の描画 (背景は描画せず、キャラクターのみを上下反転させて描画)
            const originalScaleY = this.player.scaleY;
            this.player.scaleY *= -1; // 上下反転

            // 足元で反射が繋がるように、Y座標をキャラの高さ分下にズラして描画
            this.renderTexture.draw(this.player, this.player.x, this.player.y + this.player.displayHeight);

            this.player.scaleY = originalScaleY; // 元に戻す

            // この画像キーでシェーダーがキャラクターのテクスチャを参照します
            this.renderTexture.saveTexture('char_captured_image');
            this.renderTexture.setVisible(false);

            this.renderTextureUpdateFlg = true;

            resolve();
        });
    }

    private async createWaterSurface() {
        const makeTileMap: Phaser.Tilemaps.Tilemap = this.TileMap.getMakeTilemap();

        //タイルマップのプロパティからeffect情報を設定
        if (Array.isArray(makeTileMap.properties)) {
            for (const prop of makeTileMap.properties) {
                if (prop.name === 'WaterSurface') {

                    // タイルマップから解像度を取得
                    const width = this.TileMap.getMakeTilemap().widthInPixels;
                    const height = this.TileMap.getMakeTilemap().heightInPixels;

                    const frag = `
                        #ifdef GL_ES
                        precision mediump float;
                        #endif

                        uniform float time;
                        uniform vec2 resolution;
                        uniform sampler2D iChannel0; // bg_captured_image (背景)
                        uniform sampler2D iChannel1; // char_captured_image (キャラクター)

                        // Phaser 3から自動的に渡される、このオブジェクト固有の正確なUV座標
                        varying vec2 outTexCoord; 

                        // sinを使わない高精度2Dハッシュ
                        float hash(vec2 p) {
                            vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
                            p3 += dot(p3, p3.yzx + 33.33);
                            return fract((p3.x + p3.y) * p3.z);
                        }

                        // 2Dバリューノイズ
                        float noise(vec2 p) {
                            vec2 i = floor(p);
                            vec2 f = fract(p);
                            vec2 u = f * f * (3.0 - 2.0 * f);
                            return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                                    mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
                        }

                        // 波の高さを計算するマルチオクターブFBM
                        float getWaveHeight(vec2 uv) {
                            vec2 uv1 = uv * 2.0 + vec2(time * 0.08, time * 0.12);
                            vec2 uv2 = uv * 4.0 - vec2(time * 0.15, time * 0.05);
                            vec2 uv3 = uv * 8.0 + vec2(time * 0.20, -time * 0.10);
                            
                            float h = noise(uv1) * 0.5 + noise(uv2) * 0.3 + noise(uv3) * 0.2;
                            return h;
                        }

                        void main(void) {
                            // 【修正】画面ピクセル座標ではなく、オブジェクト固有の正確なUVを使用
                            vec2 uv = outTexCoord;
                            
                            // 【フェード処理】上側（uv.yが小さい領域）ほど水面エフェクトを非表示にします。
                            const float fadeStart = 0.0;
                            const float fadeEnd = 0.30;
                            float fade = smoothstep(fadeStart, fadeEnd, uv.y);
                            
                            // 【波の大きさを一定に保つためのスケール補正】
                            // ★ここで波の大きさを自由に調整できます★
                            // baseScale (1000.0) を基準サイズとしています。
                            // ・数値を小さくする（例: 500.0） → 波が大きく（粗く）なります。
                            // ・数値を大きくする（例: 2000.0） → 波が小さく（細かく）なります。
                            vec2 baseScale = vec2(1000.0, 1000.0);
                            vec2 scale = resolution / baseScale;

                            // 遠近感（パース）の計算
                            float perspective = 1.0 / (uv.y * 2.0 + 0.1);
                            
                            // scale を掛けることで、マップが広くなっても波が引き延ばされずに一定の大きさを保ちます
                            vec2 waveUV = vec2(uv.x * 4.0 * scale.x, (1.0 - uv.y) * 10.0 * scale.y * perspective);
                            
                            // 動的法線ベクトル（Normal）の計算
                            vec2 eps = vec2(0.015, 0.0);
                            float hL = getWaveHeight(waveUV - eps.xy);
                            float hR = getWaveHeight(waveUV + eps.xy);
                            float hD = getWaveHeight(waveUV - eps.yx);
                            float hU = getWaveHeight(waveUV + eps.yx);
                            
                            vec3 normal = normalize(vec3((hL - hR), (hD - hU), 0.12));

                            // 背景画像（マップ）の反射位置オフセットと屈折
                            float offsetY_bg = 0.009;
                            vec2 distortion_bg = normal.xy * (0.01 / scale) * (uv.y + 0.1);
                            vec2 distortedUV_bg = clamp(uv + distortion_bg + vec2(0.0, offsetY_bg), 0.0, 1.0);
                            vec4 bgTexColor = texture2D(iChannel0, distortedUV_bg);
                            
                            // キャラクター画像の反射位置オフセットと屈折
                            // （テクスチャに描画する時点ですでに反転＆足元へズラしているため、ここでのオフセットはほぼ0でOKです）
                            float offsetY_char = 0.0;
                            
                            // ★重要★
                            // Phaserのシェーダー全体が上下反転しているため、キャラだけ元の位置（足元）に戻すためにUVのYを反転させます
                            vec2 charUV = vec2(uv.x, 1.0 - uv.y);
                            
                            vec2 distortion_char = normal.xy * (0.03 / scale) * (uv.y + 0.1);
                            vec2 distortedUV_char = clamp(charUV + distortion_char + vec2(0.0, offsetY_char), 0.0, 1.0);
                            vec4 charTexColor = texture2D(iChannel1, distortedUV_char);
                            
                            // 背景の上にキャラクター（アルファブレンド）を重ねる
                            vec4 texColor = mix(bgTexColor, charTexColor, charTexColor.a);
                            
                            // 水面らしい青・グリーンのグラデーション色を設定
                            vec3 waterBaseColor = mix(vec3(0.02, 0.12, 0.32), vec3(0.05, 0.42, 0.58), uv.y);
                            
                            // 水自体の色と背景色のブレンド（上側ほど背景テクスチャをそのまま表示し、水のエフェクトを消す）
                            vec3 finalColor = mix(texColor.rgb, waterBaseColor, 0.40 * fade);
                            
                            // スペキュラーハイライトも上側でフェードアウトさせます
                            vec3 lightDir = normalize(vec3(0.0, 1.0, 0.7)); 
                            vec3 viewDir = vec3(0.0, 0.0, 1.0);
                            vec3 halfDir = normalize(lightDir + viewDir);
                            
                            float spec = pow(max(dot(normal, halfDir), 0.0), 32.0);
                            
                            float waveCrest = max(0.0, normal.y * 2.0);
                            vec3 specularColor = vec3(1.0, 1.0, 1.0) * spec * 2.5 * waveCrest * fade;
                            
                            gl_FragColor = vec4(finalColor + specularColor, 1.0);
                        }
                    `;

                    const base = new Phaser.Display.BaseShader('simpleTexture', frag);

                    // 背景とキャラの2つのテクスチャを配列で渡す（それぞれ iChannel0, iChannel1 にバインドされる）
                    const shader = this.gameScene.add.shader(base, width / 2, height / 2, width, height, ['bg_captured_image', 'char_captured_image']);

                    const cropRectMask = this.gameScene.add.graphics();
                    cropRectMask.x = 0;//座標初期値を設定
                    cropRectMask.y = 0;
                    cropRectMask.fillStyle(Phaser.Display.Color.HexStringToColor('#ffffff').color);
                    cropRectMask.fillRect(0, 0, width, 500);
                    cropRectMask.setVisible(false);//非表示にする

                    shader.setMask(cropRectMask.createGeometryMask().setInvertAlpha());
                    shader.setDepth(MapLayerDepth.Lowest + 10);//MapLayerDepth.Low

                }
            }
        }
    }

    private setLight2DPipeline() {
        if (!this.lightFlg) return
        for (const tp of this.TileMap.getTilemapLayerList()) {
            tp.setPipeline('Light2D');
        }
        for (const chestSpriteObject of this.chestSpriteObjects) {
            chestSpriteObject.setPipeline('Light2D');
        }
    }

    private updateRenderTexture() {
        if (!this.renderTextureUpdateFlg || !this.renderTexture || !this.bgRenderTexture) return;

        // 1. メインのRenderTextureをクリア（前回のプレイヤーの軌跡を完全に消す）
        this.renderTexture.clear();

        // 2. 静的な背景は別のテクスチャとして渡すため、ここでは描画しない

        // 3. 最新の座標でプレイヤーを上下反転させて描画
        const originalScaleY = this.player.scaleY;
        this.player.scaleY *= -1; // 上下反転

        // 足元で反射が繋がるように、Y座標をキャラの高さ分下にズラして描画
        this.renderTexture.draw(this.player, this.player.x, this.player.y + this.player.displayHeight);

        this.player.scaleY = originalScaleY; // 元に戻す
    }
}