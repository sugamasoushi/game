import { Scene } from 'phaser';

export class Boot extends Scene {
    constructor() { super('Boot'); }

    preload() {
        console.log("boot scene")
        //this.load.image('background', 'assets/bg.png');
        this.load.image('LondonBridge', 'assets/img/LondonBridge/LondonBridge.bmp');
        this.load.json('savedata', 'assets/savedata/savedata.json');
        this.load.json('namedata', 'assets/data/namedata.json');
        this.load.json('ImageKeyData', 'assets/data/ImageKeyData.json');
    }

    create() {

        this.scene.start('SceneController');
    }
}