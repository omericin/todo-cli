#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import {
    getTasks,
    saveTasks,
    Task,
    getActiveTab,
    setActiveTab,
    getAllTabNames,
    deleteTab,
    renameTab,
    getGroups,
    getActiveGroup,
    setActiveGroup,
    setGroupCollapsed,
    deleteGroup,
    getConfig,
    setConfig
} from './storage.js';
import { getIcon } from './theme.js';
import { spawn } from 'child_process';
import os from 'os';
import fs from 'fs';
import path from 'path';

const program = new Command();

program
    .name('todo')
    .description('A high-performance, minimalist Todo CLI for macOS')
    .version('1.1.0');

const listTasks = () => {
    const tabs = getAllTabNames();
    const activeTab = getActiveTab();
    const groups = getGroups();
    const activeGroup = getActiveGroup();
    const config = getConfig();
    const useNerdFonts = config?.useNerdFonts ?? false;

    const tabHeaders = tabs.map(t => {
        if (t === activeTab) {
            return chalk.cyan.bold(`[ ${t} ]`);
        }
        return chalk.gray(`  ${t}  `);
    }).join(' ');

    console.log(tabHeaders);
    console.log(chalk.gray('─'.repeat(50)));

    const tasks = getTasks();
    const groupNamesFromStorage = Object.keys(groups);

    // Group tasks
    const groupedTasks: Record<string, Task[]> = {};
    const noGroupTasks: Task[] = [];

    tasks.forEach(task => {
        if (task.group) {
            if (!groupedTasks[task.group]) groupedTasks[task.group] = [];
            groupedTasks[task.group].push(task);
        } else {
            noGroupTasks.push(task);
        }
    });

    const allGroupNames = Array.from(new Set([...Object.keys(groupedTasks), ...groupNamesFromStorage])).sort();

    if (noGroupTasks.length === 0 && allGroupNames.length === 0) {
        console.log(chalk.gray(`No tasks in '${activeTab}'. Use \`todo add <task>\` to create one.`));
        return;
    }

    const renderTask = (task: Task) => {
        let icon = getIcon(task.completed ? 'done' : (task.priority === 'high' ? 'urgent' : 'todo'));
        let text = task.text;

        if (task.completed) {
            text = chalk.gray.strikethrough(text);
            icon = chalk.green(icon);
        } else if (task.priority === 'high') {
            text = chalk.red(text);
            icon = chalk.red(icon);
        } else {
            icon = chalk.cyan(icon);
        }

        console.log(`  ${chalk.gray(task.id + '.')} ${icon} ${text}`);
    };

    // Render no-group tasks first
    if (noGroupTasks.length > 0) {
        noGroupTasks.forEach(renderTask);
    }

    // Render grouped tasks
    allGroupNames.forEach(name => {
        const collapsed = groups[name]?.collapsed || false;
        let icon: string;
        if (useNerdFonts) {
            icon = collapsed ? '▶' : '▼';
        } else {
            icon = collapsed ? '>' : 'v';
        }
        const activeLabel = name === activeGroup ? chalk.dim(' (active)') : '';

        console.log(`${chalk.yellow(icon)} ${chalk.bold(name)}${activeLabel}`);

        if (!collapsed) {
            const groupTasks = groupedTasks[name] || [];
            groupTasks.forEach(renderTask);
        }
    });
};

program
    .command('list')
    .description('Displays tasks in a clean, non-bordered table format.')
    .action(listTasks);

program
    .command('add [group] [task]')
    .description('Adds a new task. If group is provided, task is added to that group.')
    .option('--high', 'Set priority to high')
    .action((groupOrTask: string, taskStr: string | undefined, options: { high?: boolean }) => {
        let group: string | undefined;
        let text: string;

        // If two arguments are provided: todo add group "task text"
        if (taskStr) {
            group = groupOrTask;
            text = taskStr;
        } else {
            // If only one argument: todo add "task text"
            // Use activeGroup if it exists
            group = getActiveGroup();
            text = groupOrTask;
        }

        if (!text) {
            console.log(chalk.red('Task text is required.'));
            return;
        }

        const tasks = getTasks() || [];
        const id = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
        const newTask: Task = {
            id,
            text,
            completed: false,
            priority: options.high ? 'high' : 'normal',
            group: group || undefined
        };

        tasks.push(newTask);
        saveTasks(tasks);
        console.log(chalk.green(`Task added to ${group ? `group '${group}'` : 'no group'}: "${text}"`));
    });

program
    .command('group <name> [status]')
    .alias('g')
    .description('Manage groups. Sets active group or toggles open/close.')
    .action((name: string, status: string | undefined) => {
        if (!status) {
            setActiveGroup(name);
            console.log(chalk.green(`Active group set to: ${name}`));
        } else if (status === 'open' || status === 'close') {
            setGroupCollapsed(name, status === 'close');
            console.log(chalk.green(`Group '${name}' is now ${status === 'close' ? 'closed' : 'opened'}.`));
        } else if (status === 'rm' || status === 'delete') {
            deleteGroup(name);
            console.log(chalk.red(`Group '${name}' and its tasks removed.`));
        } else {
            console.log(chalk.red(`Invalid status: ${status}. Use 'open' or 'close'.`));
        }
        listTasks();
    });

program
    .command('done <id>')
    .description('Marks task as completed.')
    .action((idStr: string) => {
        const id = parseInt(idStr, 10);
        const tasks = getTasks() || [];
        const task = tasks.find(t => t.id === id);
        if (!task) {
            console.log(chalk.red(`Task with id ${id} not found.`));
            return;
        }
        task.completed = true;
        saveTasks(tasks);
        console.log(chalk.green(`Task ${id} marked as completed.`));
    });

program
    .command('delete <id>')
    .alias('rm')
    .alias('remove')
    .alias('del')
    .description('Removes a task.')
    .action((idStr: string) => {
        const id = parseInt(idStr, 10);
        const tasks = getTasks() || [];
        const idx = tasks.findIndex(t => t.id === id);
        if (idx === -1) {
            console.log(chalk.red(`Task with id ${id} not found.`));
            return;
        }
        const removed = tasks.splice(idx, 1);
        saveTasks(tasks);
        console.log(chalk.green(`Task ${id} removed: "${removed[0].text}"`));
    });

program
    .command('edit <id>')
    .description('Opens the specific task in the default editor (Vim/Nano).')
    .action((idStr: string) => {
        const id = parseInt(idStr, 10);
        const tasks = getTasks() || [];
        const task = tasks.find(t => t.id === id);
        if (!task) {
            console.log(chalk.red(`Task with id ${id} not found.`));
            return;
        }

        const tmpPath = path.join(os.tmpdir(), `todo-edit-${id}.txt`);
        fs.writeFileSync(tmpPath, task.text);

        const editor = process.env.EDITOR || 'nano';
        const child = spawn(editor, [tmpPath], { stdio: 'inherit' });

        child.on('exit', () => {
            const newText = fs.readFileSync(tmpPath, 'utf8').trim();
            if (newText && newText !== task.text) {
                task.text = newText;
                saveTasks(tasks);
                console.log(chalk.green(`Task ${id} updated.`));
            } else {
                console.log(chalk.gray('No changes made.'));
            }
            try { fs.unlinkSync(tmpPath); } catch (e) { }
        });
    });

program
    .command('tab [name]')
    .description('Switch to a different tab or list tasks if no name provided.')
    .action((name: string | undefined) => {
        if (name) {
            setActiveTab(name);
            console.log(chalk.green(`Switched to tab: ${name}`));
        }
        listTasks();
    });

program
    .command('tab-rm <name>')
    .description('Remove a tab and all its tasks.')
    .action((name: string) => {
        deleteTab(name);
        console.log(chalk.red(`Tab removed: ${name}`));
        listTasks();
    });

program
    .command('tab-rename <oldName> <newName>')
    .alias('tab-mv')
    .alias('tab-edit')
    .description('Rename an existing tab.')
    .action((oldName: string, newName: string) => {
        const success = renameTab(oldName, newName);
        if (success) {
            console.log(chalk.green(`Tab renamed from '${oldName}' to '${newName}'`));
        } else {
            console.log(chalk.red(`Failed to rename tab. Does '${oldName}' exist or is '${newName}' already taken?`));
        }
        listTasks();
    });

program
    .command('config <key> <value>')
    .description('Configure settings. e.g., todo config nerd-fonts off')
    .action((key: string, value: string) => {
        const config = getConfig();
        if (key === 'nerd-fonts' || key === 'nerdfonts') {
            const enabled = value === 'on' || value === 'true' || value === '1';
            config.useNerdFonts = enabled;
            setConfig(config);
            console.log(chalk.green(`Nerd Fonts ${enabled ? 'enabled' : 'disabled'}.`));
        } else {
            console.log(chalk.red(`Unknown config key: ${key}`));
        }
    });

// Handle 'todo' without commands to list tasks by default
if (process.argv.length === 2 && !process.argv[2]) {
    listTasks();
} else {
    program.parse(process.argv);
}
