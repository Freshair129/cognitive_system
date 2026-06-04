import { Plugin, WorkspaceLeaf, TFile, Notice } from 'obsidian';
import { JitContextView, JIT_CONTEXT_VIEW_TYPE } from './JitContextView';

export default class GenesisObsidianPlugin extends Plugin {
    private rebuildTimeout: NodeJS.Timeout | null = null;

    async onload() {
        console.log('Loading Genesis Shadow Sync Plugin');

        // Register the Sidebar View
        this.registerView(
            JIT_CONTEXT_VIEW_TYPE,
            (leaf) => new JitContextView(leaf)
        );

        // Add Ribbon Icon to open the Sidebar View
        this.addRibbonIcon('network', 'Open Genesis JIT Context', () => {
            this.activateView();
        });

        // Add Command to open the Sidebar View
        this.addCommand({
            id: 'open-genesis-jit-context',
            name: 'Open Genesis JIT Context View',
            callback: () => {
                this.activateView();
            }
        });

        // Feature A: Shadow Sync (Vault -> DB)
        this.registerEvent(
            this.app.vault.on('modify', async (file: TFile) => {
                await this.handleFileModified(file);
            })
        );
        
        // Feature B: JIT Context Update on File Open
        this.registerEvent(
            this.app.workspace.on('file-open', (file: TFile | null) => {
                if (file) {
                    this.updateContextView(file);
                }
            })
        );
    }

    onunload() {
        console.log('Unloading Genesis Shadow Sync Plugin');
        if (this.rebuildTimeout) clearTimeout(this.rebuildTimeout);
    }

    async activateView() {
        const { workspace } = this.app;
        
        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType(JIT_CONTEXT_VIEW_TYPE);
        
        if (leaves.length > 0) {
            leaf = leaves[0];
        } else {
            const rightLeaf = workspace.getRightLeaf(false);
            if (rightLeaf) {
                leaf = rightLeaf;
                await leaf.setViewState({ type: JIT_CONTEXT_VIEW_TYPE, active: true });
            }
        }

        if (leaf) {
            workspace.revealLeaf(leaf);
        }
    }

    async updateContextView(file: TFile) {
        const leaves = this.app.workspace.getLeavesOfType(JIT_CONTEXT_VIEW_TYPE);
        if (leaves.length === 0) return; 

        const view = leaves[0].view as JitContextView;
        const fileId = file.basename;
        await view.updateContext(fileId);
    }

    async handleFileModified(file: TFile) {
        if (file.extension !== 'md') return;

        const cache = this.app.metadataCache.getFileCache(file);
        const frontmatter = cache?.frontmatter;
        if (!frontmatter) return;

        const id = frontmatter.id || file.basename;
        const type = frontmatter.type || 'note';
        
        const content = await this.app.vault.read(file);
        const genesisRegex = /```json:genesis\n([\s\S]*?)\n```/g;
        
        // ARCHITECTURAL OPTIMIZATION: Pre-filter properties
        // Only include specific valuable keys to keep RAM footprint lean
        let props: Record<string, any> = {};
        const allowedKeys = ['status', 'title', 'tags', 'created', 'updated', 'impact_override'];
        for (const key of allowedKeys) {
            if (frontmatter[key] !== undefined) props[key] = frontmatter[key];
        }

        let embedding: number[] | null = null;
        let match;
        while ((match = genesisRegex.exec(content)) !== null) {
            try {
                const parsed = JSON.parse(match[1]);
                if (parsed.embedding) {
                    embedding = parsed.embedding;
                    delete parsed.embedding;
                }
                // Merge other genesis-specific props
                props = { ...props, ...parsed };
            } catch (e) {
                console.error("Failed to parse json:genesis block in", file.path, e);
            }
        }

        // Send to GenesisDB Server
        try {
            const response = await fetch('http://127.0.0.1:3000/v1/node/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: id,
                    labels: [type],
                    props: props,
                    embedding: embedding
                })
            });

            if (!response.ok) {
                console.error("Shadow Sync Failed:", await response.text());
            } else {
                console.debug(`Shadow Sync: ${id} updated in GenesisDB`);
                // ARCHITECTURAL OPTIMIZATION: Trigger Idle Rebuild (10s debounce)
                this.scheduleIdleRebuild();
            }
        } catch (e) {
            console.error("Shadow Sync Error: Cannot reach GenesisDB", e);
        }
    }

    private scheduleIdleRebuild() {
        if (this.rebuildTimeout) clearTimeout(this.rebuildTimeout);
        this.rebuildTimeout = setTimeout(async () => {
            try {
                console.log("GenesisDB: Triggering Idle Index Rebuild...");
                const response = await fetch('http://127.0.0.1:3000/v1/bulk/rebuild', { method: 'POST' });
                if (response.ok) {
                    console.log("GenesisDB: Idle Index Rebuild Complete.");
                    new Notice("GenesisDB: Brain Rebuilt (Idle Sync)");
                }
            } catch (e) {
                console.error("Idle Rebuild Failed:", e);
            }
        }, 10000); // 10 seconds of idle
    }
}
