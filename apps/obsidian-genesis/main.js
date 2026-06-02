/* GenesisDB Obsidian Bridge */
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => GenesisObsidianPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian2 = require("obsidian");

// src/JitContextView.ts
var import_obsidian = require("obsidian");
var JIT_CONTEXT_VIEW_TYPE = "genesis-jit-context-view";
var JitContextView = class extends import_obsidian.ItemView {
  constructor(leaf) {
    super(leaf);
  }
  getViewType() {
    return JIT_CONTEXT_VIEW_TYPE;
  }
  getDisplayText() {
    return "Genesis JIT Context";
  }
  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl("h4", { text: "Genesis JIT Context (H2)" });
    const contentDiv = container.createDiv("genesis-jit-content");
    contentDiv.createEl("p", { text: "Open a file to load context...", cls: "genesis-placeholder" });
  }
  async updateContext(fileId) {
    const container = this.containerEl.children[1].querySelector(".genesis-jit-content");
    if (!container)
      return;
    container.empty();
    container.createEl("p", { text: `Loading context for: ${fileId}...`, cls: "genesis-loading" });
    try {
      const response = await fetch("http://127.0.0.1:3000/v1/query/hql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: `TRAVERSE FROM ${fileId} DEPTH 2 REL requires`
      });
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${await response.text()}`);
      }
      const neighbors = await response.json();
      container.empty();
      if (!neighbors || neighbors.length === 0) {
        container.createEl("p", { text: "No related knowledge found.", cls: "genesis-placeholder" });
        return;
      }
      const list = container.createEl("ul", { cls: "genesis-list" });
      for (const neighbor of neighbors) {
        const depth = neighbor.depth;
        const path = neighbor.path;
        const rel = path.length > 0 ? path[path.length - 1].rel : "unknown";
        const li = list.createEl("li", { cls: "genesis-list-item" });
        li.createEl("strong", { text: `[H${depth}] ${neighbor.node.id}` });
        const details = li.createEl("ul");
        details.createEl("li", { text: `Relation: ${rel}` });
        if (neighbor.node.labels && neighbor.node.labels.length > 0) {
          details.createEl("li", { text: `Labels: ${neighbor.node.labels.join(", ")}` });
        }
        if (neighbor.node.props && Object.keys(neighbor.node.props).length > 0) {
          const propsItem = details.createEl("li", { text: "Properties:" });
          const propsList = propsItem.createEl("ul");
          for (const [key, value] of Object.entries(neighbor.node.props)) {
            propsList.createEl("li", { text: `${key}: ${value}` });
          }
        }
      }
    } catch (error) {
      container.empty();
      container.createEl("p", { text: `Error loading context: ${error}`, cls: "genesis-error" });
      console.error("GenesisDB Error:", error);
      new import_obsidian.Notice("GenesisDB connection failed. Is the Axum server running?");
    }
  }
};

// src/main.ts
var GenesisObsidianPlugin = class extends import_obsidian2.Plugin {
  async onload() {
    console.log("Loading Genesis Shadow Sync Plugin");
    this.registerView(
      JIT_CONTEXT_VIEW_TYPE,
      (leaf) => new JitContextView(leaf)
    );
    this.addRibbonIcon("network", "Open Genesis JIT Context", () => {
      this.activateView();
    });
    this.addCommand({
      id: "open-genesis-jit-context",
      name: "Open Genesis JIT Context View",
      callback: () => {
        this.activateView();
      }
    });
    this.registerEvent(
      this.app.vault.on("modify", async (file) => {
        await this.handleFileModified(file);
      })
    );
    this.registerEvent(
      this.app.workspace.on("file-open", (file) => {
        if (file) {
          this.updateContextView(file);
        }
      })
    );
  }
  onunload() {
    console.log("Unloading Genesis Shadow Sync Plugin");
  }
  async activateView() {
    const { workspace } = this.app;
    let leaf = null;
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
  async updateContextView(file) {
    const leaves = this.app.workspace.getLeavesOfType(JIT_CONTEXT_VIEW_TYPE);
    if (leaves.length === 0)
      return;
    const view = leaves[0].view;
    const fileId = file.basename;
    await view.updateContext(fileId);
  }
  async handleFileModified(file) {
    if (file.extension !== "md")
      return;
    const cache = this.app.metadataCache.getFileCache(file);
    const frontmatter = cache == null ? void 0 : cache.frontmatter;
    if (!frontmatter)
      return;
    const id = frontmatter.id || file.basename;
    const type = frontmatter.type || "note";
    const content = await this.app.vault.read(file);
    const genesisRegex = /```json:genesis\n([\s\S]*?)\n```/g;
    let props = { ...frontmatter };
    delete props.id;
    delete props.type;
    let embedding = null;
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
    try {
      const response = await fetch("http://127.0.0.1:3000/v1/node/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          labels: [type],
          props,
          embedding
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
};
