import { ChestModel } from "../model/ChestModel";
import { ChestView } from "../view/ChestView";
import { MapObject } from "../view/MapObject";
import { FieldPresenter } from "./FieldPresenter";
import { InputManager } from "../../core/input/InputManager";

export class ChestPresenter {

    constructor(
        private gameScene: Phaser.Scene,
        private chestModel: ChestModel,
        private chestView: ChestView,
        private mapObject: MapObject,
        private fieldPresenter: FieldPresenter,
        private inputManager: InputManager
    ) { }

    public execute() {

    }

}