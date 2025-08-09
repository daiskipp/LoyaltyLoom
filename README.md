# Customer Loyalty App（顧客ロイヤルティアプリ）

高齢者向けの使いやすいモバイル優先の顧客ロイヤルティアプリケーションです。RPGスタイルのマルチポイントシステム、QRコードチェックイン、ピアツーピアのコイン送金機能を提供します。

## 🚀 主な機能

### 認証・セキュリティ
- **Replit Auth統合**: OpenID Connect & パスキー認証対応
- **セッション管理**: PostgreSQL セッションストア
- **セキュアなログイン**: パスワードレス認証

### RPGスタイル ポイントシステム
- **4つの通貨システム**:
  - 🌟 **経験値 (Experience Points)**: レベルアップに使用
  - 💎 **ロイヤルティポイント**: 店舗での特典に使用
  - 🪙 **コイン**: ユーザー間で送金可能
  - 💎 **ジェム**: プレミアム報酬

### 店舗チェックイン
- **QRコードスキャン**: カメラを使用したリアルタイム読み取り
- **自動ポイント付与**: 各店舗で設定された報酬を自動付与
- **デモ店舗**: カフェ・ドリーム、ブックストア本の森、レストラン味楽

### コイン送金システム
- **ピアツーピア送金**: ユーザー間でのコイン送受信
- **アドレス帳機能**: 頻繁な送金先を自動保存
- **お気に入り機能**: よく送る相手をお気に入り登録
- **送金履歴**: 全ての取引記録を表示

### 高齢者向けUI
- **大きなフォント**: 18px以上のテキストサイズ
- **タッチフレンドリー**: 44px以上のボタンサイズ
- **高コントラスト**: 見やすい色彩設計
- **シンプルナビゲーション**: 直感的な操作性

## 🛠 技術スタック

### フロントエンド
- **React 18** + **TypeScript**: モダンなReact開発
- **Vite**: 高速な開発サーバーとビルドツール
- **Shadcn/UI**: Radix UI ベースのアクセシブルなコンポーネント
- **Tailwind CSS**: ユーティリティファーストのスタイリング
- **TanStack Query**: サーバー状態管理とキャッシング
- **Wouter**: 軽量なクライアントサイドルーティング

### バックエンド
- **Express.js** + **TypeScript**: RESTful API サーバー
- **Drizzle ORM**: 型安全なデータベース操作
- **PostgreSQL**: Neon serverless ホスティング
- **Express Session**: PostgreSQL セッションストア

### 認証・セキュリティ
- **Replit Auth**: OpenID Connect プロバイダー
- **Passport.js**: 認証ミドルウェア
- **WebAuthn**: パスキー認証（将来実装予定）

### 開発ツール
- **Drizzle Kit**: データベーススキーマ管理
- **ESBuild**: 高速なJavaScriptバンドラー
- **PostCSS**: CSS処理ツール

## 📦 セットアップ

### 前提条件
- Node.js 18以上
- PostgreSQL データベース（Neon推奨）

### インストール

1. **依存関係のインストール**:
```bash
npm install
```

2. **環境変数の設定**:
必要な環境変数が自動的に提供されます：
- `DATABASE_URL`: PostgreSQL接続文字列
- `SESSION_SECRET`: セッション暗号化キー
- `REPLIT_DOMAINS`: 認証用ドメイン設定

3. **データベースセットアップ**:
```bash
npm run db:push
```

4. **開発サーバー起動**:
```bash
npm run dev
```

アプリケーションは `http://localhost:5000` で起動します。

## 📁 プロジェクト構造

```
├── client/                 # フロントエンドソース
│   ├── src/
│   │   ├── components/     # 再利用可能なUIコンポーネント
│   │   ├── pages/          # ページコンポーネント
│   │   ├── hooks/          # カスタムReactフック
│   │   └── lib/            # ユーティリティ関数
├── server/                 # バックエンドソース
│   ├── db.ts              # データベース接続設定
│   ├── routes.ts          # API エンドポイント
│   ├── storage.ts         # データアクセス層
│   └── replitAuth.ts      # 認証設定
├── shared/                 # 共有型定義
│   └── schema.ts          # Drizzle スキーマ定義
├── migrations/            # データベースマイグレーション
└── components.json        # Shadcn/UI 設定
```

## 🗄 データベーススキーマ

### 主要テーブル

- **users**: ユーザー情報と全ポイント残高
- **stores**: 店舗情報とQRコード
- **point_transactions**: ポイント取引履歴
- **coin_transactions**: コイン送金履歴
- **address_book**: 送金先アドレス帳
- **store_visits**: 店舗訪問履歴
- **sessions**: セッション管理

## 🎮 使用方法

### 初回ログイン
1. アプリにアクセス
2. 「ログイン」ボタンをクリック
3. Replit認証で安全にログイン

### 店舗訪問
1. 「店舗チェックイン」をタップ
2. QRコードをスキャン
3. 自動的にポイントが付与されます

### コイン送金
1. 「コイン送金」をタップ
2. 送金先ユーザーIDを入力
3. 送金額とメッセージを入力
4. 「送金」ボタンで完了

### アドレス帳管理
1. コイン送金ページでアドレス帳タブを選択
2. ハートアイコンでお気に入り登録
3. 次回から簡単送金が可能

## 🔧 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# プロダクション起動
npm start

# 型チェック
npm run check

# データベースプッシュ
npm run db:push

# マイグレーション生成
npx drizzle-kit generate

# データベーススタジオ
npx drizzle-kit studio
```

## 🌟 特徴的な設計

### アクセシビリティ
- 高齢者向けの大きなフォントサイズ
- 十分なタッチターゲットサイズ
- 高コントラストの色彩設計
- シンプルで直感的なナビゲーション

### パフォーマンス
- Viteによる高速な開発体験
- TanStack Queryによる効率的なデータキャッシング
- 軽量なWouterルーティング

### セキュリティ
- Replit AuthによるOpenID Connect認証
- PostgreSQLセッションストア
- 型安全なAPI設計

## 🚀 デプロイメント

1. **Replit デプロイメント**:
   - プロジェクトをReplitでホスト
   - 自動的なTLS証明書
   - カスタムドメイン対応

2. **環境変数**:
   - 本番環境では適切な`DATABASE_URL`を設定
   - `SESSION_SECRET`は安全な値を使用

## 📝 ライセンス

MIT License

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📞 サポート

質問や問題がある場合は、GitHubのIssuesページでお知らせください。

---

**開発者**: Replit AI Agent  
**最終更新**: 2025年8月9日