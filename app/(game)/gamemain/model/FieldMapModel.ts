import { GameScene, FieldData } from "../../lib/types";
import { MapObject } from "../view/MapObject";
import { Player } from "../view/character/Player";
import { Npc } from "../view/character/Npc";

export class FieldMapModel {
    private mapObject: MapObject;
    private fieldData: FieldData;
    private player: Player;
    private playerPartyList: Phaser.Physics.Arcade.Sprite[] = [];

    private npcNormalList: Npc[] = [];
    private npcEnemyList: Npc[] = [];

    constructor(private gameScene: GameScene) { }

    public getFieldData(): FieldData {
        return this.fieldData;
    }

    public setFieldData(fieldData: FieldData) {
        this.fieldData = fieldData;
    }

    public execute(mapObject: MapObject) {
        this.mapObject = mapObject;
        this.player = mapObject.getPlayer();
        this.npcNormalList = mapObject.getFieldNpclList();
        this.npcEnemyList = mapObject.getFieldEnemyList();
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