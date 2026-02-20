import { Npc } from "../../gamemain/view/character/Npc";
import { GameScene } from "../../lib/types";

export class CharacterGameObject {
    private characterImageMap: Map<string, Phaser.GameObjects.Image> = new Map();

    constructor() { }

    //spriteを検索
    public getSprite(gameScene: GameScene, characterName: string): Phaser.Physics.Arcade.Sprite {

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

    //パーティリストを取得
    public getPlayerPartyList(gameScene: GameScene): Phaser.GameObjects.Sprite[] {
        return gameScene.getMapObject().getPlayerPartyList();
    }

    //フィールドの敵リストを取得
    public getFieldEnemyList(gameScene: GameScene): Npc[] {
        return gameScene.getMapObject().getFieldEnemyList();
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

    //キャラクターの立ち絵を取得しスクロール
    public scrollOutImage(imgae: Phaser.GameObjects.Image, moveToX: number, duration: number) {
        return new Promise<void>(resolve => {

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

    public getCharacterImage(characterKey: string): Phaser.GameObjects.Image {
        return this.characterImageMap.get(characterKey)!;
    }

    //会話中のキャラクターをライトアップ
    public lightUp(characterKey: string) {
        const characterImage = this.characterImageMap.get(characterKey);

        //ライトアップダウンの色合い設定
        const lightUpRGB = 255;
        const lightDownRGB = 128;

        return new Promise<void>(resolve => {
            //このtweenはオブジェクトをターゲットとせず、内部で値を更新し続ける
            //※削除処理は考えるべき
            const updateTween = characterImage!.scene.tweens.addCounter({
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
                    resolve();
                }
            });
        })
    }

    //未会話のキャラクターをライトダウン
    lightDownOtherCharacters(characterKey: string) {
        for (const [key, image] of this.characterImageMap) {

            //ライトアップダウンの色合い設定
            const lightUpRGB = 255;
            const lightDownRGB = 128;

            if (characterKey !== key) {
                return new Promise<void>(resolve => {
                    //このtweenは値を保持し更新し続ける。
                    //※削除処理は考えるべき
                    const updateTween = image.scene.tweens.addCounter({
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
                            resolve();
                        }
                    });
                })
            }
        }
    }
}