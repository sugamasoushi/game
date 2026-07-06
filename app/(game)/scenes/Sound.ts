import { Scene } from 'phaser';
import { BgmState } from '../lib/StateTypes';
import { GameStateManager } from '../core/GameStateManager';
import { Subscription } from 'rxjs';

export class Sound extends Scene {
    private debugFlg: boolean | undefined;
    private subs = new Subscription();

    // 💡 音量設定（0.0 〜 1.0）
    public masterVolume: number = 1; // 全体の音量
    public bgmVolume: number = 0.7;    // BGM用
    public bgsVolume: number = 0.7;    // 環境音（Background Sound）用
    public seVolume: number = 0.7;     // 効果音用

    private currentBgmKey: string;
    private currentBgsKey: string;
    private currentBgm: Phaser.Sound.HTML5AudioSound
    private currentBgs: Phaser.Sound.HTML5AudioSound
    private currentSeKey: string;
    private currentSe: Phaser.Sound.HTML5AudioSound

    gameScene: Phaser.Scene | null;

    //BGM
    fieldBgm: Phaser.Sound.HTML5AudioSound;
    battleBgm: Phaser.Sound.HTML5AudioSound;

    constructor() { super('Sound'); }
    init() {
        this.debugFlg = this.game.config.physics.arcade?.debug;
    }
    preload() { }

    create() {
        this.gameScene = this.scene.get('Field');

        // this.fieldBgm = this.sound.add('bgm_otobokeDance', { loop: true }) as Phaser.Sound.HTML5AudioSound;
        // this.fieldBgm.setVolume(0.9);
        // this.battleBgm = this.sound.add('bgm_aruges', { loop: true }) as Phaser.Sound.HTML5AudioSound;
        // this.battleBgm.setVolume(0.15);

        // //環境音
        // this.SE_waterFall = this.sound.add('SE_waterFall', { loop: true }) as Phaser.Sound.HTML5AudioSound;
        // this.SE_waterFall.volume = 0.15;

        // this.SE_fire = this.sound.add('SE_fire', { loop: true }) as Phaser.Sound.HTML5AudioSound;
        // this.SE_fire.volume = 0.3;
        // this.SE_smallPunch = this.sound.add('SE_smallPunch', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        // this.SE_smallPunch.volume = 0.7;
        // this.SE_punch = this.sound.add('SE_punch', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        // this.SE_punch.volume = 0.7;
        // this.SE_attack = this.sound.add('SE_attack', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        // this.SE_attack.volume = 0.7;
        // this.SE_attack6 = this.sound.add('SE_attack6', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        // this.SE_attack6.volume = 0.7;

        // this.SE_victory = this.sound.add('SE_victory', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        // this.SE_victory.volume = 0.7;
        // this.SE_karuipunch = this.sound.add('SE_karuipunch', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        // this.SE_karuipunch.volume = 0.7;
        // this.SE_message = this.sound.add('SE_message', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        // this.SE_message.volume = 0.7;
        // this.SE_chestOpen = this.sound.add('SE_chestOpen', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        // this.SE_chestOpen.volume = 0.7;
        // this.SE_windCutter = this.sound.add('SE_windCutter', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        // this.SE_windCutter.volume = 0.7;
        // this.SE_jajaann = this.sound.add('SE_jajaann', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        // this.SE_jajaann.volume = 0.7;
        // this.SE_newsTitle = this.sound.add('SE_newsTitle', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        // this.SE_newsTitle.volume = 0.7;
        // this.SE_decideButton = this.sound.add('SE_decideButton', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        // this.SE_decideButton.volume = 0.7;
        // this.SE_cardTurnOver = this.sound.add('SE_cardTurnOver', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        // this.SE_cardTurnOver.volume = 0.7;
        // this.SE_cancelButton = this.sound.add('SE_cancelButton', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        // this.SE_cancelButton.volume = 0.7;
        // this.SE_idea = this.sound.add('SE_idea', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        // this.SE_idea.volume = 0.7;
        // this.SE_syakiin = this.sound.add('SE_syakiin', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        // this.SE_syakiin.volume = 0.7;
        // this.SE_cardOpen = this.sound.add('SE_cardOpen', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        // this.SE_cardOpen.volume = 0.7;
        // this.SE_bookClose = this.sound.add('SE_bookClose', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        // this.SE_bookClose.volume = 0.7;
        // this.SE_Beep5 = this.sound.add('SE_Beep5', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        // this.SE_Beep5.volume = 0.7;
        // this.SE_decisionButton15 = this.sound.add('SE_decisionButton15', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        // this.SE_decisionButton15.volume = 0.7;
        // this.SE_boosterJump1 = this.sound.add('SE_boosterJump1', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        // this.SE_boosterJump1.volume = 0.7;

        this.setSubscription();
    }

    stopAllBgm() {

        this.sound.getAllPlaying().forEach(sound => {
            sound.stop();
        })
    }

    setSubscription() {
        const gameStateManager = GameStateManager.getInstance();

        this.subs.add(
            gameStateManager.bgmState$.subscribe(({ bgmState, mapKey }) => {

                switch (bgmState) {
                    case BgmState.TITLE:
                        this.playBgm('opening', 0.5);
                        break;
                    case BgmState.FIELD:
                        this.updateBgm(mapKey);
                        break;
                    case BgmState.BATTLE:
                        if (this.debugFlg) return
                        this.playBgm('bgm_aruges', 0.15);
                        if (this.currentBgs) this.currentBgs.stop();
                        this.currentBgsKey = '';
                        break;
                    case BgmState.NOSTATE:
                        this.sound.getAllPlaying().forEach(sound => { sound.stop(); })
                        break;
                }
            })
        );

        // this.subs.add(
        //     gameStateManager.mapData$.subscribe(({ mapKey, state }) => {

        //         //初期値の場合は処理しない
        //         if (mapKey === 'init' || state === State.LOAD || state === State.GAME_RESTART) return;

        //         //this.updateBgm(mapKey);
        //     })
        // );

        //音量設定
        this.subs.add(
            gameStateManager.optionData$.subscribe((optionData) => {
                //console.log('Sound.ts - optionData changed:', optionData);

                const master = optionData.masterVolume / 100;
                const bgm = optionData.bgmVolume / 100;
                const bgs = optionData.bgsVolume / 100;
                const se = optionData.seVolume / 100;

                this.masterVolume = master;
                this.bgmVolume = bgm;
                this.bgsVolume = bgs;
                this.seVolume = se;

                // BGMの音量を設定
                if (this.currentBgm) this.currentBgm.setVolume(this.bgmVolume * this.masterVolume);
                // 環境音の音量を設定
                if (this.currentBgs) this.currentBgs.setVolume(this.bgsVolume * this.masterVolume);
                // SEの音量を設定
                if (this.currentSe) this.currentSe.setVolume(this.seVolume * this.masterVolume);
            })
        );
    }

    private updateBgm(mapKey: string) {
        if (this.debugFlg) return;

        switch (mapKey) {
            case '0102':
                this.onFieldMap0102();
                break;
            case '0104':
            case '0105':
                this.onCaveBGM();
                break;
            case '0201':
                this.onCrystalCaveBGM();
                break;
            default:
                this.onFieldDefaultBgm();
                break;
        }
    }

    public onOpening() { this.playBgm('opening', 0.5); }

    public onFieldDefaultBgm() {
        console.log('onFieldDefaultBgm')
        this.playBgm('bgm_otobokeDance');
        this.playBgs('none', 0);
    }

    public onFieldMap0102() {
        this.playBgm('bgm_otobokeDance');
        this.playBgs('SE_waterFall', 0.15);
    }

    public onCaveBGM() {
        console.log('onCaveBGM')
        this.playBgm('bgm_Cave');
        this.playBgs('none', 0);
    }

    public onCrystalCaveBGM() {
        this.playBgm('bgm_CrystalCave');
        this.playBgs('none', 0);
    }

    /**
     * BGMを再生する
     */
    public playBgm(key: string, volumeScale?: number) {
        // 同じBGMが既に流れているなら何もしない
        if (this.currentBgmKey === key) return;

        // 古いBGMがあれば止める（またはフェードアウト）
        if (this.currentBgm) this.currentBgm.stop();

        this.currentBgmKey = key;
        const actualVolumeScale = volumeScale ? volumeScale : 1;

        //キーが存在しない場合は追加する
        if (!this.sound.get(key)) {
            this.currentBgm = this.sound.add(key) as Phaser.Sound.HTML5AudioSound;
        }

        this.currentBgm = this.sound.get(key) as Phaser.Sound.HTML5AudioSound;
        this.currentBgm.volume = 1;
        const actualVolume = this.bgmVolume * this.masterVolume * actualVolumeScale;
        this.currentBgm.play({ loop: true, volume: actualVolume });
    }

    /**
     * 環境音（BGS）を再生する
     */
    public playBgs(key: string, volumeScale?: number) {
        if (this.currentBgsKey === key) return;
        if (key === 'none') {
            if (this.currentBgs) this.currentBgs.stop();
            this.currentBgsKey = '';
            return;
        }
        if (this.currentBgs) this.currentBgs.stop();

        this.currentBgsKey = key;
        const actualVolumeScale = volumeScale ? volumeScale : 1;

        //キーが存在しない場合は追加する
        if (!this.sound.get(key)) {
            this.currentBgs = this.sound.add(key) as Phaser.Sound.HTML5AudioSound;
        }

        // 💡 BGS専用の音量設定を適用
        this.currentBgs = this.sound.get(key) as Phaser.Sound.HTML5AudioSound;
        this.currentBgs.volume = 1;

        const actualVolume = this.bgsVolume * this.masterVolume * actualVolumeScale;
        this.currentBgs.play({ loop: true, volume: actualVolume });
    }

    /**
     * 効果音を再生する
     */
    public playSe(key: string, volumeScale?: number, flg?: boolean) {

        if (this.currentSe) this.currentSe.stop();

        this.currentSeKey = key;
        const loopFlg = flg ? flg : false;
        const actualVolumeScale = volumeScale ? volumeScale : 1;

        //キーが存在しない場合は追加する
        if (!this.sound.get(key)) {
            this.currentSe = this.sound.add(key) as Phaser.Sound.HTML5AudioSound;
        }

        // 💡 SE専用の音量設定を適用
        this.currentSe = this.sound.get(key) as Phaser.Sound.HTML5AudioSound;
        this.currentSe.volume = 1;
        const actualVolume = this.seVolume * this.masterVolume * actualVolumeScale;
        this.currentSe.play({ loop: loopFlg, volume: actualVolume });
    }

    public stopSe() {
        if (this.currentSe) this.currentSe.stop();
    }

    // /**
    //  * オプション画面などで「BGMの音量」が変更されたときに呼び出す
    //  */
    // public updateBgmVolume(newVolume: number) {
    //     this.bgmVolume = newVolume;
    //     if (this.currentBgm && this.currentBgm instanceof Phaser.Sound.WebAudioSound) {
    //         // リアルタイムに再生中の音量を変更
    //         this.currentBgm.setVolume(this.bgmVolume * this.masterVolume);
    //     }
    // }

    // /**
    //  * オプション画面などで「環境音の音量」が変更されたときに呼び出す
    //  */
    // public updateBgsVolume(newVolume: number) {
    //     this.bgsVolume = newVolume;
    //     if (this.currentBgs && this.currentBgs instanceof Phaser.Sound.WebAudioSound) {
    //         // リアルタイムに再生中の環境音の音量を変更
    //         this.currentBgs.setVolume(this.bgsVolume * this.masterVolume);
    //     }
    // }

    // /**
    //  * オプション画面などで「マスタ音量」が変更されたときに呼び出す
    //  */
    // public updateMasterVolume(newVolume: number) {
    //     this.masterVolume = newVolume;
    //     if (this.currentBgm) {
    //         this.currentBgm.setVolume(this.bgmVolume * this.masterVolume);
    //     }
    //     if (this.currentBgs) {
    //         this.currentBgs.setVolume(this.bgsVolume * this.masterVolume);
    //     }
    // }

    destroy() {
        //基本的に購読解除しない
        this.subs.unsubscribe();
    }
}
