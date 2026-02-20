import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

type Status = {
  Lv: number,
  HP: number,
  MP: number,
  MaxHP: number,
  MaxMP: number,
  Attack: number,
  Guard: number,
  Speed: number
}

const PLAYER_STATEUS: Status = {
  Lv: 1,
  HP: 40,
  MP: 10,
  MaxHP: 50,
  MaxMP: 20,
  Attack: 30,
  Guard: 5,
  Speed: 10
};

export class ScoreStore {
  // 内部保持用。初期値をセット。
  private state$ = new BehaviorSubject<Status>(PLAYER_STATEUS);

  // 外部公開用のObservable。scoreだけを抜き出して公開。
  public readonly hp$: Observable<number> = this.state$.pipe(map(state => state.HP));

  // 状態更新メソッド
  //「今の状態をコピーして、HPだけを安全に計算し直し、新しい状態として再配布する」という一連の処理を安全に行っている
  public damage(amount: number): void {
    const currentState = this.state$.value;
    this.state$.next({
      ...currentState,//まずは全ての値を取得、※元の保持データ（参照先）の変更はこのように書く
      HP: Math.max(0, currentState.HP - amount)//値更新、０未満にはならないらしい
    });
  }

  //状態のリセットは必ず意識する事
  public reset(): void {
    this.state$.next(PLAYER_STATEUS);
  }

  // 現在の値を即時取得するためのゲッター
  public get currentHP(): number { return this.state$.value.HP; }
}

// 唯一のインスタンスを公開（シングルトン）
export const scoreStore = new ScoreStore();