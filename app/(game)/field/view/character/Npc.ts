import { FieldScene } from "@/app/(game)/lib/SceneTypes";
import { CharacterState, MapLayerDepth } from "@/app/(game)/lib/FieldTypes";
import { BaseSprite } from "@/app/(game)/core/BaseSprite";
import { FieldObjectCheck } from "@/app/(game)/util/FieldObjectCheck";
import { GameStateManager } from "@/app/(game)/core/GameStateManager";
import { State } from '@/app/(game)/lib/StateTypes';
import { InputManager } from '@/app/(game)/core/input/InputManager';
import { Subscription } from 'rxjs';
import { SearchEnemyData } from '@/app/(game)/Data/SearchEnemyData';
import { Player } from './Player';
import { Bubble } from "@/app/(game)/util/Effect/Bubble";

export class Npc extends BaseSprite {
    private npcType: string;
    private inputManager: InputManager;
    protected bubbleTalkKey;
    private subs = new Subscription();

    protected spriteObjList: Phaser.Physics.Arcade.Sprite[] = [];
    private graphicsObjList: Phaser.GameObjects.Graphics[] = [];
    private energyGauge: Phaser.GameObjects.Graphics;
    private energyGaugeBack: Phaser.GameObjects.Graphics;

    private delay: number;

    private deleteDelay = 30;

    public body: Phaser.Physics.Arcade.Body

    private makeTilemapData: Phaser.Tilemaps.Tilemap
    private collisionLayer: Phaser.Tilemaps.TilemapLayer

    private cropRectMask: Phaser.GameObjects.Graphics;
    private GeometryMask: Phaser.Display.Masks.GeometryMask;

    constructor(
        fieldScene: FieldScene,
        x: number,
        y: number,
        npcType: string,
        spriteSheetKey: string,
        npcNameCode: string,
        initStandKey: string,
        imageKey: string,
        bubbleTalkKey: string
    ) {
        super(fieldScene, x, y, spriteSheetKey, initStandKey);
        this.fieldScene = fieldScene;
        this.npcType = npcType;
        this.state = CharacterState.normal;
        if (npcType === 'event') {
            this.state = CharacterState.event;
            //this.setVisible(false);
        }
        this.name = npcNameCode;
        this.bubbleTalkKey = bubbleTalkKey;

        this.setData('NpcType', npcType)
        this.setData('ImageKey', imageKey)
    }

    preUpdate(time: number, delta: number) {
        super.preUpdate(time, delta);
        this.setDepth(MapLayerDepth.High + this.y);
        this.updateRandomMoveToPosition();
        this._setInput();
        this.energyHP();
        this.delete();

        //キャラクターの下側を非表示にするマスク
        //this.updateCharacterShapesMask();
    }

    init() {
        this.scene.physics.add.existing(this);//物理属性を有効、このゲームオブジェクトにArcade Physics bodyが設定される。
        (this.body as Phaser.Physics.Arcade.Body)!.setImmovable(true);//Body の不動プロパティを設定、物理演算されなくなる。
        //不動についてはbody.setPushable(false);というのもあるらしい
        this._collideSetting();
        this.statusSetting();
        this.bubbleTalkSetting();
    };

    private energyHP() {
        if (this.npcType !== 'enemy') return;

        //初回作成時
        if (!this.energyGauge) {
            this.energyGauge = this.fieldScene.add.graphics();
            this.energyGauge.name = 'energyGauge';
            this.energyGaugeBack = this.fieldScene.add.graphics();
            this.energyGaugeBack.name = 'energyGaugeBack'
            this.graphicsObjList.push(this.energyGauge);
            this.graphicsObjList.push(this.energyGaugeBack);
        };
        this.energyGauge.setDepth(this.depth);
        this.energyGauge.clear();//再描画のためクリア
        this.energyGaugeBack.setDepth(this.depth - 1);
        this.energyGaugeBack.clear();//再描画のためクリア

        const rectR = 4;//角の丸みの半径
        const maxWidth = 40 + rectR * 2;
        const height = 4 + rectR * 2;

        const width = maxWidth * this.getData("HP") / this.getData("MaxHP");
        //console.log(this.getData("HP") / this.getData("MaxHP") * 100);

        this.energyGauge.x = this.x - maxWidth / 2 + rectR;//座標初期値を設定テキストの左上
        this.energyGauge.y = this.y - 30;
        this.energyGaugeBack.x = this.x - maxWidth / 2 + rectR;
        this.energyGaugeBack.y = this.y - 30;

        this.energyGaugeBack.fillStyle(0x000000, 1);

        if (this.getData("HP") / this.getData("MaxHP") <= 4 / 10) {
            this.energyGauge.fillStyle(0xdc143c, 1);
        } else {
            this.energyGauge.fillStyle(0x3cb371, 1);
        }

        this.energyGauge.lineStyle(2, 0x000000);

        this.energyGaugeBack.fillRoundedRect(-1 * rectR, -1 * rectR, maxWidth, height, rectR);
        this.energyGauge.fillRoundedRect(-1 * rectR, -1 * rectR, width, height, rectR);
        this.energyGauge.strokeRoundedRect(-1 * rectR, -1 * rectR, maxWidth, height, rectR);
    }

    private statusSetting() {
        if (this.npcType === 'enemy') {
            const searchEnemyData = new SearchEnemyData(this.fieldScene.cache.json);
            const imageKey = this.getData('ImageKey');
            const enemyData = searchEnemyData.getEnemyData(imageKey);

            if (enemyData) {
                this.setData({
                    level: enemyData.level,
                    HP: enemyData.HP,
                    MP: enemyData.MP,
                    MaxHP: enemyData.MaxHP,
                    MaxMP: enemyData.MaxMP,
                    Attack: enemyData.Attack,
                    Guard: enemyData.Guard,
                    Speed: enemyData.Speed,
                    gold: enemyData.gold
                });
                this.setData('name', enemyData.name);
            }
        }
    }

    public setBubbleTalkKey(bubbleTalkKey: string) { this.bubbleTalkKey = bubbleTalkKey; }

    public bubbleTalkSetting() {

        //tiledでtalkデータを設定する事
        if (this.bubbleTalkKey) {

            //クリック時の動作設定
            this.on('pointerdown', () => { this.execNpcTalk(); });

            //吹き出しを設定
            const bubbleSprite = new Bubble(this.fieldScene, this);
            bubbleSprite.execute();
        }
    }

    private execNpcTalk() {
        if (this.state === CharacterState.talking) return;

        const manager = GameStateManager.getInstance();
        manager.updateState({ state: State.BUBBLE_TALK, eventObj: this }, this.bubbleTalkKey);

        //キャラの向きをチェック
        const player = manager.currentPlayerPartyList[0] as Player;
        const fieldObjChk = new FieldObjectCheck(player, this);
        const playerDirection = fieldObjChk.getObjectDirection().object1Direction;

        //キャラの向きを設定
        if (playerDirection === 'left') {
            player.setStandFrame(player.getAnimationKey().standLeft);
            this.turnAround();
        } else if (playerDirection === 'right') {
            player.setStandFrame(player.getAnimationKey().standRight);
            this.turnAround();
        } else if (playerDirection === 'up') {
            player.setStandFrame(player.getAnimationKey().standUp);
            this.turnAround();
        } else if (playerDirection === 'down') {
            player.setStandFrame(player.getAnimationKey().standDown);
            this.turnAround();
        }
    }

    public setInputManager(inputManager: InputManager) {
        this.inputManager = inputManager;

        // decideButtonの購読を追加
        if (this.bubbleTalkKey) {
            this.subs.add(this.inputManager.decideButton$.subscribe(() => {
                const manager = GameStateManager.getInstance();
                if (manager.currentState === State.BUBBLE_TALK || manager.currentState === State.EVENT || manager.currentState === State.MENU || manager.currentState === State.BATTLE) {
                    // 会話不可の状態
                } else {
                    // player と target の矩形が重なっているか
                    const player = manager.currentPlayerPartyList[0] as Player;
                    if (Phaser.Geom.Intersects.RectangleToRectangle(this.getBounds(), player.getBounds()) &&
                        this.state === CharacterState.normal) {

                        this.execNpcTalk();
                    }
                }
            }));
        }

        // オブジェクト破棄時に購読解除
        this.once('destroy', () => {
            this.subs.unsubscribe();
        });
    }

    //enemy衝突
    _collideSetting() {

        //キャラクターやマップ作成後に実行する事
        if (this.npcType === 'enemy') {

            const player = GameStateManager.getInstance().currentPlayerPartyList[0] as Player;

            //オブジェクトに衝突した場合、戦闘を発生させる
            this.fieldScene.physics.add.world.addCollider(this, player, () => {
                //Presenterに通知
                this.fieldScene.events.emit('BATTLE', { usePatern: 'normal', fieldHitEnemy: this, canNotRunaway: false });
            }, undefined, this.fieldScene);

        } else {
            //this.fieldScene.physics.add.collider(this, this.fieldScene.getPlayer());
        }
    }

    /**
    * 移動先の座標を作成する
    * 
    * ※イベントなどで座標変更した場合は座標をnullに設定しないと動かなくなる。initMoveToPosition()を使用する事。
    * ※NPCは斜め移動無し。
    */
    private updateRandomMoveToPosition() {

        //イベント中の場合は処理しない
        if (this.state === CharacterState.event) return;

        const player = GameStateManager.getInstance().currentPlayerPartyList[0] as Player;

        //プレイヤーとの距離が40未満の場合は処理しない
        if (Phaser.Math.Difference(this.x, player.x) < 40 && Phaser.Math.Difference(this.y, player.y) < 40) return;

        //値が設定されている場合は移動中のため処理しない
        if (this.moveToPositionX && this.moveToPositionY) return;

        const makeTileMap: Phaser.Tilemaps.Tilemap = this.makeTilemapData;
        const collisionLayer: Phaser.Tilemaps.TilemapLayer = this.collisionLayer;
        const move = new Phaser.Math.RandomDataGenerator().between(-20, 20);//指定範囲の間でランダムな整数を返す
        this.delay = new Phaser.Math.RandomDataGenerator().between(100, 200);//停止時間をランダムで設定

        //値が0の場合は処理しない
        if (move === 0) return;

        let checkX = null;
        let checkY = null;

        if (move < 0 && move % 2 === 0) {//値が負かつ偶数の場合、左方向
            checkX = this.x + (move);//移動先座標を設定
            checkY = this.y;
            //移動先の左上左下の座標にcollisionタイルが存在する場合は移動中止
            if (makeTileMap.hasTileAtWorldXY(checkX - (this.body!.halfWidth + 1), (checkY + this.body!.halfHeight), undefined, collisionLayer)
                || makeTileMap.hasTileAtWorldXY(checkX - (this.body!.halfWidth + 1), (checkY - this.body!.halfHeight), undefined, collisionLayer)) {
                //console.log("左　衝突", checkX, checkY)
                checkX = null;
                checkY = null;
                return;
            }
        } else if (move > 0 && move % 2 === 0) {//値が正かつ偶数の場合、右方向
            checkX = this.x + (move);
            checkY = this.y;
            //移動先の右上右下の座標にcollisionタイルが存在する場合は移動中止
            if (makeTileMap.hasTileAtWorldXY(checkX + (this.body!.halfWidth + 1), (checkY + this.body!.halfHeight), undefined, collisionLayer)
                || makeTileMap.hasTileAtWorldXY(checkX + (this.body!.halfWidth + 1), (checkY - this.body!.halfHeight), undefined, collisionLayer)) {
                //console.log("右　衝突", checkX, checkY)
                checkX = null;
                checkY = null;
                return;
            }
        } else if (move < 0 && move % 2 !== 0) {//値が負かつ奇数の場合、上方向
            checkX = this.x;
            checkY = this.y + (move);//移動先座標を設定
            //移動先の左上右上の座標にcollisionタイルが存在する場合は移動中止
            if (makeTileMap.hasTileAtWorldXY((checkX - this.body!.halfWidth), checkY - (this.body!.halfHeight + 1), undefined, collisionLayer)
                || makeTileMap.hasTileAtWorldXY((checkX + this.body!.halfWidth), checkY - (this.body!.halfHeight + 1), undefined, collisionLayer)) {
                //console.log("上　衝突", checkX, checkY)
                checkX = null;
                checkY = null;
                return;
            }
        } else if (move > 0 && move % 2 !== 0) {//値が正かつ奇数の場合、下方向
            checkX = this.x;
            checkY = this.y + (move);//移動先座標を設定
            //移動先の左下右下の座標にcollisionタイルが存在する場合は移動中止
            if (makeTileMap.hasTileAtWorldXY((checkX - this.body!.halfWidth), checkY + (this.body!.halfHeight + 1), undefined, collisionLayer)
                || makeTileMap.hasTileAtWorldXY((checkX + this.body!.halfWidth), checkY + (this.body!.halfHeight + 1), undefined, collisionLayer)) {
                //console.log("下　衝突", checkX, checkY)
                checkX = null;
                checkY = null;
                return;
            }
        }
        //console.log("NPC" + checkX, checkY)
        this.setMoveToPosition(checkX!, checkY!, 300, true, 2000);
    }

    //オーバーライド
    override updateStopWalk() {

        if (this.moveToPositionX === null || this.moveToPositionY === null) return;


        //this.delay = this.random.between(0, 2);//デバッグ用

        //移動先座標との差が1未満の場合は停止
        if (Phaser.Math.Difference(this.moveToPositionX, this.x) < 1 && Phaser.Math.Difference(this.moveToPositionY, this.y) < 1) {
            this.body!.setVelocity(0, 0);
            this.moveDirection = this.walkStop;
            this.delay--;
            if (this.delay <= 0) {
                this.moveToPositionX = null;//移動先の値をnullに設定
                this.moveToPositionY = null;
            }
        }
        const player = GameStateManager.getInstance().currentPlayerPartyList[0] as Player;
        //プレイヤーとの距離が40未満の場合は停止
        if (Phaser.Math.Difference(this.x, player.x) < 40 && Phaser.Math.Difference(this.y, player.y) < 40) {
            this.body.setVelocity(0, 0);
            this.moveDirection = this.walkStop;
            this.delay--;
            if (this.delay <= 0) {
                this.moveToPositionX = null;//移動先の値をnullに設定
                this.moveToPositionY = null;
            }
        }
    }

    _setInput() {
        //プレイヤーとの距離が100未満 かつ 吹き出し会話中では無い かつ 吹き出し会話が設定されている場合はマウスクリックを設定
        const player = GameStateManager.getInstance().currentPlayerPartyList[0] as Player;
        if (Phaser.Math.Difference(this.x, player.x) < 100 && Phaser.Math.Difference(this.y, player.y) < 100
            && this.state === CharacterState.normal && this.bubbleTalkKey) {
            //this.setInteractive();
            this.setInteractive({ useHandCursor: true });
        } else {
            this.disableInteractive();
        }
    }

    //キャラクターを逆向きに変更する
    public turnAround() {
        const player = GameStateManager.getInstance().currentPlayerPartyList[0] as Player;
        if (player.getAnimationKey().standframe === player.getAnimationKey().standLeft) {
            this.standframe = this.standRight;
        } else if (player.getAnimationKey().standframe === player.getAnimationKey().standRight) {
            this.standframe = this.standLeft;
        } else if (player.getAnimationKey().standframe === player.getAnimationKey().standUp) {
            this.standframe = this.standDown;
        } else if (player.getAnimationKey().standframe === player.getAnimationKey().standDown) {
            this.standframe = this.standUp;
        }
    }

    private delete() {
        if (this.data) {
            if (this.npcType === 'enemy') {
                if (this.data.values.HP <= 0) {
                    this.data.values.HP = 0;
                    this.fieldScene.time.delayedCall(this.deleteDelay, () => {
                        this.graphicsObjList.forEach(obj => {
                            obj.destroy();
                        })
                        this.destroy();
                    }, undefined, this.fieldScene);
                }
            }
        }
    }

    //このスプライトを削除
    public deleteCharacter() {
        this.fieldScene.time.delayedCall(this.deleteDelay, () => {

            //スプライト部品を削除（影や吹き出し等）
            this.spriteObjList.forEach(obj => {
                obj.destroy();
            })

            //このスプライトが持つオブジェクトを全て削除
            this.graphicsObjList.forEach(obj => {
                obj.destroy();
            })
            //このスプライトを削除
            this.destroy();
        }, undefined, this.fieldScene);
    }

    public setMakeTilemapData(makeTilemapData: Phaser.Tilemaps.Tilemap) { this.makeTilemapData = makeTilemapData; }
    public setCollisionLayer(collisionLayer: Phaser.Tilemaps.TilemapLayer) { this.collisionLayer = collisionLayer; }

    //キャラの一部を非表示にするマスク
    private updateCharacterShapesMask() {

        const makeTilemap: Phaser.Tilemaps.Tilemap = this.makeTilemapData;

        //以下のチェックはGraphicsの処理を減らすため、対象タイルマップの存在有無チェックを行っていたが、一つのGraphicsに複数描画する分には殆ど処理は重くならないため不要とする
        // if (!makeTilemap.getTileAtWorldXY(this.x + this.tileSize / 2 * this.scale, this.y - this.tileSize / 2 * this.scale, false, undefined, mapName) &&
        //     !makeTilemap.getTileAtWorldXY(this.x + this.tileSize / 2 * this.scale, this.y + this.tileSize / 2 * this.scale, false, undefined, mapName) &&
        //     !makeTilemap.getTileAtWorldXY(this.x - this.tileSize / 2 * this.scale, this.y - this.tileSize / 2 * this.scale, false, undefined, mapName) &&
        //     !makeTilemap.getTileAtWorldXY(this.x - this.tileSize / 2 * this.scale, this.y + this.tileSize / 2 * this.scale, false, undefined, mapName) &&
        //     !makeTilemap.getTileAtWorldXY(this.x, this.y - maskHeight, false, undefined, mapName)) {
        //     this.clearMask();
        //     return;
        // }

        //更新前にマスクを削除
        if (this.GeometryMask) { this.clearMask(); }

        //初回作成時
        if (!this.cropRectMask) { this.cropRectMask = this.scene.add.graphics(); };

        //デバッグ用、trueの場合は非表示
        this.cropRectMask.setVisible(false);

        this.cropRectMask.setDepth(5000);
        this.cropRectMask.clear();//再描画のためクリア

        const whiteColor = Phaser.Display.Color.HexStringToColor('#ffffff').color;
        this.cropRectMask.fillStyle(whiteColor);

        //キャラクターの足元を基準とする、値はタイルサイズ32を基準
        const maskY = this.y + 32 / 2;

        //四角形オブジェクト作成
        for (const obj of makeTilemap.objects) {
            if (obj.name === "MASK_RECT") {
                for (const rect of obj.objects) {
                    for (const property of rect.properties) {
                        if (property.name === "height") {
                            this.cropRectMask.fillRect(
                                rect.x!,
                                maskY - property.value! > rect.y! ? maskY - property.value! : rect.y!,
                                rect.width!,
                                (rect.y! + rect.height! - maskY + property.value!) < 0 ? 0 : (rect.y! + rect.height! - maskY + property.value!)
                            )
                        }
                    }
                }
            }
        }

        //多角形オブジェクト作成
        for (const obj of makeTilemap.objects) {
            if (obj.name === "MASK_POLYGON") {
                for (const polygon of obj.objects) {
                    for (const property of polygon.properties) {
                        if (property.name === "height") {
                            if (polygon.polygon) {
                                // 1. 座標を修正してポイント配列を作成（前回のアドバイス通り）
                                const points = polygon.polygon.map(p => ({
                                    x: (polygon.x || 0) + p.x,
                                    y: (polygon.y || 0) + p.y
                                }));

                                // 2. ポリゴンを「this.y 以下」にクリッピングして描画する
                                // ※ GeometryMaskはステンシルバッファで動作するためERASEブレンドモードが効かない
                                //    そのため、描画する領域自体を数学的に絞り込む（Sutherland-Hodgman法）
                                const clippedPoints = clipPolygonToBottom(points, maskY - property.value!);
                                if (clippedPoints.length >= 3) {
                                    this.cropRectMask.fillStyle(0xffffff, 1);
                                    this.cropRectMask.setBlendMode(Phaser.BlendModes.NORMAL);
                                    this.cropRectMask.fillPoints(clippedPoints, true);
                                }
                            }
                        }
                    }
                }
            }

            // //図形を作成
            this.cropRectMask.fillPath();

            //マスク作成のためcreateGeometryMaskを作成し、マスク処理を反転
            this.GeometryMask = this.cropRectMask.createGeometryMask();
            this.GeometryMask.setInvertAlpha();
            this.setMask(this.GeometryMask);
        }
    }
}

/**
 * Sutherland-Hodgman法でポリゴンを「y >= clipY」の半平面にクリッピングする
 * キャラクターのY座標以下の部分だけを残すために使用
 */
function clipPolygonToBottom(points: { x: number; y: number }[], clipY: number): { x: number; y: number }[] {
    const result: { x: number; y: number }[] = [];
    const n = points.length;

    for (let i = 0; i < n; i++) {
        const current = points[i];
        const next = points[(i + 1) % n];

        const currentInside = current.y >= clipY;
        const nextInside = next.y >= clipY;

        if (currentInside) {
            result.push(current);
        }

        // エッジがクリップ境界（y = clipY）を跨ぐ場合は交点を追加
        if (currentInside !== nextInside) {
            const t = (clipY - current.y) / (next.y - current.y);
            result.push({
                x: current.x + t * (next.x - current.x),
                y: clipY
            });
        }
    }

    return result;
}
