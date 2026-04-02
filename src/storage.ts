import Conf from 'conf';
import os from 'os';
import path from 'path';

export interface Task {
    id: number;
    text: string;
    completed: boolean;
    priority: 'normal' | 'high';
    group?: string;
}

export interface GroupInfo {
    collapsed: boolean;
}

export interface TabData {
    tasks: Task[];
    groups: Record<string, GroupInfo>;
    activeGroup?: string;
}

export interface ConfigData {
    tabs: Record<string, TabData>;
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
        tabs: {
            'default': {
                tasks: [],
                groups: {},
                activeGroup: undefined
            }
        },
        activeTab: 'default',
        config: {
            useNerdFonts: true
        }
    }
});

// Migration logic
const rawTabs = storage.get('tabs') as any;
if (rawTabs) {
    let migrated = false;
    for (const key of Object.keys(rawTabs)) {
        if (Array.isArray(rawTabs[key])) {
            rawTabs[key] = {
                tasks: rawTabs[key],
                groups: {},
                activeGroup: undefined
            };
            migrated = true;
        }
    }
    if (migrated) {
        storage.set('tabs', rawTabs);
    }
}

// Old migration logic for even older versions
if (storage.has('tasks' as any)) {
    const oldTasks = storage.get('tasks' as any) as Task[];
    if (oldTasks && oldTasks.length > 0) {
        const tabs = storage.get('tabs');
        if (!tabs['default']) {
            tabs['default'] = { tasks: oldTasks, groups: {}, activeGroup: undefined };
        } else if (tabs['default'].tasks.length === 0) {
            tabs['default'].tasks = oldTasks;
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
        tabs[tab] = {
            tasks: [],
            groups: {},
            activeGroup: undefined
        };
        storage.set('tabs', tabs);
    }
}

export function getTabs(): Record<string, TabData> {
    return storage.get('tabs') || { 'default': { tasks: [], groups: {}, activeGroup: undefined } };
}

export function getTasks(): Task[] {
    const tabs = getTabs();
    const active = getActiveTab();
    return tabs[active]?.tasks || [];
}

export function saveTasks(tasks: Task[]): void {
    const tabs = getTabs();
    const active = getActiveTab();
    if (tabs[active]) {
        tabs[active].tasks = tasks;
        storage.set('tabs', tabs);
    }
}

export function getGroups(): Record<string, GroupInfo> {
    const tabs = getTabs();
    const active = getActiveTab();
    return tabs[active]?.groups || {};
}

export function saveGroups(groups: Record<string, GroupInfo>): void {
    const tabs = getTabs();
    const active = getActiveTab();
    if (tabs[active]) {
        tabs[active].groups = groups;
        storage.set('tabs', tabs);
    }
}

export function getActiveGroup(): string | undefined {
    const tabs = getTabs();
    const active = getActiveTab();
    return tabs[active]?.activeGroup;
}

export function setActiveGroup(groupName: string | undefined): void {
    const tabs = getTabs();
    const active = getActiveTab();
    if (tabs[active]) {
        tabs[active].activeGroup = groupName;
        // ensure group exists in groups record
        if (groupName && !tabs[active].groups[groupName]) {
            tabs[active].groups[groupName] = { collapsed: false };
        }
        storage.set('tabs', tabs);
    }
}

export function setGroupCollapsed(groupName: string, collapsed: boolean): void {
    const groups = getGroups();
    if (!groups[groupName]) {
        groups[groupName] = { collapsed };
    } else {
        groups[groupName].collapsed = collapsed;
    }
    saveGroups(groups);
}

export function deleteGroup(groupName: string): void {
    const tabs = getTabs();
    const active = getActiveTab();
    if (tabs[active]) {
        // Remove from groups record
        delete tabs[active].groups[groupName];

        // Remove tasks in this group
        tabs[active].tasks = tabs[active].tasks.filter(t => t.group !== groupName);

        // Handle active group
        if (tabs[active].activeGroup === groupName) {
            tabs[active].activeGroup = undefined;
        }

        storage.set('tabs', tabs);
    }
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
        storage.set('activeTab', newName);
    }

    return true;
}

export function getConfig(): ConfigData['config'] {
    return storage.get('config') as ConfigData['config'];
}

export function setConfig(config: ConfigData['config']): void {
    storage.set('config', config);
}
