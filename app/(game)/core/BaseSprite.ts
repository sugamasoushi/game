import { animationKey, CharacterState } from "../lib/types";
import { GameScene } from "../lib/types";

/**
 * キャラクタースプライトの共通クラス
 * 
 * setMoveToPosition()を呼び出すことで移動する。
 * 移動処理は子クラスで実装する事。
 *
 * @export
 * @class Common
 * @extends {Phaser.Physics.Arcade.Sprite}
 */
export class BaseSprite extends Phaser.Physics.Arcade.Sprite {
    protected gameScene: GameScene;
    protected spriteSheetKey: string;
    protected walkLeft: string = 'walk_left';
    protected walkRight: string = 'walk_right';
    protected walkUp: string = 'walk_up';
    protected walkDown: string = 'walk_down';
    protected walkStop: string = 'walk_stop';
    protected standframe: string = '';
    protected standLeft: string = 'stand_left';
    protected standRight: string = 'stand_right';
    protected standUp: string = 'stand_up';
    protected standDown: string = 'stand_down';
    protected moveToPositionX: number | null = null;
    protected moveToPositionY: number | null = null;
    protected moveDirection: string = '';//方向
    protected moveVelocity: number = 50;//速度
    protected moveDefaultTime: number = 1000;//速度
    protected moveStopCount: number = 0;

    protected spriteContainer: Phaser.GameObjects.Container;

    constructor(gameScene: GameScene, x: number, y: number, spriteSheetKey: string, initStandKey: string) {
        super(gameScene, x, y, spriteSheetKey);
        this.gameScene = gameScene;
        this.animationKeySetting(spriteSheetKey, initStandKey);
        this.addToUpdateList();
        this.addToDisplayList();

        this.spriteContainer = this.scene.add.container();
    }

    preUpdate(time: number, delta: number) {
        super.preUpdate(time, delta);
        this.setDepth(this.y + (32 / 2) * this.scale);
        this.updateAnimation();
        this.updateStopWalk();
        this.stopCheck();
    }

    /**
     * アニメーションのキーを作成
     */
    private animationKeySetting(spriteSheetKey: string, direction: string) {
        //各アニメーションキーを設定
        this.spriteSheetKey = spriteSheetKey;
        this.walkLeft = spriteSheetKey + '-' + this.walkLeft;
        this.walkRight = spriteSheetKey + '-' + this.walkRight;
        this.walkUp = spriteSheetKey + '-' + this.walkUp;
        this.walkDown = spriteSheetKey + '-' + this.walkDown;
        this.walkStop = spriteSheetKey + '-' + this.walkStop;
        this.standLeft = spriteSheetKey + '-' + this.standLeft;
        this.standRight = spriteSheetKey + '-' + this.standRight;
        this.standUp = spriteSheetKey + '-' + this.standUp;
        this.standDown = spriteSheetKey + '-' + this.standDown;

        //初期状態を設定
        this.moveDirection = spriteSheetKey + '-' + 'walk_stop';
        this.standframe = spriteSheetKey + '-' + direction;
    }

    //共通
    private updateAnimation() {
        if (this.moveDirection === this.walkLeft) {
            this.standframe = this.standLeft;
        } else if (this.moveDirection === this.walkRight) {
            this.standframe = this.standRight;
        } else if (this.moveDirection === this.walkUp) {
            this.standframe = this.standUp;
        } else if (this.moveDirection === this.walkDown) {
            this.standframe = this.standDown;
        }

        //anims.play()は一回だけ処理するようにすること
        if (this.moveDirection === this.walkStop) {
            this.anims.play(this.standframe, true);
        } else {
            this.anims.play(this.moveDirection, true);
        }
    }

    //共通
    protected updateStopWalk() {

        //ボディの設定が無い場合は未処理
        if (!this.body) return;

        //値チェック
        if (this.moveToPositionX === null) { this.moveToPositionX = 0; }
        if (this.moveToPositionY === null) { this.moveToPositionY = 0; }

        //移動先座標との差が1未満の場合は停止
        if (Phaser.Math.Difference(this.moveToPositionX, this.x) < 1 && Phaser.Math.Difference(this.moveToPositionY, this.y) < 1) {
            (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
            this.moveDirection = this.walkStop;
            this.moveToPositionX = null;//移動先の値をnullに設定
            this.moveToPositionY = null;
        }
    }

    /**
     * 移動先座標を設定する。
     * 他メソッドから呼び出すこと
     */
    public setMoveToPosition(x: number, y: number, velocity?: number, moveDefaultTime?: number) {
        if (this.state !== CharacterState.normal) return;

        const v: number = velocity ? velocity : this.moveVelocity;//速度
        const mt: number = moveDefaultTime ? moveDefaultTime : this.moveDefaultTime;//1000ミリ秒内に目標に到達するように調整される

        //移動先座標を設定
        this.moveToPositionX = x;
        this.moveToPositionY = y;

        //方向を設定
        this.setMoveDirection();

        //移動
        this.scene.physics.moveTo(this, this.moveToPositionX, this.moveToPositionY, v, mt);
    }

    /**
     * 移動方向を設定する。
     * 他メソッドから呼び出すこと。
     *
     * @memberof Common
     */
    private setMoveDirection() {
        if (this.state !== CharacterState.normal) return;

        //値チェック
        if (this.moveToPositionX === null) { this.moveToPositionX = 0; }
        if (this.moveToPositionY === null) { this.moveToPositionY = 0; }

        const rad = Phaser.Math.Angle.Between(this.x, this.y, this.moveToPositionX, this.moveToPositionY);

        //左
        if (rad < -135 * (Math.PI / 180) || rad > 135 * (Math.PI / 180)) {
            this.moveDirection = this.walkLeft;
        }
        //右
        if (rad > -45 * (Math.PI / 180) && rad < 45 * (Math.PI / 180)) {
            this.moveDirection = this.walkRight;
        }
        //上
        if (rad < -45 * (Math.PI / 180) && rad > -135 * (Math.PI / 180)) {
            this.moveDirection = this.walkUp;
        }
        //下
        if (rad > 45 * (Math.PI / 180) && rad < 135 * (Math.PI / 180)) {
            this.moveDirection = this.walkDown;
        }

        // console.log("右上", -45 * (Math.PI / 180))
        // console.log("左上", -135 * (Math.PI / 180))
        // console.log("左下", 135 * (Math.PI / 180))
        // console.log("右下", 45 * (Math.PI / 180))
    }

    //移動先初期化。座標位置を外部から変更した場合は必ず呼び出すこと。
    public initMoveToPosition() {
        if (!this.body) return;
        (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
        this.moveToPositionX = null;//移動先の値をnullに設定
        this.moveToPositionY = null;
        //return this;//メソッドチェーンの記法。このメソッドの参照を返し、次のメソッドが実行可能となる。
    }

    //アニメーションを停止、イベント中などで使用
    public stopAnimation() {
        this.stop();
        this.initMoveToPosition();
        this.moveDirection = this.walkStop;
    }

    //アニメーションを設定する（移動しない）
    //update()の更新処理を前提としているため、キャラが停止していると使えない
    public setAnimDirection(direction: string) {
        // 以下キーワードを引数に設定
        // 'stand_left'
        // 'stand_right'
        // 'stand_up'
        // 'stand_down'
        this.moveDirection = this.spriteSheetKey + '-' + direction;
    }

    public setStandFrame(standframe: string) {
        //使い方this.player.setStandFrame(this.player.getAnimationKey().standDown),

        // スプライトで定義している以下の変数を指定して設定する
        // this.standLeft;
        // this.standRight;
        // this.standUp;
        // this.standDown;
        // this.anims.play(standframe, true);
        this.standframe = standframe;
    }

    public getAnimationKey(): animationKey {
        const animKey: animationKey = {
            spriteSheetKey: this.spriteSheetKey,
            walkLeft: this.walkLeft,
            walkRight: this.walkRight,
            walkUp: this.walkUp,
            walkDown: this.walkDown,
            walkStop: this.walkStop,
            standLeft: this.standLeft,
            standRight: this.standRight,
            standUp: this.standUp,
            standDown: this.standDown,
            moveDirection: this.moveDirection,
            standframe: this.standframe
        };

        return animKey;
    }

    public setMapPosition(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    //外部操作による指定座標位置まで移動した後の停止処理
    private stopCheck() {
        if (this.state === CharacterState.event) {
            const stopTime: number = 5;//移動先座標との差が5未満の場合は停止

            //X,Y座標の指定をチェックし、合致する方向に移動
            if (this.moveToPositionX !== null && this.moveToPositionY === null) {
                if (Phaser.Math.Difference(this.moveToPositionX, this.x) < stopTime) {
                    this.moveDirection = this.walkStop;
                    this.x = this.moveToPositionX;//目標座標との差があるため、最後に位置を設定
                    this.initMoveToPosition();
                }
            } else if (this.moveToPositionY !== null && this.moveToPositionX === null) {
                if (Phaser.Math.Difference(this.moveToPositionY, this.y) < stopTime) {
                    this.moveDirection = this.walkStop;
                    this.y = this.moveToPositionY;//目標座標との差があるため、最後に位置を設定
                    this.initMoveToPosition();
                }
            }
        }
    }

    //キャラクターを目標Y座標まで移動する
    public moveY(moveY: number, velocity: number, animation: boolean) {
        if (!this.body) return;
        this.moveToPositionY = moveY;

        //座標位置によって移動方向を決定
        if (this.moveToPositionY - this.y < 0) {
            this.setVelocityY(-1 * velocity);
            if (animation === true) {
                this.setAnimDirection('walk_up');
            }
        } else {
            this.setVelocityY(velocity);
            //this.body.velocity.y = velocity;
            if (animation === true) {
                this.setAnimDirection('walk_down');
            }
        }
    }

    //キャラクターを目標Y座標まで移動する
    public moveX(moveX: number, velocity: number, animation: boolean) {
        if (!this.body) return;
        this.moveToPositionX = moveX;

        //座標位置によって移動方向を決定
        if (this.moveToPositionX - this.x < 0) {
            this.setVelocityX(-1 * velocity);
            if (animation === true) {
                this.setAnimDirection('walk_left');
            }
        } else {
            this.setVelocityX(velocity);
            if (animation === true) {
                this.setAnimDirection('walk_right');
            }
        }
    }

    public getDirection() {
        let operatorX: number = 0;
        let operatorY: number = 0;
        if (this.moveDirection === this.walkLeft || this.standframe === this.standLeft) {
            operatorX = -1;
        } else if (this.moveDirection === this.walkRight || this.standframe === this.standRight) {
            operatorX = 1;
        } else if (this.moveDirection === this.walkUp || this.standframe === this.standUp) {
            operatorY = -1;
        } else if (this.moveDirection === this.walkDown || this.standframe === this.standDown) {
            operatorY = 1;
        }
        return { operatorX: operatorX, operatorY: operatorY }
    }

    public setSpriteContainer(sprite: Phaser.GameObjects.Sprite) {
        this.spriteContainer.add(sprite);
    }
}

