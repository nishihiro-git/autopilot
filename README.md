# Instagram AI Keyword Manager

AI を活用した Instagram 投稿自動化ツールです。キーワードと指示を設定するだけで、AI が情報収集から画像・キャプション生成まで自動で行います。

## 機能

### 🎯 主要機能

- **キーワード管理**: 投稿したいキーワードを設定
- **デザイン指示**: 画像のスタイルや雰囲気を指定
- **キャプション指示**: キャプションの構成やトーンを指定
- **投稿スケジュール**: 曜日・時間別の投稿スケジュール設定
- **自動投稿生成**: スケジュール 30 分前に自動で投稿を生成

### 🤖 AI 機能

- **情報取得**: OpenAI GPT-4o-mini でキーワード関連の最新情報を収集
- **画像生成**: Unsplash/Pexels から適切な画像を自動検索
- **キャプション生成**: 取得した情報と指示を基に魅力的なキャプションを生成

### ⏰ 自動化機能

- **Vercel Cron**: 5 分ごとにスケジュールをチェック
- **自動生成**: 投稿予定時刻の 30 分前に自動で投稿を生成
- **データベース保存**: 生成された投稿を自動保存

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router), React, TypeScript
- **UI**: Tailwind CSS, shadcn/ui
- **認証**: NextAuth.js
- **データベース**: Prisma + SQLite (開発) / PostgreSQL (本番)
- **AI**: OpenAI GPT-4o-mini
- **画像**: Unsplash API, Pexels API
- **自動化**: Vercel Cron Jobs

## セットアップ

### 1. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```bash
# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-in-production

# Database
DATABASE_URL="file:./dev.db"

# AI APIs
OPENAI_API_KEY=your-openai-api-key-here
UNSPLASH_ACCESS_KEY=your-unsplash-access-key-here
PEXELS_API_KEY=your-pexels-api-key-here

# Vercel Cron
CRON_SECRET=your-cron-secret-key-here
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. データベースのセットアップ

```bash
npx prisma generate
npx prisma db push
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

## Vercel デプロイ

### 1. GitHub リポジトリの作成

プロジェクトを GitHub に push してください。

### 2. Vercel プロジェクトの作成

1. [Vercel](https://vercel.com/)でアカウント作成
2. GitHub リポジトリを選択してプロジェクト作成
3. 環境変数を Vercel の管理画面で設定

### 3. 本番データベースの設定

Vercel では SQLite が使えないため、以下のいずれかの外部データベースを使用してください：

- **PlanetScale** (MySQL 互換)
- **Supabase** (PostgreSQL 互換)
- **Neon** (PostgreSQL)

### 4. 自動化の確認

- Vercel の「Functions」→「Cron Jobs」で自動実行の履歴を確認
- 5 分ごとに`/api/ai/auto-generate-vercel`が実行されます

## 使用方法

### 1. 設定

1. キーワードを設定
2. デザイン指示を入力
3. キャプション指示を入力
4. 投稿スケジュールを設定

### 2. 自動生成

- 設定したスケジュールの 30 分前に自動で投稿が生成されます
- 生成された投稿は「自動生成された投稿」セクションで確認できます

### 3. 投稿

- 生成された投稿の情報・画像・キャプションをコピー
- Instagram に手動で投稿

## ファイル構成

```
├── app/
│   ├── api/
│   │   ├── ai/
│   │   │   ├── auto-generate/          # 自動投稿生成API
│   │   │   ├── auto-generate-vercel/   # Vercel Cron用バッチAPI
│   │   │   └── generate-post/          # 手動投稿生成API
│   │   ├── auth/                       # 認証関連
│   │   ├── generated-posts/            # 生成された投稿取得API
│   │   └── settings/                   # 設定保存・読み込みAPI
│   ├── components/                     # UIコンポーネント
│   └── ...
├── prisma/
│   └── schema.prisma                   # データベーススキーマ
└── vercel.json                         # Vercel設定
```

## 注意事項

- **API キー**: OpenAI、Unsplash、Pexels の API キーが必要です
- **データベース**: 本番環境では外部データベースを使用してください
- **自動化**: Vercel Cron は無料枠でも利用可能ですが、実行頻度に制限があります

## ライセンス

MIT License
