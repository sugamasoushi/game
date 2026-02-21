これは、[`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) でブートストラップされた [Next.js](https://nextjs.org) プロジェクトです。

## はじめに

まず、開発サーバーを起動します。

```bash
npm run dev
# または
yarn dev
# または
pnpm dev
# または
bun dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開き、結果を確認してください。

`app/page.tsx` を編集することで、ページの更新を開始できます。ファイルを編集すると、ページは自動的に更新されます。

このプロジェクトでは、[`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) を使用して、Vercel の新しいフォントファミリーである [Geist](https://vercel.com/font) を自動的に最適化して読み込んでいます。

## 詳細情報

Next.js について詳しく知るには、以下のリソースを参照してください。

- [Next.js ドキュメント](https://nextjs.org/docs) - Next.js の機能と API について学びます。
- [Learn Next.js](https://nextjs.org/learn) - インタラクティブな Next.js チュートリアルです。

[Next.js の GitHub リポジトリ](https://github.com/vercel/next.js) もぜひチェックしてください。フィードバックや貢献をお待ちしています！

## Vercel へのデプロイ

Next.js アプリをデプロイする最も簡単な方法は、Next.js の作成者による [Vercel プラットフォーム](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) を使用することです。

詳細は、[Next.js のデプロイメントドキュメント](https://nextjs.org/docs/app/building-your-application/deploying) を確認してください。


## Electron：Windowsの実行形式を作成

```bash
# インストール（済なら不要）
npm install electron-serve

# ビルド
npm run electron:build

# 実行確認のみ
npm run electron:dev
```

## PWA：スマホインストール形式