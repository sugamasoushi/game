import {BaseSprite} from "../core/BaseSprite";

type ObjectPosition = {
    object1XPosition: string;
    object2XPosition: string;
    object1YPosition: string;//上か下
    object2YPosition: string;
}

type ObjectDirection = {
    object1Direction: string;
    object2Direction: string;
}

export class FieldObjectCheck {
    private object1: BaseSprite;
    private object2: BaseSprite;
    private object1XPosition: string;//左か右
    private object2XPosition: string;
    private object1YPosition: string;//上か下
    private object2YPosition: string;
    private object1Direction: string;
    private object2Direction: string;

    constructor(object1: BaseSprite, object2: BaseSprite) {

        this.positionCheck(object1, object2);
        this.directionCheck(object1, object2);
        //this._createPoint(object1, object2);
    }

    //キャラの位置関係をチェック、値は計算しない
    private positionCheck(object1: BaseSprite, object2: BaseSprite) {
        this.object1 = object1;
        this.object2 = object2;

        //左右位置
        if (object1.x - object2.x > 0) {
            //object1が右、object2が左
            this.object1XPosition = 'right';
            this.object2XPosition = 'left';
        } else if (object1.x - object2.x < 0) {
            //object1が左、object2が右
            this.object1XPosition = 'left';
            this.object2XPosition = 'right';
        }

        //上下位置
        if (object1.y - object2.y < 0) {
            //object1が上、object2が下
            this.object1YPosition = 'up';
            this.object2YPosition = 'down';
        } else if (object1.y - object2.y > 0) {
            //object1が下、object2が上
            this.object1YPosition = 'down';
            this.object2YPosition = 'up';
        }
    }

    private directionCheck(object1: BaseSprite, object2: BaseSprite) {

        const rad = Phaser.Math.Angle.Between(object1.x, object1.y, object2.x, object2.y);

        //object1が左、object2が右
        if (rad < -135 * (Math.PI / 180) || rad > 135 * (Math.PI / 180)) {
            this.object1Direction = 'left';
            this.object2Direction = 'right';
        }
        //object1が右、object2が左
        if (rad > -45 * (Math.PI / 180) && rad < 45 * (Math.PI / 180)) {
            this.object1Direction = 'right';
            this.object2Direction = 'left';
        }
        //object1が上、object2が下
        if (rad < -45 * (Math.PI / 180) && rad > -135 * (Math.PI / 180)) {
            this.object1Direction = 'up';
            this.object2Direction = 'down';
        }
        //object1が下、object2が上
        if (rad > 45 * (Math.PI / 180) && rad < 135 * (Math.PI / 180)) {
            this.object1Direction = 'down';
            this.object2Direction = 'up';
        }

        // console.log("右上", -45 * (Math.PI / 180))
        // console.log("左上", -135 * (Math.PI / 180))
        // console.log("左下", 135 * (Math.PI / 180))
        // console.log("右下", 45 * (Math.PI / 180))
    }

    //プレイヤーのクリックイベント可否を判定
    checkPlayerClickEvent() {
        // standLeft
        // standRight
        // standUp
        // standDown
        if (this.object1YPosition === 'down' && this.object1.getAnimationKey().standframe !== this.object1.getAnimationKey().standUp) {
            //クリックイベントオブジェクトの下で向きが上ではない場合はfalse
            return false;
        } else if (this.object1YPosition === 'up' && this.object1.getAnimationKey().standframe !== this.object1.getAnimationKey().standDown) {
            //クリックイベントオブジェクトの上で向きが下ではない場合はfalse
            return false;
        } else if (this.object1YPosition === 'left' && this.object1.getAnimationKey().standframe !== this.object1.getAnimationKey().standRight) {
            //クリックイベントオブジェクトの左で向きが右ではない場合はfalse
            return false;
        } else if (this.object1YPosition === 'right' && this.object1.getAnimationKey().standframe !== this.object1.getAnimationKey().standLeft) {
            //クリックイベントオブジェクトの右で向きが左ではない場合はfalse
            return false;
        } else {
            return true;
        }

    }

    public getObjectPosition(): ObjectPosition {
        const objectPosition: ObjectPosition = {
            object1XPosition: this.object1XPosition,
            object2XPosition: this.object2XPosition,
            object1YPosition: this.object1YPosition,//上か下
            object2YPosition: this.object2YPosition,
        };
        return objectPosition;
    }

    public getObjectDirection(): ObjectDirection {
        const objectDirection: ObjectDirection = {
            object1Direction: this.object1Direction,
            object2Direction: this.object2Direction
        };
        return objectDirection;
    }



    // _createPoint(object1: Phaser.Physics.Arcade.Sprite, object2: Phaser.Physics.Arcade.Sprite) {
    //     //座標確認用
    //     // console.log(object1.body);

    //     //判定するなら以下
    //     object1.scene.pointPraphics = object1.scene.add.graphics({ fillStyle: { color: 0x2266aa } });
    //     object1.scene.point1 = new Phaser.Geom.Point(object1.x - object1.tileSize / 2 * object1.scale, object1.y - object1.tileSize / 2 * object1.scale);//左上
    //     object1.scene.point2 = new Phaser.Geom.Point(object1.x + object1.tileSize / 2 * object1.scale, object1.y - object1.tileSize / 2 * object1.scale);//右上
    //     object1.scene.point3 = new Phaser.Geom.Point(object1.x - object1.tileSize / 2 * object1.scale, object1.y + object1.tileSize / 2 * object1.scale);//左下
    //     object1.scene.point4 = new Phaser.Geom.Point(object1.x + object1.tileSize / 2 * object1.scale, object1.y + object1.tileSize / 2 * object1.scale);//右下
    //     object1.scene.point5 = new Phaser.Geom.Point(object1.x, object1.y);//右下

    //     object1.scene.pointPraphics.fillPointShape(object1.scene.point1, 5);
    //     object1.scene.pointPraphics.fillPointShape(object1.scene.point2, 5);
    //     object1.scene.pointPraphics.fillPointShape(object1.scene.point3, 5);
    //     object1.scene.pointPraphics.fillPointShape(object1.scene.point4, 5);
    //     object1.scene.pointPraphics.fillPointShape(object1.scene.point5, 5);
    //     object1.scene.pointPraphics.setDepth(6000);
    // }
}
