import { Scene } from 'phaser';
import { TitleModel } from '../title/model/TitleModel';
import { Option } from '../title/view/Option';
import { Opening } from '../title/view/Opening';
import { TitleLogo } from '../title/view/TitleLogo';
import { NewGameButton } from '../title/view/NewGameButton';
import { ContinueButton } from '../title/view/ContinueButton';
import { OptionButton } from '../title/view/OptionButton';
import { TitlePresenter } from '../title/presenter/TitlePresenter';

export class Title extends Scene {
    private debugFlg: boolean | undefined;
    game: Phaser.Game;

    public isTransitioning: boolean = false;
    public SE_syakiin: Phaser.Sound.HTML5AudioSound;

    private presenter: TitlePresenter;

    constructor() { super('Title'); }

    init() {
        console.log("Title scene initial launch");
        this.debugFlg = this.game.config.physics.arcade?.debug;
        this.isTransitioning = false;
    }

    preload() {
        // this.load.json('savedata', 'assets/data/savedata.json');

        // 文字列ベースのデータのみロードし、次のLoadSceneで画像などの重いデータをロードする
        this.load.tilemapTiledJSON({ key: '0001', url: 'assets/tiled/0001_testtile.json' });
        this.load.tilemapTiledJSON({ key: '0002', url: 'assets/tiled/0002_testtile.json' });
        this.load.tilemapTiledJSON({ key: '0101', url: 'assets/tiled/0101_home.json' });
        this.load.tilemapTiledJSON({ key: '0102', url: 'assets/tiled/0102_HomeForest.json' });
        this.load.tilemapTiledJSON({ key: '0103', url: 'assets/tiled/0103_ForestMansion.json' });
        this.load.tilemapTiledJSON({ key: '0104', url: 'assets/tiled/0104_ForestCave.json' });
        this.load.tilemapTiledJSON({ key: '0105', url: 'assets/tiled/0105_cave.json' });
        this.load.tilemapTiledJSON({ key: '0201', url: 'assets/tiled/0201_Gensou.json' });

        this.load.setPath('assets');
        this.load.image('alertImage', '/img/CharaStand/20240713_2.png');
    }

    async create() {
        this.SE_syakiin = this.sound.add('SE_syakiin', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        this.SE_syakiin.volume = 0.7;

        // MVP の組み立て
        const titleModel = new TitleModel(this);

        const option = new Option(this);
        const opening = new Opening(this);
        const logo = new TitleLogo(this, titleModel);
        const newGameButton = new NewGameButton(this);
        const continueButton = new ContinueButton(this);
        const optionButton = new OptionButton(this);

        this.presenter = new TitlePresenter(
            this,
            titleModel,
            option,
            opening,
            logo,
            newGameButton,
            continueButton,
            optionButton
        );

        // 実行開始
        await this.presenter.execute();

        this.events.once('shutdown', () => {
            if (this.presenter) {
                this.presenter.destroy();
            }
        });
    }

    // update(time: number, delta: number) {
    //     this.presenter.update(time, delta);
    // }

    changeScene() {
        console.log("Title changeScene");
        this.scene.start('MainMenu');
    }
}
