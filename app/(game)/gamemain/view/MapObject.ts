import { GameScene } from "../../lib/SceneTypes";
import { EventObjState, ObjState, CharacterState, FieldData } from "../../lib/FieldTypes";
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

    constructor(scene: GameScene) {
        super(scene);
        this.gameScene = scene;
        this.addToUpdateList();
        this.dataDefinition = new DataDefinition();
        this.soundScene = this.gameScene.scene.get('Sound') as Sound;
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

        this.createPlayer(sceneKey);
        this.createNPC();
        this.createObject();
        this.setupInput();

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

    private createPlayer(sceneKey: string) {
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

            this.playerPartyList.push(player3);
        }

        // 状態管理クラスのパーティリストを更新
        gameStateManager.setPlayerPartyList(this.playerPartyList);
    }

    private createNPC() {

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
    }

    public createSprite(npcType: string, spritetype: string, gameScene: GameScene, x: number, y: number, spriteSheetKey: string, name: string, initStandKey: string, imageKey: string, bubbleTalkKey: string) {
        if (spritetype === '0404') { return new SpriteType_4x4(gameScene, x, y, npcType, spriteSheetKey, name, initStandKey, imageKey, bubbleTalkKey); }
        if (spritetype === '0304') { return new SpriteType_3x4(gameScene, x, y, npcType, spriteSheetKey, name, initStandKey, imageKey, bubbleTalkKey); }
    }

    private createObject() {
        const makeTileMap: Phaser.Tilemaps.Tilemap = this.TileMap.getMakeTilemap();

        // オブジェクトレイヤーの存在チェックを行い、警告を回避する
        let eventObjects: Phaser.GameObjects.GameObject[] = [];
        let clickEventObjects: Phaser.GameObjects.GameObject[] = [];
        let mapMoveObjects: Phaser.GameObjects.GameObject[] = [];
        let chestSpriteObjects: Phaser.GameObjects.GameObject[] = [];
        let treeGlassSpriteObjects: Phaser.GameObjects.GameObject[] = [];
        let treeStemSpriteObjects: Phaser.GameObjects.GameObject[] = [];

        if (makeTileMap.getObjectLayer('EVENT')) {
            eventObjects = makeTileMap.createFromObjects('EVENT', {}, false);
        }
        if (makeTileMap.getObjectLayer('CLICKEVENT')) {
            clickEventObjects = makeTileMap.createFromObjects('CLICKEVENT', {}, false);
        }
        if (makeTileMap.getObjectLayer('MAPMOVE')) {
            mapMoveObjects = makeTileMap.createFromObjects('MAPMOVE', {}, false);
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
            this.settingEventObject(obj as Phaser.Physics.Arcade.Sprite);
        }
        for (const obj of clickEventObjectStaticGroupChildren) {
            this.settingClickEventObject(obj as Phaser.Physics.Arcade.Sprite);
            this.clickEventObjects.push(obj as Phaser.Physics.Arcade.Sprite);
        }
        for (const obj of mapMoveObjectStaticGroupChildren) {
            this.settingMapMoveObject(obj as Phaser.Physics.Arcade.Sprite);
        }

        for (const obj of chestSpriteObjectStaticGroupChildren) {
            this.settingChestSpriteObject(obj as Phaser.Physics.Arcade.Sprite, 'tex_Chests');
            this.chestSpriteObjects.push(obj as Phaser.Physics.Arcade.Sprite);
        }
        for (const obj of treeGlassSpriteObjectStaticGroupChildren) {
            this.settingTreeGlassSpriteObjects(obj as Phaser.Physics.Arcade.Sprite);
        }
        for (const obj of treeStemSpriteObjectStaticGroupChildren) {
            this.settingTreeStemSpriteObjects(obj as Phaser.Physics.Arcade.Sprite);
        }



        // this.gameScene.lights.addLight(this.getPlayer().x, this.getPlayer().y, 2200).setIntensity(2);
        // this.gameScene.lights.enable().setAmbientColor(0x555555);
        //this.gameScene.lights.addLight(0, 100, 140).setColor(0xff0000).setIntensity(3.0);

    }

    //イベントオブジェクト作成
    private settingEventObject(obj: Phaser.Physics.Arcade.Sprite): void {

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
    }

    private settingClickEventObject(obj: Phaser.Physics.Arcade.Sprite): void {

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
    }

    private settingMapMoveObject(obj: Phaser.Physics.Arcade.Sprite): void {

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
    }

    private settingChestSpriteObject(obj: Phaser.Physics.Arcade.Sprite, imageKey: string) {

        //id無し宝箱はランダム生成
        if (obj.getData('id') == null) {
            if (new Phaser.Math.RandomDataGenerator().between(0, 2) >= 1) {//2/3の確率で出現
                //ランダム生成した宝箱の場合は、配置しない（削除する）
                obj.destroy();
                return;
            }
        }

        //衝突判定の追加
        for (const player of this.playerPartyList) {
            this.gameScene.physics.add.collider(player, obj);
        }

        //深度設定
        obj.setDepth(obj.y);

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

            //クリックイベント
            obj.on('pointerdown', async () => {
                this.execOpenChest(obj);
            })

            // シーン終了時にイベントを破棄
            this.gameScene.events.once('shutdown', () => {
                obj.destroy();
            });
        }
    }

    //------------------------オブジェクトサンプル
    private settingTreeGlassSpriteObjects(obj: Phaser.Physics.Arcade.Sprite) {
        obj.setDepth(this.gameScene.getTilemap().getMakeTilemap().heightInPixels > this.gameScene.getTilemap().getMakeTilemap().widthInPixels ? this.gameScene.getTilemap().getMakeTilemap().heightInPixels : this.gameScene.getTilemap().getMakeTilemap().widthInPixels);

        obj.setOrigin(0.5, 1);

        obj.setPosition(obj.x, obj.y + 96 / 2);

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

}