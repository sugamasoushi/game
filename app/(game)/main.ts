import { Boot } from './scenes/Boot';
import { SceneController } from './scenes/SceneController';
import { Title } from './scenes/Title';
import { Load } from './scenes/Load';
import { GameOver } from './scenes/GameOver';
import { Field as FieldGame } from './scenes/Field';
import { UI } from './scenes/UI';
import { MainMenu } from './scenes/MainMenu';
import { AUTO, Game } from 'phaser';
import { Menu } from './scenes/Menu';
import { Event } from './scenes/Event';
import { BubbleTalk } from './scenes/BubbleTalk';
import { Battle } from './scenes/Battle';
import { Sound } from './scenes/Sound';

import testPipline from '../../public/assets/img/effect/pipelines/SwirlPostPipeline.js';
import PlasmaPost2FX from '../../public/assets/img/effect/pipelines/PlasmaPost2FX.js';

let phaserGame: Phaser.Game | null = null;

// 画面が縦向きの場合は幅と高さを入れ替える//1024*576//1280*720
const baseWidth = 1280;
const baseHeight = 720;

// 開発環境 (npm run dev) の時だけ true になる
const isDebug = process.env.NODE_ENV === 'development';

const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: baseWidth,
    height: baseHeight,
    parent: 'game-container',
    // backgroundColor: '#028af8',
    scale: {
        mode: Phaser.Scale.FIT,//画面をブラウザ表示域に合わせる
        width: baseWidth,  // ベースとなる解像度（アスペクト比の基準）
        height: baseHeight,
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: isDebug,//当たり判定とかを表示してくれる
            fps: 60,
            gravity: { x: 0, y: 0 }
        },
    },
    input: {
        gamepad: true // これが必須！
    },
    // render: {
    //     //pixelArt: true,  // 拡大縮小時にピクセルの大きさを最適化してくれる
    //     //antialias: false, // 滑らかにする処理をオフにする
    //     //roundPixels: true // 座標を整数に丸めて、ドットの滲みを防ぐ
    // },
    scene: [
        Boot,
        UI,
        SceneController,
        Title,
        Load,
        MainMenu,
        FieldGame,
        Menu,
        Event,
        BubbleTalk,
        Battle,
        Sound,
        GameOver
    ],
    pipeline: { testPipline, PlasmaPost2FX }
};

const StartGame = (parent: string) => {
    phaserGame = new Game({ ...config, parent });
    return phaserGame;
}




export default StartGame;