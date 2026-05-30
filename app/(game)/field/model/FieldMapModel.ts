import { FieldScene, FieldData } from "../../lib/types";
import { MapObject } from "../view/MapObject";
import { gameStateManager } from "../../GameAllState/GameStateManager";
import { Player } from "../view/character/Player";
import { Npc } from "../view/character/Npc";

export class FieldMapModel {
    private mapObject: MapObject;
    private fieldData: FieldData;
    private player: Player;

    private npcNormalList: Npc[] = [];
    private npcEnemyList: Npc[] = [];

    constructor(private fieldScene: FieldScene) { }

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
    public getPlayerPartyList(): Phaser.Physics.Arcade.Sprite[] {
        return gameStateManager.currentPlayerPartyList as Phaser.Physics.Arcade.Sprite[];
    }
    public getFieldEnemyList(): Npc[] {
        return this.npcEnemyList;
    }
    public getFieldNpclList(): Npc[] {
        return this.npcNormalList;
    }

}