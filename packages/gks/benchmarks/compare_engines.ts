/**
 * GenesisDB vs Neo4j - Comparative Benchmark Suite
 * 
 * Performs head-to-head performance measurement of:
 * 1. GenesisDB (Native Rust Embedded Engine)
 * 2. Neo4j (via Bolt Protocol / Docker)
 * 
 * Target Workload: LDBC-Lite (1-3 hop neighborhood traversal)
 */

import { performance } from 'node:perf_hooks';
import * as fs from 'node:fs/promises';
import { join } from 'node:path';
import neo4j from 'neo4j-driver';
// @ts-ignore
import { GenesisDatabase } from '@freshair129/gks-genesis-block-native';

const CONFIG = {
    NODE_COUNT: 1000,
    FAN_OUT: 5,
    HOPS: [1, 2, 3],
    ITERATIONS: 100,
    DB_PATH: './bench_data_genesis',
    NEO4J_URI: process.env.NEO4J_URI || 'bolt://localhost:7687',
    NEO4J_USER: process.env.NEO4J_USER || 'neo4j',
    NEO4J_PASS: process.env.NEO4J_PASS || 'password'
};

async function setupGenesisDB() {
    await fs.mkdir(CONFIG.DB_PATH, { recursive: true });
    const db = await GenesisDatabase.open({ path: CONFIG.DB_PATH, readOnly: false });
    
    console.log('[GenesisDB] Seeding graph...');
    for (let i = 0; i < CONFIG.NODE_COUNT; i++) {
        await db.addNode({ id: `N-${i}`, labels: ['Entity'], props: { status: 'stable' } });
    }
    for (let i = 0; i < CONFIG.NODE_COUNT; i++) {
        for (let j = 0; j < CONFIG.FAN_OUT; j++) {
            const to = Math.floor(Math.random() * CONFIG.NODE_COUNT);
            await db.addEdge({ from: `N-${i}`, to: `N-${to}`, rel: 'CONNECTS' });
        }
    }
    return db;
}

async function setupNeo4j() {
    const driver = neo4j.driver(CONFIG.NEO4J_URI, neo4j.auth.basic(CONFIG.NEO4J_USER, CONFIG.NEO4J_PASS));
    const session = driver.session();
    try {
        await session.run('MATCH (n) DETACH DELETE n');
        console.log('[Neo4j] Seeding graph...');
        // Bulk seed
        const nodes = Array.from({ length: CONFIG.NODE_COUNT }, (_, i) => ({ id: `N-${i}` }));
        await session.run('UNWIND $batch AS row CREATE (n:Entity {id: row.id, status: "stable"})', { batch: nodes });
        
        const edges = [];
        for (let i = 0; i < CONFIG.NODE_COUNT; i++) {
            for (let j = 0; j < CONFIG.FAN_OUT; j++) {
                const to = Math.floor(Math.random() * CONFIG.NODE_COUNT);
                edges.push({ from: `N-${i}`, to: `N-${to}` });
            }
        }
        await session.run('UNWIND $batch AS row MATCH (a:Entity {id: row.from}), (b:Entity {id: row.to}) CREATE (a)-[:CONNECTS]->(b)', { batch: edges });
        
        return driver;
    } catch (e) {
        console.warn('⚠️ Neo4j not reachable. Neo4j benchmarks will be skipped.');
        return null;
    } finally {
        await session.close();
    }
}

async function runBenchmark() {
    const genesis = await setupGenesisDB();
    const neo = await setupNeo4j();

    const results: any = { genesis: {}, neo4j: {} };

    for (const hop of CONFIG.HOPS) {
        console.log(`\n--- Running ${hop}-hop Traversal Benchmark ---`);
        
        // GenesisDB
        let genesisTotal = 0;
        for (let i = 0; i < CONFIG.ITERATIONS; i++) {
            const seed = `N-${Math.floor(Math.random() * CONFIG.NODE_COUNT)}`;
            const start = performance.now();
            await genesis.neighbors(seed, { depth: hop, direction: 'out' });
            genesisTotal += (performance.now() - start);
        }
        results.genesis[`${hop}-hop`] = (genesisTotal / CONFIG.ITERATIONS).toFixed(4) + 'ms';
        console.log(`GenesisDB: ${results.genesis[`${hop}-hop`]}`);

        // Neo4j
        if (neo) {
            let neoTotal = 0;
            const session = neo.session();
            for (let i = 0; i < CONFIG.ITERATIONS; i++) {
                const seed = `N-${Math.floor(Math.random() * CONFIG.NODE_COUNT)}`;
                const start = performance.now();
                await session.run(`MATCH (a:Entity {id: $id})-[*${hop}]->(b) RETURN b`, { id: seed });
                neoTotal += (performance.now() - start);
            }
            await session.close();
            results.neo4j[`${hop}-hop`] = (neoTotal / CONFIG.ITERATIONS).toFixed(4) + 'ms';
            console.log(`Neo4j: ${results.neo4j[`${hop}-hop`]}`);
        }
    }

    console.log('\n--- Final Comparison Report ---');
    console.table(results);
    
    if (neo) await neo.close();
    // No close for GenesisDB (auto-closed on process exit)
}

runBenchmark().catch(console.error);
