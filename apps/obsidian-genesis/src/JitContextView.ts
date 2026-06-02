import { ItemView, WorkspaceLeaf, Notice } from 'obsidian';

export const JIT_CONTEXT_VIEW_TYPE = 'genesis-jit-context-view';

export class JitContextView extends ItemView {
    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType(): string {
        return JIT_CONTEXT_VIEW_TYPE;
    }

    getDisplayText(): string {
        return 'Genesis JIT Context';
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.createEl('h4', { text: 'Genesis JIT Context (H2)' });
        
        const contentDiv = container.createDiv('genesis-jit-content');
        contentDiv.createEl('p', { text: 'Open a file to load context...', cls: 'genesis-placeholder' });
    }

    async updateContext(fileId: string) {
        const container = this.containerEl.children[1].querySelector('.genesis-jit-content');
        if (!container) return;

        container.empty();
        container.createEl('p', { text: `Loading context for: ${fileId}...`, cls: 'genesis-loading' });

        try {
            // Call GenesisDB Standalone Server (HTTP Bridge)
            const response = await fetch('http://127.0.0.1:3000/v1/query/hql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: `TRAVERSE FROM ${fileId} DEPTH 2 REL requires`
            });

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${await response.text()}`);
            }

            const neighbors = await response.json();
            
            container.empty();

            if (!neighbors || neighbors.length === 0) {
                container.createEl('p', { text: 'No related knowledge found.', cls: 'genesis-placeholder' });
                return;
            }

            const list = container.createEl('ul', { cls: 'genesis-list' });
            
            for (const neighbor of neighbors) {
                const depth = neighbor.depth;
                const path = neighbor.path;
                const rel = path.length > 0 ? path[path.length - 1].rel : 'unknown';

                const li = list.createEl('li', { cls: 'genesis-list-item' });
                li.createEl('strong', { text: `[H${depth}] ${neighbor.node.id}` });
                
                const details = li.createEl('ul');
                details.createEl('li', { text: `Relation: ${rel}` });
                
                if (neighbor.node.labels && neighbor.node.labels.length > 0) {
                    details.createEl('li', { text: `Labels: ${neighbor.node.labels.join(', ')}` });
                }

                if (neighbor.node.props && Object.keys(neighbor.node.props).length > 0) {
                    const propsItem = details.createEl('li', { text: 'Properties:' });
                    const propsList = propsItem.createEl('ul');
                    for (const [key, value] of Object.entries(neighbor.node.props)) {
                        propsList.createEl('li', { text: `${key}: ${value}` });
                    }
                }
            }

        } catch (error) {
            container.empty();
            container.createEl('p', { text: `Error loading context: ${error}`, cls: 'genesis-error' });
            console.error('GenesisDB Error:', error);
            new Notice('GenesisDB connection failed. Is the Axum server running?');
        }
    }
}
