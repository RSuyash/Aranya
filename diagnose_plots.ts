import { db } from './src/core/data-model/dexie';

async function diagnose() {
    const projectId = '9f4df9a8-185c-4fa0-9f52-ef2cb082a8a2';

    console.log('--- Modules ---');
    const modules = await db.modules.where('projectId').equals(projectId).toArray();
    modules.forEach(m => console.log(`Module: ${m.name} (${m.id})`));

    console.log('\n--- Plots ---');
    const plots = await db.plots.where('projectId').equals(projectId).toArray();
    plots.forEach(p => console.log(`Plot: ${p.name} (${p.id}) - ModuleId: ${p.moduleId}`));
}

diagnose();
