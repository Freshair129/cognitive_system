import { Plugin, WorkspaceLeaf, TFile, Notice } from 'obsidian';
import { JitContextView, JIT_CONTEXT_VIEW_TYPE } from './JitContextView';

export default class GenesisObsidianPlugin extends Plugin {
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
        // Find the active JIT Context View
        const leaves = this.app.workspace.getLeavesOfType(JIT_CONTEXT_VIEW_TYPE);
        if (leaves.length === 0) return; // View not open

        const view = leaves[0].view as JitContextView;
        
        // Extract a clean ID from the filename (e.g., "FEAT--TAX-DEDUCT.md" -> "FEAT--TAX-DEDUCT")
        const fileId = file.basename;
        
        await view.updateContext(fileId);
    }

    async handleFileModified(file: TFile) {
        if (file.extension !== 'md') return;

        // Parse Frontmatter using Obsidian's metadata cache
        const cache = this.app.metadataCache.getFileCache(file);
        const frontmatter = cache?.frontmatter;

        if (!frontmatter) return;

        const id = frontmatter.id || file.basename;
        const type = frontmatter.type || 'note';
        
        // Read the file content to parse json:genesis blocks
        const content = await this.app.vault.read(file);
        const genesisRegex = /```json:genesis\n([\s\S]*?)\n```/g;
        let props: Record<string, any> = { ...frontmatter };
        delete props.id;
        delete props.type;

        let embedding: number[] | null = null;

        let match;
        while ((match = genesisRegex.exec(content)) !== null) {
            try {
                const parsed = JSON.parse(match[1]);
                if (parsed.embedding) {
                    embedding = parsed.embedding;
                    delete parsed.embedding;
                }
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
            }
        } catch (e) {
            console.error("Shadow Sync Error: Cannot reach GenesisDB", e);
        }
    }
}
