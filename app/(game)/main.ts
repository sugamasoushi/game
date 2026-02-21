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