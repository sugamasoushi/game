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

    gameScene: Phaser.Scene | null;

    //BGM
    fieldBgm: Phaser.Sound.HTML5AudioSound;
    battleBgm: Phaser.Sound.HTML5AudioSound;

    //SE
    public SE_waterFall: Phaser.Sound.HTML5AudioSound;
    public SE_fire: Phaser.Sound.HTML5AudioSound;
    public SE_smallPunch: Phaser.Sound.HTML5AudioSound;
    public SE_punch: Phaser.Sound.HTML5AudioSound;
    public SE_victory: Phaser.Sound.HTML5AudioSound;
    public SE_karuipunch: Phaser.Sound.HTML5AudioSound;
    public SE_message: Phaser.Sound.HTML5AudioSound;
    public SE_attack: Phaser.Sound.HTML5AudioSound;
    public SE_attack6: Phaser.Sound.HTML5AudioSound;
    public SE_chestOpen: Phaser.Sound.HTML5AudioSound;
    public SE_windCutter: Phaser.Sound.HTML5AudioSound;
    public SE_jajaann: Phaser.Sound.HTML5AudioSound;
    public SE_newsTitle: Phaser.Sound.HTML5AudioSound;
    public SE_decideButton: Phaser.Sound.HTML5AudioSound;
    public SE_cardTurnOver: Phaser.Sound.HTML5AudioSound;
    public SE_cancelButton: Phaser.Sound.HTML5AudioSound;
    public SE_idea: Phaser.Sound.HTML5AudioSound;
    public SE_syakiin: Phaser.Sound.HTML5AudioSound;
    public SE_cardOpen: Phaser.Sound.HTML5AudioSound;
    public SE_bookClose: Phaser.Sound.HTML5AudioSound;
    public SE_Beep5: Phaser.Sound.HTML5AudioSound;
    public SE_decisionButton15: Phaser.Sound.HTML5AudioSound;
    public SE_boosterJump1: Phaser.Sound.HTML5AudioSound;

    constructor() { super('Sound'); }
    init() {
        this.debugFlg = this.game.config.physics.arcade?.debug;
    }
    preload() { }

    create() {
        this.gameScene = this.scene.get('Field');

        this.fieldBgm = this.sound.add('bgm_otobokeDance', { loop: true }) as Phaser.Sound.HTML5AudioSound;
        this.fieldBgm.setVolume(0.9);
        this.battleBgm = this.sound.add('bgm_aruges', { loop: true }) as Phaser.Sound.HTML5AudioSound;
        this.battleBgm.setVolume(0.15);

        //環境音
        this.SE_waterFall = this.sound.add('SE_waterFall', { loop: true }) as Phaser.Sound.HTML5AudioSound;
        this.SE_waterFall.volume = 0.15;

        this.SE_fire = this.sound.add('SE_fire', { loop: true }) as Phaser.Sound.HTML5AudioSound;
        this.SE_fire.volume = 0.3;
        this.SE_smallPunch = this.sound.add('SE_smallPunch', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        this.SE_smallPunch.volume = 0.7;
        this.SE_punch = this.sound.add('SE_punch', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        this.SE_punch.volume = 0.7;
        this.SE_attack = this.sound.add('SE_attack', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        this.SE_attack.volume = 0.7;
        this.SE_attack6 = this.sound.add('SE_attack6', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        this.SE_attack6.volume = 0.7;

        this.SE_victory = this.sound.add('SE_victory', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        this.SE_victory.volume = 0.7;
        this.SE_karuipunch = this.sound.add('SE_karuipunch', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        this.SE_karuipunch.volume = 0.7;
        this.SE_message = this.sound.add('SE_message', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        this.SE_message.volume = 0.7;
        this.SE_chestOpen = this.sound.add('SE_chestOpen', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        this.SE_chestOpen.volume = 0.7;
        this.SE_windCutter = this.sound.add('SE_windCutter', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        this.SE_windCutter.volume = 0.7;
        this.SE_jajaann = this.sound.add('SE_jajaann', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        this.SE_jajaann.volume = 0.7;
        this.SE_newsTitle = this.sound.add('SE_newsTitle', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        this.SE_newsTitle.volume = 0.7;
        this.SE_decideButton = this.sound.add('SE_decideButton', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        this.SE_decideButton.volume = 0.7;
        this.SE_cardTurnOver = this.sound.add('SE_cardTurnOver', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        this.SE_cardTurnOver.volume = 0.7;
        this.SE_cancelButton = this.sound.add('SE_cancelButton', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        this.SE_cancelButton.volume = 0.7;
        this.SE_idea = this.sound.add('SE_idea', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        this.SE_idea.volume = 0.7;
        this.SE_syakiin = this.sound.add('SE_syakiin', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        this.SE_syakiin.volume = 0.7;
        this.SE_cardOpen = this.sound.add('SE_cardOpen', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        this.SE_cardOpen.volume = 0.7;
        this.SE_bookClose = this.sound.add('SE_bookClose', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        this.SE_bookClose.volume = 0.7;
        this.SE_Beep5 = this.sound.add('SE_Beep5', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        this.SE_Beep5.volume = 0.7;
        this.SE_decisionButton15 = this.sound.add('SE_decisionButton15', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        this.SE_decisionButton15.volume = 0.7;
        this.SE_boosterJump1 = this.sound.add('SE_boosterJump1', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        this.SE_boosterJump1.volume = 0.7;

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
            gameStateManager.bgmState$.subscribe((bgmState) => {

                switch (bgmState) {
                    case BgmState.TITLE:
                        //Loadシーンで読み込みTitleで実行するため何もしない
                        break;
                    case BgmState.FIELD:
                        this.updateBgm(gameStateManager.currentFieldData.mapKey);
                        break;
                    case BgmState.BATTLE:
                        if (this.debugFlg) return
                        this.playBgm('bgm_aruges');
                        if (this.currentBgs) this.currentBgs.stop();
                        this.currentBgsKey = '';
                        break;
                    case BgmState.NOSTATE:
                        this.sound.getAllPlaying().forEach(sound => { sound.stop(); })
                        break;
                }
            })
        );

        this.subs.add(
            gameStateManager.mapKey$.subscribe((mapKey) => {
                this.updateBgm(mapKey);
            })
        );
    }

    private updateBgm(mapKey: string) {
        if (this.debugFlg) return

        if (mapKey === '0102') {
            this.onFieldMap0102();
        } else {
            this.onFieldDefaultBgm();
        }
    }

    public onFieldDefaultBgm() {
        this.playBgm('bgm_otobokeDance');
    }

    public onFieldMap0102() {
        this.playBgm('bgm_otobokeDance');
        this.playBgs('SE_waterFall');
    }

    /**
     * BGMを再生する
     */
    public playBgm(key: string) {
        // 同じBGMが既に流れているなら何もしない
        if (this.currentBgmKey === key) return;

        // 古いBGMがあれば止める（またはフェードアウト）
        if (this.currentBgm) this.currentBgm.stop();

        this.currentBgmKey = key;

        this.currentBgm = this.sound.get(key) as Phaser.Sound.HTML5AudioSound;
        const actualVolume = this.currentBgm.volume * this.bgmVolume * this.masterVolume;
        this.currentBgm.play({ loop: true, volume: actualVolume });
    }

    /**
     * 環境音（BGS）を再生する
     */
    public playBgs(key: string) {
        if (this.currentBgsKey === key) return;
        if (this.currentBgs) this.currentBgs.stop();

        this.currentBgsKey = key;

        // 💡 BGS専用の音量設定を適用
        this.currentBgs = this.sound.get(key) as Phaser.Sound.HTML5AudioSound;
        const actualVolume = this.currentBgs.volume * this.bgsVolume * this.masterVolume;
        this.currentBgs.play({ loop: true, volume: actualVolume });
    }

    /**
     * オプション画面などで「BGMの音量」が変更されたときに呼び出す
     */
    public updateBgmVolume(newVolume: number) {
        this.bgmVolume = newVolume;
        if (this.currentBgm && this.currentBgm instanceof Phaser.Sound.WebAudioSound) {
            // リアルタイムに再生中の音量を変更
            this.currentBgm.setVolume(this.bgmVolume * this.masterVolume);
        }
    }

    /**
     * オプション画面などで「環境音の音量」が変更されたときに呼び出す
     */
    public updateBgsVolume(newVolume: number) {
        this.bgsVolume = newVolume;
        if (this.currentBgs && this.currentBgs instanceof Phaser.Sound.WebAudioSound) {
            // リアルタイムに再生中の環境音の音量を変更
            this.currentBgs.setVolume(this.bgsVolume * this.masterVolume);
        }
    }

    destroy() {
        //基本的に購読解除しない
        this.subs.unsubscribe();
    }
}
