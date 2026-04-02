# 📝 Todo CLI

A high-performance, minimalist, and Zero-UI **Todo CLI** for macOS. Execute, see output, and exit instantly.

---

## 📦 Installation

```bash
npm install -g @omericin/todo-cli
```

> **💡 Best Experience:** Use **[JetBrains Mono Nerd Font](https://www.nerdfonts.com/font-downloads)** for beautiful icons (`󰄰`, `󰄬`, `󰈸`).

---

## 🚀 Usage

| Command | Description |
| :--- | :--- |
| `todo [list]` | Show all tasks (organized by groups/tabs) |
| `todo add [group] <text>` | Add a task. Optional `group` or uses active group |
| `todo add <text> --high` | Add a high-priority task |
| `todo done <id>` | Mark a task as completed |
| `todo delete <id>` | Remove a task (aliases: `rm`, `del`) |
| `todo edit <id>` | Edit task text in your default `$EDITOR` |

### 📁 Folders & Groups

| Command | Description |
| :--- | :--- |
| `todo group <name>` | Create and/or set the active group |
| `todo g <name> open/close` | Toggle group visibility (collapsed state) |
| `todo g <name> rm/delete` | Remove a group and its associated tasks |
| `todo tab [name]` | Switch between top-level tabs |
| `todo tab-rm <name>` | Remove an entire tab |
| `todo tab-mv <old> <new>` | Rename an existing tab |

---

## ⚙️ Config
Stored at `~/.my-todo-list.json`. Includes `useNerdFonts: boolean` for fallback.

## 📄 License
ISC
