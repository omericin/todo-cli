import { getConfig } from './storage.js';

export function getIcon(type: 'todo' | 'done' | 'urgent'): string {
    const config = getConfig() || { useNerdFonts: true };
    const useNerdFonts = config.useNerdFonts;

    if (useNerdFonts) {
        switch (type) {
            case 'todo': return '󰄰';
            case 'done': return '󰄬';
            case 'urgent': return '󰈸';
        }
    } else {
        switch (type) {
            case 'todo': return '( )';
            case 'done': return '[x]';
            case 'urgent': return '(!)';
        }
    }
}
