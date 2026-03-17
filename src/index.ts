#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { getTasks, saveTasks, Task, getActiveTab, setActiveTab, getAllTabNames, deleteTab, renameTab } from './storage.js';
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

    const tabHeaders = tabs.map(t => {
        if (t === activeTab) {
            return chalk.cyan.bold(`[ ${t} ]`);
        }
        return chalk.gray(`  ${t}  `);
    }).join(' ');

    console.log(tabHeaders);
    console.log(chalk.gray('─'.repeat(50)));

    const tasks = getTasks();
    if (!tasks || tasks.length === 0) {
        console.log(chalk.gray(`No tasks in '${activeTab}'. Use \`todo add <task>\` to create one.`));
        return;
    }

    tasks.forEach(task => {
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

        console.log(`${chalk.gray(task.id + '.')} ${icon} ${text}`);
    });
};

program
    .command('list')
    .description('Displays tasks in a clean, non-bordered table format.')
    .action(listTasks);

program
    .command('add <task>')
    .description('Adds a new task.')
    .option('--high', 'Set priority to high')
    .action((taskStr, options) => {
        const tasks = getTasks() || [];
        const id = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
        const newTask: Task = {
            id,
            text: taskStr,
            completed: false,
            priority: options.high ? 'high' : 'normal',
        };
        tasks.push(newTask);
        saveTasks(tasks);
        console.log(chalk.green(`Task added: "${taskStr}"`));
    });

program
    .command('done <id>')
    .description('Marks task as completed.')
    .action((idStr) => {
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
    .action((idStr) => {
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
    .action((idStr) => {
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
    .action((name) => {
        if (name) {
            setActiveTab(name);
            console.log(chalk.green(`Switched to tab: ${name}`));
        }
        listTasks();
    });

program
    .command('tab-rm <name>')
    .description('Remove a tab and all its tasks.')
    .action((name) => {
        deleteTab(name);
        console.log(chalk.red(`Tab removed: ${name}`));
        listTasks();
    });

program
    .command('tab-rename <oldName> <newName>')
    .alias('tab-mv')
    .alias('tab-edit')
    .description('Rename an existing tab.')
    .action((oldName, newName) => {
        const success = renameTab(oldName, newName);
        if (success) {
            console.log(chalk.green(`Tab renamed from '${oldName}' to '${newName}'`));
        } else {
            console.log(chalk.red(`Failed to rename tab. Does '${oldName}' exist or is '${newName}' already taken?`));
        }
        listTasks();
    });

// Handle 'todo' without commands to list tasks by default
if (process.argv.length === 2 && !process.argv[2]) {
    listTasks();
} else {
    program.parse(process.argv);
}
