# 📝 Todo CLI (@omericin/todo-cli)

![npm version](https://img.shields.io/npm/v/@omericin/todo-cli?style=flat-square&color=cyan)
![license](https://img.shields.io/npm/l/@omericin/todo-cli?style=flat-square)

A high-performance, minimalist, and Zero-UI **Todo CLI** tailored specifically for macOS. Designed for maximum developer productivity with zero context switching. 

You execute commands, get a quick terminal output, and the program exits immediately. No persistent terminal UIs to get stuck in! 🚀

---

## ✨ Features

- **⚡ Blazing Fast:** Bundled into a single ESM file, it executes and quits instantly.
- **📁 Multi-tab / Folder Support:** Organize your tasks into different contexts (e.g., `work`, `home`, `shop`). Switch between them instantly.
- **🎨 Nerd Font Support:** First-class, beautiful iconography if you have a Nerd Font installed (e.g., `󰄰`, `󰄬`, `󰈸`). Elegantly falls back to clean ASCII if missing. 
- **📝 Native Editor Integration:** Need to write a complex task? Easily drop into your preferred system editor (like `vim` or `nano`) by running `todo edit <id>`. 
- **💾 Local Persistence:** Safely stores your tasks locally in your home directory `~/.my-todo-list.json`. Your last active tab is automatically remembered!

---

## 📦 Installation

To install globally via npm:

```bash
npm install -g @omericin/todo-cli
```

> **💡 Pro Tip for the Best Experience:**  
> This CLI heavily relies on beautiful iconography. We highly recommend installing and setting your terminal font to **[JetBrains Mono Nerd Font](https://www.nerdfonts.com/font-downloads)** to render the checkmarks (`󰄰`, `󰄬`, `󰈸`) perfectly! If your terminal does not use a Nerd Font, it will gracefully fall back to generic ASCII characters like `[x]` and `( )`.

---

## 🚀 Usage

The syntax is just `todo [command]`. Running `todo` alone will default to listing your tasks.

### `todo list` (or just `todo`)
Displays all your current tasks in a beautifully formatted, non-bordered list.

```bash
todo list
# 1. 󰄰 Read the new API docs
# 2. 󰈸 Fix production bug
```

### `todo add "<task>"`
Quickly adds a new task.

```bash
todo add "Buy milk"
# Task added: "Buy milk"

# You can also add high priority tasks:
todo add "Call the client" --high
```

### `todo done <id>`
Marks the task with the specified ID as completed.

```bash
todo done 1
# Task 1 marked as completed.
```

### `todo edit <id>`
Opens the specific task in your system's default `$EDITOR` (falls back to `nano`). Great for correcting typos or adding longer task descriptions without dealing with CLI quotes.

```bash
todo edit 1
# (Opens your editor. Just save and exit when done!)
```

### `todo delete <id>` (aliases: `rm`, `remove`, `del`)
Removes the specified task entirely from your list.

```bash
todo delete 2
# Or using aliases:
todo rm 2
todo del 2
# Task 2 removed: "Fix production bug"
```

### `todo tab [name]`
Switch between different task lists (folders/tabs). If no name is provided, it simply lists the current tab's tasks and shows all available tabs. The CLI remembers your last active tab.

```bash
todo tab "work"
# Switched to tab: work
#   default   [ work ]
# ──────────────────────────────────────────────────
# No tasks in 'work'. Use `todo add <task>` to create one.
```

### `todo tab-rm <name>`
Removes a specific tab and all of its tasks permanently.

```bash
todo tab-rm "work"
# Tab removed: work
```

### `todo tab-rename <oldName> <newName>` (aliases: `tab-mv`, `tab-edit`)
Renames an existing tab.

```bash
todo tab-rename "work" "office"
# Or using aliases:
todo tab-mv "work" "office"
# Tab renamed from 'work' to 'office'
```

---

## ⚙️ Configuration
The configuration is stored securely at `~/.my-todo-list.json`. Under the hood, if you ever browse the config, you have access to a `useNerdFonts: boolean` property which you can disable if you prefer raw ASCII characters like `( )` and `[x]`.

## 📄 License
ISC
