import { Scene } from 'phaser';

export class Sound extends Scene {
    private debugFlg: boolean | undefined;
    
    gameScene: Phaser.Scene | null;

    //BGM
    bgm1: Phaser.Sound.HTML5AudioSound;
    battleBgm: Phaser.Sound.HTML5AudioSound;

    //SE
    public SE_waterFall: Phaser.Sound.HTML5AudioSound;
    public SE_fire: Phaser.Sound.HTML5AudioSound;
    public SE_punch: Phaser.Sound.HTML5AudioSound;
    public SE_victory: Phaser.Sound.HTML5AudioSound;
    public SE_karuipunch: Phaser.Sound.HTML5AudioSound;
    public SE_message: Phaser.Sound.HTML5AudioSound;
    public SE_attack: Phaser.Sound.HTML5AudioSound;

    constructor() { super('Sound'); }
    init() {
        this.debugFlg = this.game.config.physics.arcade?.debug;
    }
    preload() { }

    create() {
        this.gameScene = this.scene.get('Game');

        this.bgm1 = this.sound.add('bgm_otobokeDance', { loop: true }) as Phaser.Sound.HTML5AudioSound;
        this.bgm1.setVolume(0.9);
        this.battleBgm = this.sound.add('bgm_aruges', { loop: true }) as Phaser.Sound.HTML5AudioSound;
        this.battleBgm.setVolume(0.15);

        //環境音
        this.SE_waterFall = this.sound.add('SE_waterFall', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        this.SE_waterFall.volume = 0.15;

        this.SE_fire = this.sound.add('SE_fire', { loop: true }) as Phaser.Sound.HTML5AudioSound;
        this.SE_fire.volume = 0.3;
        this.SE_punch = this.sound.add('SE_punch', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        this.SE_punch.volume = 0.7;
        this.SE_attack = this.sound.add('SE_attack', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        this.SE_attack.volume = 0.7;
        this.SE_victory = this.sound.add('SE_victory', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        this.SE_victory.volume = 0.7;
        this.SE_karuipunch = this.sound.add('SE_karuipunch', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        this.SE_karuipunch.volume = 0.7;
        this.SE_message = this.sound.add('SE_message', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        this.SE_message.volume = 0.7;

        this.game.events.on('BGM_FIELD', (sceneKey: string, seKey: string) => {
            if (this.debugFlg) return;

            if (sceneKey !== 'FieldMove') {
                this.stopAllBgm();
                this.bgm1.play();
            }
            if (seKey && seKey === 'waterFall') {
                this.SE_waterFall.play();
            } else {
                this.SE_waterFall.stop()
            }
        })

        this.game.events.on('BGM_BATTLE', (key: string) => {
            if (this.debugFlg) return;
            
            console.log('BGM_BATTLE')
            this.stopAllBgm();
            this.battleBgm.play();
        })

        this.game.events.on('BGM_ALL_STOP', () => {
            this.sound.getAllPlaying().forEach(sound => { sound.stop(); })
        })

    }

    stopAllBgm() {
        this.sound.getAllPlaying().forEach(sound => { sound.stop(); })
    }
}
