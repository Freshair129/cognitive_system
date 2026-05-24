import os
import re
import itertools
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import networkx as nx
from networkx.algorithms.community import greedy_modularity_communities

# ==========================================
# 1. กำหนด Data Models (Schema) ด้วย Pydantic
# ==========================================
class AnalyzeRequest(BaseModel):
    vault_path: str
    
class Bridge(BaseModel):
    concept_a: str
    concept_b: str

class GapAnalysisResponse(BaseModel):
    total_nodes: int
    total_edges: int
    orphans: list[str]
    islands: list[list[str]]
    potential_bridges: list[Bridge]
    status: str

# ==========================================
# 2. เริ่มต้น FastAPI App
# ==========================================
app = FastAPI(
    title="GKS Network Analysis API",
    description="API สำหรับวิเคราะห์ Structural Gaps ใน Obsidian Vault สำหรับ EVA Agent",
    version="1.0.0"
)

# อนุญาตให้ Agent หรือ Frontend จากโดเมนอื่นยิง API เข้ามาได้ (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # ในโปรดักชันควรเปลี่ยนเป็นโดเมนเฉพาะของ EVA
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 3. ฟังก์ชันหลักสำหรับวิเคราะห์กราฟ
# ==========================================
def extract_graph_from_vault(vault_path: str) -> nx.DiGraph:
    """อ่านไฟล์ Markdown ทั้งหมดใน Vault และสร้าง NetworkX DiGraph พร้อมเก็บ Semantic Attributes จาก Properties"""
    if not os.path.isdir(vault_path):
        raise ValueError("ไม่พบโฟลเดอร์ตาม Path ที่ระบุ")

    wiki_pattern = re.compile(r'\[\[(.*?)(?:\|.*?)?\]\]')
    G = nx.DiGraph()

    # นิยาม Semantic Keys ที่เป็นไปได้
    semantic_relation_keys = {"related_to", "contradicts", "expands_on", "depends_on", "references"}

    for root, _, files in os.walk(vault_path):
        for file in files:
            if file.endswith('.md'):
                node_name = file.replace('.md', '')
                G.add_node(node_name)
                
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                        # แยก YAML Frontmatter
                        frontmatter = {}
                        body_content = content
                        if content.startswith('---'):
                            parts = content.split('---', 2)
                            if len(parts) >= 3:
                                yaml_text = parts[1]
                                body_content = parts[2]
                                # Parse YAML แบบง่าย (Key-Value)
                                for line in yaml_text.splitlines():
                                    if ':' in line:
                                        k, v = line.split(':', 1)
                                        frontmatter[k.strip()] = v.strip()
                        
                        # 1. ค้นหาความสัมพันธ์เชิงความหมาย (Semantic Relations) ใน Frontmatter
                        for key, val in frontmatter.items():
                            if key in semantic_relation_keys:
                                targets = wiki_pattern.findall(val)
                                for target in targets:
                                    target_clean = target.split('#')[0].strip()
                                    if target_clean:
                                        G.add_edge(node_name, target_clean, relation_type=key, source="frontmatter")
                        
                        # 2. ค้นหา WikiLinks ทั่วไปในเนื้อหา (Body)
                        links = wiki_pattern.findall(body_content)
                        for link in links:
                            target = link.split('#')[0].strip()
                            if target:
                                # ถ้ายังไม่มี Edge นี้ ให้ระบุเป็นความสัมพันธ์เริ่มต้น
                                if not G.has_edge(node_name, target):
                                    G.add_edge(node_name, target, relation_type="related_to", source="body")
                except Exception as e:
                    print(f"Error reading {file}: {e}")
                    
    return G

# ==========================================
# 4. สร้าง API Endpoint
# ==========================================
@app.post("/api/v1/analyze-gaps", response_model=GapAnalysisResponse)
async def analyze_gaps(request: AnalyzeRequest):
    """
    รับ Path ของ Obsidian Vault เข้ามา และส่งคืนผลการวิเคราะห์ Gaps
    """
    try:
        # สกัดกราฟ
        G = extract_graph_from_vault(request.vault_path)
        
        if G.number_of_nodes() == 0:
            raise HTTPException(status_code=400, detail="ไม่พบข้อมูลโน้ตใน Vault นี้")

        # เตรียมข้อมูลตอบกลับ
        orphans = list(nx.isolates(G))
        
        # ทำการสำเนากราฟแบบไม่มีทิศทาง (Undirected Copy) สำหรับอัลกอริทึมที่ไม่รองรับ DiGraph
        G_undirected = G.to_undirected()
        
        components = list(nx.connected_components(G_undirected))
        components.sort(key=len, reverse=True)
        islands = [list(c) for c in components[1:]] if len(components) > 1 else []
        
        potential_bridges = []
        
        # วิเคราะห์หาชุมชนข้อมูล (Community Detection) และช่องโหว่ (Gaps) โดยรันผ่านกราฟไม่มีทิศทาง
        communities = list(greedy_modularity_communities(G_undirected))
        if len(communities) >= 2:
            centrality = nx.betweenness_centrality(G) # คำนวณตามทิศทางความสัมพันธ์ที่มี
            hubs = []
            
            # หาโหนดหลัก (Hub) ของแต่ละคลัสเตอร์
            for comm in communities:
                if len(comm) > 2:
                    hub = max(comm, key=lambda n: centrality.get(n, 0))
                    hubs.append(hub)
            
            # ตรวจสอบการเชื่อมต่อระหว่าง Hubs ในเชิงโครงสร้าง (ไม่ระบุทิศทาง)
            for hub1, hub2 in itertools.combinations(hubs, 2):
                if not G_undirected.has_edge(hub1, hub2):
                    potential_bridges.append(Bridge(concept_a=hub1, concept_b=hub2))

        return GapAnalysisResponse(
            total_nodes=G.number_of_nodes(),
            total_edges=G.number_of_edges(),
            orphans=orphans,
            islands=islands,
            potential_bridges=potential_bridges,
            status="success"
        )

    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์: {str(e)}")

# หากต้องการรันเพื่อทดสอบ (ใช้คำสั่ง uvicorn main:app --reload แทนได้)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)มี