import { db } from './src/core/data-model/dexie';

async function cleanupDuplicates() {
    const projectId = '9f4df9a8-185c-4fa0-9f52-ef2cb082a8a2';
    const modules = await db.modules.where('projectId').equals(projectId).toArray();

    const vegetationModules = modules.filter(m => m.type === 'VEGETATION_PLOTS');

    if (vegetationModules.length > 1) {
        console.log(`Found ${vegetationModules.length} vegetation modules. Cleaning up...`);

        for (const module of vegetationModules) {
            const plotCount = await db.plots.where('moduleId').equals(module.id).count();
            console.log(`Module ${module.id} has ${plotCount} plots.`);

            if (plotCount === 0) {
                console.log(`Deleting empty module ${module.id}...`);
                await db.modules.delete(module.id);
            }
        }
    } else {
        console.log('No duplicate vegetation modules found.');
    }
}

cleanupDuplicates();
