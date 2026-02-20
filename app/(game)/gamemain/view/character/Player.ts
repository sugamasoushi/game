import { BaseSprite } from "@/app/(game)/core/BaseSprite";
import { GameScene, State } from "@/app/(game)/lib/types";
import { CharacterState } from "@/app/(game)/lib/types";
import { GameStateManager } from '../../../GameAllState/GameStateManager';

export class Player extends BaseSprite {
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;

    public body: Phaser.Physics.Arcade.Body;
    private frameRate: number = 10;
    private playerDefaultVelocity: number = 300;
    private tileSize: number = 32;
    private depthValue: number | null = null;
    private cropRectMask: Phaser.GameObjects.Graphics;
    private cropRectMask2: Phaser.Display.Masks.GeometryMask;

    constructor(scene: GameScene, x: number, y: number, spriteSheetKey: string, initStandKey: string) {
        super(scene, x, y, spriteSheetKey, initStandKey);
        this.gameScene = scene;
        this.name = 'player';
        
        //物理属性を有効、このゲームオブジェクトにArcade Physics bodyが設定される。
        this.gameScene.physics.add.existing(this);
        //(this.body as Phaser.Physics.Arcade.Body)!.setImmovable(true);//衝突処理されなくなる。

        //ボディの当たり判定、座標関係を変更
        this.setBodySize(32, 32, false);//当たり判定を32*32に設定
        this.setOffset(0, 8);//当たり判定の左上の位置を変更
        this.setDisplayOrigin(16, 24);//当たり判定の中心位置を変更

        this._animationSetting(spriteSheetKey);
    }

    //オブジェクトのアニメーションを更新
    preUpdate(time: number, delta: number) {
        super.preUpdate(time, delta);
        this._updateKeyWalk();
        this._updateStopWalk();
        this._updateRectMask();
    }

    //キー入力による移動
    //※本来はinputmanagerのキー管理を通したいが、難しそうなのでこのまま使用
    _updateKeyWalk() {
        if (!this.body) return;
        if (this.state !== CharacterState.normal) return;

        //状態管理クラス
        const manager = GameStateManager.getInstance();
        if (manager.currentState === State.BUBBLE_TALK || manager.currentState === State.EVENT) { return; }

        //十字キーを取得
        const cursorsKeys = this.cursors;

        //値が設定されている場合はクリックによる移動中のため処理しない
        if (this.moveToPositionX && this.moveToPositionY) return;
        this.setVelocity(0);

        if (cursorsKeys.left.isDown) {
            this.moveDirection = this.walkLeft;
            this.standframe = this.standLeft;
            this.setVelocityX(-1 * this.playerDefaultVelocity);
        } else if (cursorsKeys.right.isDown) {
            this.moveDirection = this.walkRight;
            this.standframe = this.standRight;
            this.setVelocityX(this.playerDefaultVelocity);
        }
        if (cursorsKeys.up.isDown) {
            this.moveDirection = this.walkUp;
            this.standframe = this.standUp;
            this.setVelocityY(-1 * this.playerDefaultVelocity);
        } else if (cursorsKeys.down.isDown) {
            this.moveDirection = this.walkDown;
            this.standframe = this.standDown;
            this.setVelocityY(this.playerDefaultVelocity);
        }

        //停止
        if (!this.moveToPositionX
            && !this.moveToPositionY
            && !cursorsKeys.left.isDown
            && !cursorsKeys.right.isDown
            && !cursorsKeys.up.isDown
            && !cursorsKeys.down.isDown
            && this.moveDirection !== this.walkStop) {
            this.setVelocity(0);
            this.stopAnimation();
            this.moveDirection = this.walkStop;
        }
    }

    //移動不能チェック
    //※停止についてはsprite自身で判定
    _updateStopWalk() {
        if (!this.body) return;
        if (this.state !== CharacterState.normal) return;

        //値が設定されていない場合は処理しない
        if (!this.moveToPositionX && !this.moveToPositionY) return;

        //移動先座標との差が1未満の場合は停止
        if (Phaser.Math.Difference(this.moveToPositionX!, this.x) < 1 && Phaser.Math.Difference(this.moveToPositionY!, this.y) < 1) {
            this.body.setVelocity(0, 0);
            this.moveDirection = this.walkStop;
            this.moveToPositionX = null;//移動先の値をnullに設定
            this.moveToPositionY = null;
        }

        //移動不能状態の時間をカウント
        if (this.body.velocity.x === 0 || this.body.velocity.y === 0) {
            this.moveStopCount++;
            //1000ミリ秒内に目標に到達するように調整される
            this.scene.physics.moveTo(this, this.moveToPositionX!, this.moveToPositionY!, this.moveVelocity, this.moveDefaultTime / 2);

            //一定時間移動していない場合は停止
            if (this.moveStopCount > 50) {
                this.moveStopCount = 0;
                this.initMoveToPosition();
            }
        }

        //他スプライトのbodyと衝突した場合は停止
        if (!this.body.touching.none) {
            this.initMoveToPosition();
        }
    }

    //共通化出来る
    _animationSetting(spriteSheetKey: string) {
        this.anims.create({
            key: this.walkLeft,
            frames: this.anims.generateFrameNumbers(spriteSheetKey, { start: 3, end: 5 }),
            frameRate: this.frameRate,
            yoyo: true
        });
        this.anims.create({
            key: this.walkRight,
            frames: this.anims.generateFrameNumbers(spriteSheetKey, { start: 6, end: 8 }),
            frameRate: this.frameRate,
            yoyo: true
        });
        this.anims.create({
            key: this.walkUp,
            frames: this.anims.generateFrameNumbers(spriteSheetKey, { start: 9, end: 11 }),
            frameRate: this.frameRate,
            yoyo: true
        });
        this.anims.create({
            key: this.walkDown,
            frames: this.anims.generateFrameNumbers(spriteSheetKey, { start: 0, end: 2 }),
            frameRate: this.frameRate,
            yoyo: true
        });
        this.anims.create({
            key: this.standLeft,
            frames: this.anims.generateFrameNumbers(spriteSheetKey, { start: 4, end: 4 }),
            frameRate: this.frameRate,
        });
        this.anims.create({
            key: this.standRight,
            frames: this.anims.generateFrameNumbers(spriteSheetKey, { start: 7, end: 7 }),
            frameRate: this.frameRate,
        });
        this.anims.create({
            key: this.standUp,
            frames: this.anims.generateFrameNumbers(spriteSheetKey, { start: 10, end: 10 }),
            frameRate: this.frameRate,
        });
        this.anims.create({
            key: this.standDown,
            frames: this.anims.generateFrameNumbers(spriteSheetKey, { start: 1, end: 1 }),
            frameRate: this.frameRate,
        });
    }

    //キャラの一部を非表示にするマスク
    _updateRectMask() {
        this.depthValue = this.y + (32 / 2) * this.scale
        this.setDepth(this.depthValue);
        const makeTilemap: Phaser.Tilemaps.Tilemap = this.gameScene.getTilemap().getMakeTilemap();

        const playerWithDepthMapName: Array<string> = this.gameScene.getTilemap().getPlayerWithDepthMapName();

        for (const mapName of playerWithDepthMapName) {
            // console.log("depthCheck.mapName = " + mapName);
            const maskHeight = 16;//マップ名から取得したい

            //タイルが存在しない場合はマスクを初期化
            if (!makeTilemap.getTileAtWorldXY(this.x + this.tileSize / 2 * this.scale, this.y - this.tileSize / 2 * this.scale, false, undefined, mapName) &&
                !makeTilemap.getTileAtWorldXY(this.x + this.tileSize / 2 * this.scale, this.y + this.tileSize / 2 * this.scale, false, undefined, mapName) &&
                !makeTilemap.getTileAtWorldXY(this.x - this.tileSize / 2 * this.scale, this.y - this.tileSize / 2 * this.scale, false, undefined, mapName) &&
                !makeTilemap.getTileAtWorldXY(this.x - this.tileSize / 2 * this.scale, this.y + this.tileSize / 2 * this.scale, false, undefined, mapName) &&
                !makeTilemap.getTileAtWorldXY(this.x, this.y - maskHeight, false, undefined, mapName)) {
                this.clearMask();
                return;
            }

            //下側チェック
            // if ((this.scene.map.getTileAtWorldXY(this.x + this.tileSize / 2 * this.scale, this.y + this.tileSize / 2 * this.scale, false, null, mapName) ||
            //     this.scene.map.getTileAtWorldXY(this.x - this.tileSize / 2 * this.scale, this.y + this.tileSize / 2 * this.scale, false, null, mapName)) &&
            //     !this.scene.map.getTileAtWorldXY(this.x, this.y - maskHeight, false, null, mapName)) {
            //     this.setDepth(this.depthValue - 2);
            //     //this.scene.map.getLayer(mapName).tilemapLayer.setDepth(5000);//タイルを設定するならこの書き方、しかし仲間キャラとか考えた場合はキャラオブジェクト毎に設定した方が良い
            // }

            //初回作成時
            if (!this.cropRectMask) {
                this.cropRectMask = this.scene.add.graphics();//make.graphics()でも良いがsetVisible()で非表示にするから不要
            };
            this.cropRectMask.setVisible(false);//非表示にする
            this.cropRectMask.setDepth(5000);
            this.cropRectMask.clear();//再描画のためクリア

            const whiteColor = Phaser.Display.Color.HexStringToColor('#ffffff').color;
            this.cropRectMask.fillStyle(whiteColor);

            //マップのオブジェクトを読み込んでマスクを作成
            this.gameScene.getTilemap().getMakeTilemap().objects.forEach(obj => {
                if (obj.name === "MASK") {
                    obj.objects.forEach(rect => {
                        this.cropRectMask.fillRect(
                            rect.x!,
                            this.y > rect.y! ? this.y : rect.y!,
                            rect.width!,
                            (rect.y! + rect.height! - this.y) < 0 ? 0 : (rect.y! + rect.height! - this.y))
                    })
                }
            })

            // //図形を作成
            this.cropRectMask.fillPath();

            //マスク作成のためcreateGeometryMaskを作成し、マスク処理を反転
            //初回作成時
            if (!this.cropRectMask2) {
                this.cropRectMask2 = this.cropRectMask.createGeometryMask();
            };
            this.cropRectMask2.setInvertAlpha();
            this.setMask(this.cropRectMask2);
        }
    }

    public setCursors(cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
        this.cursors = cursors;
    }
}

