import { Boot } from './scenes/Boot';
import { SceneController } from './core/SceneController';
import { Title } from './scenes/Title';
import { Load } from './scenes/Load';
import { GameOver } from './scenes/GameOver';
import { Game as MainGame } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { AUTO, Game } from 'phaser';
import Menu from './scenes/Menu';
import { Event } from './scenes/Event';
import { Battle } from './scenes/Battle';
import { Sound } from './scenes/Sound';

let phaserGame: Phaser.Game | null = null;

// 画面が縦向きの場合は幅と高さを入れ替える
const baseWidth = 1280;
const baseHeight = 720;
let gameWidth = baseWidth;
let gameHeight = baseHeight;

if (window.innerWidth < window.innerHeight) {
    gameWidth = baseHeight;
    gameHeight = baseWidth;
}

// 画面回転に合わせてゲーム画面を再起動
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        if (phaserGame) {
            // 新しい向きに対応したサイズを計算
            const newWidth = window.innerWidth < window.innerHeight ? baseHeight : baseWidth;
            const newHeight = window.innerWidth < window.innerHeight ? baseWidth : baseHeight;
            phaserGame.scale.setGameSize(newWidth, newHeight);
            console.log('Screen updated to:', newWidth, 'x', newHeight);
        }
    }, 100);
});

const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: gameWidth,
    height: gameHeight,
    parent: 'game-container',
    // backgroundColor: '#028af8',
    scale: {
        mode: Phaser.Scale.FIT,//画面をブラウザ表示域に合わせる
        width: gameWidth,  // ベースとなる解像度（アスペクト比の基準）
        height: gameHeight,
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: true,//当たり判定とかを表示してくれる
            gravity: { x: 0, y: 0 }
        },
    },
    scene: [
        Boot,
        SceneController,
        Title,
        Load,
        MainMenu,
        MainGame,
        Menu,
        Event,
        Battle,
        Sound,
        GameOver
    ]
};

const StartGame = (parent: string) => {
    phaserGame = new Game({ ...config, parent });
    return phaserGame;
}




export default StartGame;