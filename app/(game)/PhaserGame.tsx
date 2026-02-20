import { useEffect, useRef } from 'react';
import StartGame from './main';

export const PhaserGame = () => {
    const game = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (!game.current) {
            game.current = StartGame("game-container");
        }

        return () => {
            if (game.current) {
                game.current.destroy(true);
                game.current = null;
            }
        }
    }, []);

    return (
        <div id="game-container"></div>
    );
};
