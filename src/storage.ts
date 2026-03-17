import Conf from 'conf';
import os from 'os';
import path from 'path';

export interface Task {
    id: number;
    text: string;
    completed: boolean;
    priority: 'normal' | 'high';
}

export interface ConfigData {
    tasks?: Task[]; // kept for migration purposes
    tabs: Record<string, Task[]>;
    activeTab: string;
    config: {
        useNerdFonts: boolean;
    };
}

export const storage = new Conf<ConfigData>({
    cwd: os.homedir(),
    configName: '.my-todo-list',
    fileExtension: 'json',
    defaults: {
        tasks: [],
        tabs: {
            'default': []
        },
        activeTab: 'default',
        config: {
            useNerdFonts: true
        }
    }
});

// Migration logic: move old tasks to the default tab if needed
if (storage.has('tasks')) {
    const oldTasks = storage.get('tasks') as Task[];
    if (oldTasks && oldTasks.length > 0) {
        const tabs = storage.get('tabs') || {};
        if (!tabs['default']) {
            tabs['default'] = oldTasks;
        } else if (tabs['default'].length === 0) {
            tabs['default'] = oldTasks;
        }
        storage.set('tabs', tabs);
    }
    storage.delete('tasks' as any);
}

export function getActiveTab(): string {
    return storage.get('activeTab') || 'default';
}

export function setActiveTab(tab: string): void {
    storage.set('activeTab', tab);
    // ensure tab exists
    const tabs = getTabs();
    if (!tabs[tab]) {
        tabs[tab] = [];
        storage.set('tabs', tabs);
    }
}

export function getTabs(): Record<string, Task[]> {
    return storage.get('tabs') || { 'default': [] };
}

export function getTasks(): Task[] {
    const tabs = getTabs();
    const active = getActiveTab();
    return tabs[active] || [];
}

export function saveTasks(tasks: Task[]): void {
    const tabs = getTabs();
    const active = getActiveTab();
    tabs[active] = tasks;
    storage.set('tabs', tabs);
}

export function getAllTabNames(): string[] {
    return Object.keys(getTabs());
}

export function deleteTab(tab: string): void {
    const tabs = getTabs();
    delete tabs[tab];
    storage.set('tabs', tabs);
    if (getActiveTab() === tab) {
        const remaining = Object.keys(tabs);
        if (remaining.length > 0) {
            setActiveTab(remaining[0]);
        } else {
            setActiveTab('default');
        }
    }
}

export function renameTab(oldName: string, newName: string): boolean {
    const tabs = getTabs();
    if (!tabs[oldName] || tabs[newName]) {
        return false; // Tab doesn't exist or new name already taken
    }

    tabs[newName] = tabs[oldName];
    delete tabs[oldName];
    storage.set('tabs', tabs);

    if (getActiveTab() === oldName) {
        setActiveTab(newName);
    }

    return true;
}

export function getConfig(): ConfigData['config'] {
    return storage.get('config') as ConfigData['config'];
}

export function setConfig(config: ConfigData['config']): void {
    storage.set('config', config);
}
