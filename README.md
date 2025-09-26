# YuiHub VS Code Bridge

⚠️ **この拡張機能は Prototype（試作版）です。**  
- 機能は最小限です。  
- 安定性や後方互換性は保証されません。  
- 今後の開発に伴い、大きく仕様が変更される可能性があります。  

---

**VS Code から YuiHub API に最小疎通する拡張機能**  
Shelter モード前提：ユーザーが設定しない限り外部送信は行いません。

---

## 📌 主な機能

- スモークテスト：`GET /health` で YuiHub サーバとの疎通を確認  
- 検索：`GET /search?q&limit` でヒットを取得、QuickPick で選択・貼付  
- スレッド発行：`POST /threads/new` で新しい Thread ID を生成  
- 保存：`POST /save` で選択テキストを YuiHub に保存

---

## ⚙ インストール方法

1. Visual Studio Marketplace から拡張機能をインストール  
2. 拡張設定から以下を入力（`設定 > 拡張機能 > YuiHub`）：  
   - `yuihub.apiBaseUrl`（例: `http://localhost:3000`）  
   - `yuihub.apiKey`（任意。ない場合は認証なしモード）  
   - `yuihub.defaultSource`（`gpts | copilot | claude | human`）  
   - `yuihub.defaultAuthor`（例: `VSCode`）  
   - `yuihub.defaultThreadId`（空ならワークスペース保存 or 自動発行）  
   - `yuihub.searchLimit`（例: `10`）

---

## 🚀 使い方（コマンドパレット）

- `YuiHub: Smoke Test (Health)`  
- `YuiHub: Search…`  
- `YuiHub: Issue New Thread ID`  
- `YuiHub: Save Selection to Thread`

---

## 🛠 トラブルシュート

| 状況 | 解決案 |
|------|--------|
| スモークテストで失敗 | `apiBaseUrl` が間違っている、サーバ起動していない、ネットワーク接続確認 |
| 検索結果が取得されない | クエリが正しいか、limit が過度に低くないか |
| 保存に失敗する | 権限不足（APIキー）、Thread ID 未設定、APIエンドポイント構成不整合 |

---

## 🔒 プライバシーポリシー & データの扱い

- 送信先は **ユーザーが設定した YuiHub API のみ**  
- 拡張は **テレメトリを一切送信しません**  
- `Authorization: Bearer <apiKey>` は **設定がある場合のみ** 送信  
- `apiKey` は VS Code の設定ストレージ（将来的に SecretStorage に変更検討）

> プライバシーポリシーはコマンドパレットの `YuiHub: Open Privacy Policy` または [PRIVACY.md](./PRIVACY.md) から閲覧可能です。

---

## 📄 変更履歴

詳細は [CHANGELOG.md](CHANGELOG.md) をご参照ください。

---

## 🆘 サポート

- バグ報告・機能提案は [Issue](https://github.com/vemikrs/yuihub-copilot-chat/issues) まで  
- よくある質問は [SUPPORT.md](SUPPORT.md) を参照

---

## 📝 ライセンス

この拡張機能は MIT ライセンスにて公開されています。詳細は [LICENSE](LICENSE) をご覧ください。
