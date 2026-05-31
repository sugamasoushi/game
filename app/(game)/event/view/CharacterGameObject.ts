import { Npc } from "../../field/view/character/Npc";
import { FieldScene } from "../../lib/types";

export class CharacterGameObject {
    private characterImageMap: Map<string, Phaser.GameObjects.Image> = new Map();

    constructor() { }

    //spriteを検索
    public getSprite(gameScene: FieldScene, characterName: string): Phaser.Physics.Arcade.Sprite {

        let characterSprite: Phaser.Physics.Arcade.Sprite;
        const displayList = gameScene.children.getChildren();

        try {
            displayList.map(obj => {
                if (obj.type === "Sprite") {
                    if (obj.name === characterName) {//動かすキャラはここで指定する
                        characterSprite = obj as Phaser.Physics.Arcade.Sprite;
                    }
                }
            })
        } catch {
            console.log('検索Execption' + characterName)
        }
        return characterSprite!;
    }

    //キャラクターの立ち絵を取得しスクロール
    public setCharacterImage(scene: Phaser.Scene, initX: number, initY: number, characterKey: string, characterImageKey: string, moveToX: number, scale: number, duration: number) {
        return new Promise<void>(resolve => {
            //setTintでグレーに設定、Phaser.Display.Color.GetColor()でRGB指定が可能
            const characterimage = scene.add.image(initX, initY, characterImageKey).setScale(scale);
            characterimage.setTint(Phaser.Display.Color.GetColor(128, 128, 128));
            this.characterImageMap.set(characterKey, characterimage);

            //画面外からスクロール
            scene.tweens.add({
                targets: characterimage,
                x: moveToX,
                ease: 'sine.out',
                duration: duration,
                onComplete: () => {
                    resolve();
                }
            });
        })
    }

    //キャラクターの立ち絵をスクロール
    public scrollInImage(imgae: Phaser.GameObjects.Image, moveToX: number, duration: number) {
        return new Promise<void>(resolve => {
            if (!imgae || !imgae.scene) {
                resolve();
                return;
            }

            //画面外からスクロール
            imgae.scene.tweens.add({
                targets: imgae,
                x: moveToX,
                ease: 'sine.out',
                duration: duration,
                onComplete: () => {
                    resolve();
                }
            });
        })
    }

    //キャラクターの立ち絵をスクロール
    public scrollOutImage(imgae: Phaser.GameObjects.Image, moveToX: number, duration: number) {
        return new Promise<void>(resolve => {
            if (!imgae || !imgae.scene) {
                resolve();
                return;
            }

            //画面外へスクロール
            imgae.scene.tweens.add({
                targets: imgae,
                x: moveToX,
                ease: 'sine.out',
                duration: duration,
                onComplete: () => {
                    resolve();
                }
            });
        })
    }

    public getCharacterImage(characterKey: string): Phaser.GameObjects.Image {
        return this.characterImageMap.get(characterKey)!;
    }

    //会話中のキャラクターをライトアップ
    public lightUp(characterKey: string) {
        const characterImage = this.characterImageMap.get(characterKey);

        if (!characterImage) return;

        //既に明るい、またはTween実行中なら何もしない
        if (characterImage.getData('isLightUp') === true) {
            return;
        }

        characterImage.setDepth(10);

        //ライトアップダウンの色合い設定
        const lightUpRGB = 255;
        const lightDownRGB = 128;

        return new Promise<void>(resolve => {

            //このtweenはオブジェクトをターゲットとせず、内部で値を更新し続ける
            //※削除処理は考えるべき
            characterImage!.scene.tweens.addCounter({
                from: lightDownRGB,
                to: lightUpRGB,
                duration: 100,
                ease: 'linear',
                onUpdate: (tween) => {
                    //このtweenから値を取得する
                    const value = Math.floor(tween.getValue()!);

                    //取得した値をセットする
                    characterImage!.setTint(Phaser.Display.Color.GetColor(value, value, value));
                },
                onComplete: () => {
                    characterImage.setData('isLightUp', true);
                    resolve();
                }
            });
        })
    }

    //未会話のキャラクターをライトダウン
    lightDownOtherCharacters(characterKey: string) {
        for (const [key, image] of this.characterImageMap) {

            if (!image) continue;

            //既に暗い場合はスキップ
            if (image.getData('isLightUp') === false) {
                continue;
            }

            image.setDepth(0);

            //ライトアップダウンの色合い設定
            const lightUpRGB = 255;
            const lightDownRGB = 128;

            if (characterKey !== key) {
                return new Promise<void>(resolve => {

                    //このtweenは値を保持し更新し続ける。
                    //※削除処理は考えるべき
                    image.scene.tweens.addCounter({
                        from: lightUpRGB,
                        to: lightDownRGB,
                        duration: 100,
                        ease: 'linear',
                        onUpdate: (tween) => {
                            //このtweenから値を取得する
                            const value = Math.floor(tween.getValue()!);

                            //取得した値をセットする
                            image.setTint(Phaser.Display.Color.GetColor(value, value, value));
                        },
                        onComplete: () => {
                            image.setData('isLightUp', false);
                            resolve();
                        }
                    });
                })
            }
        }
    }

    public imageObjectsDestroy() {
        this.characterImageMap.forEach((image) => {
            image.destroy();
        });
        // 最後にMapを空にする
        this.characterImageMap.clear();
    }

    public imageClear(key: string) {
        this.characterImageMap.get(key)!.destroy();
        this.characterImageMap.delete(key);
    }
}