import { Event } from "../scenes/Event";
import { EVENT0001 } from "./view/EVENT0001";
import { EVENT0002 } from "./view/EVENT0002";
import { EVENT0003 } from "./view/EVENT0003";
import { EVENT0004 } from "./view/EVENT0004";
import { EVENT0102 } from "./view/EVENT0102";

export class SerchEvent {

    constructor() { }

    public searchEventClass(eventScene: Event, eventObj: Phaser.Physics.Arcade.Sprite) {
        if (eventObj.name === 'EVENT0001') { return new EVENT0001(eventScene, eventObj); }
        if (eventObj.name === 'EVENT0002') { return new EVENT0002(eventScene, eventObj); }
        if (eventObj.name === 'EVENT0003') { return new EVENT0003(eventScene, eventObj); }
        if (eventObj.name === 'EVENT0004') { return new EVENT0004(eventScene, eventObj); }
        if (eventObj.name === 'EVENT0102') { return new EVENT0102(eventScene, eventObj); }
    }
}