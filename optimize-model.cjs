const fs = require('fs-extra');
const path = require('path');
const { processGltf, gltfToGlb } = require('gltf-pipeline');

const inputFile = 'Unnamed-Montagem_final.gltf';
const outputFile = 'optimized-model.glb';

const options = {
    dracoOptions: undefined,
    resourceDirectory: __dirname,
};

async function optimize() {
    try {
        console.log(`Reading ${inputFile}...`);
        const gltf = fs.readJsonSync(inputFile);

        // STRIP TEXTURES MANUALLY
        console.log('Stripping textures...');
        delete gltf.images;
        delete gltf.textures;
        delete gltf.samplers;

        if (gltf.materials) {
            gltf.materials.forEach(mat => {
                if (mat.pbrMetallicRoughness) {
                    delete mat.pbrMetallicRoughness.baseColorTexture;
                    delete mat.pbrMetallicRoughness.metallicRoughnessTexture;
                }
                delete mat.normalTexture;
                delete mat.occlusionTexture;
                delete mat.emissiveTexture;
            });
        }

        // STRIP GEOMETRY ATTRIBUTES FOR WIREFRAME
        console.log('Stripping geometry attributes (Normals, UVs)...');
        if (gltf.meshes) {
            gltf.meshes.forEach(mesh => {
                if (mesh.primitives) {
                    mesh.primitives.forEach(primitive => {
                        if (primitive.attributes) {
                            delete primitive.attributes.NORMAL;
                            delete primitive.attributes.TEXCOORD_0;
                            delete primitive.attributes.TEXCOORD_1;
                            delete primitive.attributes.TANGENT;
                            delete primitive.attributes.COLOR_0; // Maybe keep color if needed, but wireframe usually overrides
                        }
                    });
                }
            });
        }

        console.log('Running gltf-pipeline with Draco compression...');
        const results = await processGltf(gltf, options);

        console.log('Converting to GLB...');
        const glbResults = await gltfToGlb(results.gltf, { resourceDirectory: __dirname });

        console.log(`Writing ${outputFile}...`);
        fs.writeFileSync(outputFile, glbResults.glb);

        const originalSize = fs.statSync(inputFile).size; // Just the JSON part, bin is separate
        const binSize = fs.statSync('Unnamed-Montagem_final.bin').size;
        const newSize = fs.statSync(outputFile).size;

        console.log(`Original size (approx): ${(originalSize + binSize) / 1024 / 1024} MB`);
        console.log(`New size: ${newSize / 1024 / 1024} MB`);

    } catch (err) {
        console.error('Error optimizing model:', err);
    }
}

optimize();
