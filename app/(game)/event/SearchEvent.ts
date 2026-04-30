import { Event } from "../scenes/Event";
import { EVENT010101 } from "./view/EVENT010101";
import { EVENT010301 } from "./view/EVENT010301";
import { EVENT010302 } from "./view/EVENT010302";
import { EVENT010401 } from "./view/EVENT010401";
import { EVENT010201 } from "./view/EVENT010201";
import { EVENT010202 } from "./view/EVENT010202";
import { EVENT020101 } from "./view/EVENT020101";
import { EVENT020201 } from "./view/EVENT020201";

export class SerchEvent {

    constructor() { }

    public searchEventClass(eventScene: Event, eventObj: Phaser.Physics.Arcade.Sprite) {
        if (eventObj.name === 'EVENT010101') { return new EVENT010101(eventScene, eventObj); }
        if (eventObj.name === 'EVENT010201') { return new EVENT010201(eventScene, eventObj); }
        if (eventObj.name === 'EVENT010202') { return new EVENT010202(eventScene, eventObj); }
        if (eventObj.name === 'EVENT010301') { return new EVENT010301(eventScene, eventObj); }
        if (eventObj.name === 'EVENT010302') { return new EVENT010302(eventScene, eventObj); }
        if (eventObj.name === 'EVENT010401') { return new EVENT010401(eventScene, eventObj); }
        if (eventObj.name === 'EVENT020101') { return new EVENT020101(eventScene, eventObj); }
        if (eventObj.name === 'EVENT020201') { return new EVENT020201(eventScene, eventObj); }
    }
}