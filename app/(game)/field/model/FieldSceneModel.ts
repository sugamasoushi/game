import { FieldScene, FieldData } from "../../lib/types";
import { GameStateManager } from "../../core/GameStateManager";
import { Player } from "../view/character/Player";
import { Npc } from "../view/character/Npc";

export class FieldSceneModel {
    private gameStateManager: GameStateManager;

    private makeTilemapData: Phaser.Tilemaps.Tilemap;
    // private mapObject: MapObject;
    private currentFieldData: FieldData;
    private player: Player;

    private npcNormalList: Npc[] = [];
    private npcEnemyList: Npc[] = [];

    private checkEventObjectFlg: boolean = false;
    private checkClickEventObjectFlg: boolean = false;
    private checkMapMoveFlg: boolean = false;
    private checkChestFlg: boolean = false;


    constructor(private fieldScene: FieldScene) { }

    public getCurrentFieldData(): FieldData {
        return this.currentFieldData;
    }

    public execute() {
        //状態管理クラス
        this.gameStateManager = GameStateManager.getInstance();
        this.currentFieldData = this.gameStateManager.currentFieldData;

        //タイルマップ情報作成
        this.makeTilemapData = this.fieldScene.make.tilemap({ key: this.currentFieldData.mapKey });
        this.checkTilemapData();
    }

    private checkTilemapData() {

        if (this.makeTilemapData.getObjectLayer('EVENT')) {
            this.checkEventObjectFlg = true;
        }

        if (this.makeTilemapData.getObjectLayer('CLICKEVENT')) {
            this.checkClickEventObjectFlg = true;
        }

        if (this.makeTilemapData.getObjectLayer('MAPMOVE')) {
            this.checkMapMoveFlg = true;
        }

        //宝箱情報をチェック
        if (this.makeTilemapData.getObjectLayer('SPRITE')) {

            for (const obj of this.makeTilemapData.getObjectLayer('SPRITE')!.objects) {
                if (obj.name === 'chest') {
                    this.checkChestFlg = true;
                }
            }
        }
    }

    public getMakeTilemapData(): Phaser.Tilemaps.Tilemap { return this.makeTilemapData; }

    // public setMapObjectData(mapObject: MapObject) {
    //     this.mapObject = mapObject;
    //     // this.player = mapObject.getPlayer();

    // }

    get eventObjectFlg() { return this.checkEventObjectFlg; }
    get clickEventObjectFlg() { return this.checkClickEventObjectFlg; }
    get mapMoveFlg() { return this.checkMapMoveFlg; }
    get chestFlg() { return this.checkChestFlg; }

}