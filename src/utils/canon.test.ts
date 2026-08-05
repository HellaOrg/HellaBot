import * as C from './canon';
import * as api from './api';
import { readFile, writeFile } from 'fs/promises';
import { diffLines } from 'diff';

async function main() {
    const deploys = await testDeployables();
    const ops = await testOperators();
    const skills = await testSkills();
    const results = JSON.stringify({ deploys, ops, skills }, null, 2);
    await writeFile('src/utils/canon.test.json', results);
    const reference = (await readFile('src/utils/canon.ref.json')).toString();

    const diff = diffLines(reference, results);

    if (diff.every(d => !d.added && !d.removed)) {
        console.log("No canon diffs.")
        process.exit(0);
    }
    else {
        console.log(diff);
        process.exit(1);
    }
}

async function testDeployables() {
    const deploys = await api.all('deployable');
    deploys.sort((a, b) => a.id.localeCompare(b.id));

    const dict: { [key: string]: { [key: string]: boolean } } = {};

    for (const deploy of deploys) {
        dict[deploy.id] = {
            factions: C.Deployable.hasFactions(deploy),
            potentials: C.Deployable.hasPotentials(deploy),
            range: C.Deployable.hasRange(deploy),
            stats: C.Deployable.hasStats(deploy),
            skills: C.Deployable.hasSkills(deploy),
            skins: C.Deployable.hasSkins(deploy),
            talents: C.Deployable.hasTalents(deploy),
            trait: C.Deployable.hasTrait(deploy),
        };
    }

    return dict;
}

async function testOperators() {
    const ops = await api.all('operator');
    ops.sort((a, b) => a.id.localeCompare(b.id));

    const dict: { [key: string]: { [key: string]: boolean } } = {};

    for (const op of ops) {
        dict[op.id] = {
            bases: C.Operator.hasBases(op),
            costs: C.Operator.hasCosts(op),
            deploys: C.Operator.hasDeployables(op),
            factions: C.Operator.hasFactions(op),
            modules: C.Operator.hasModules(op),
            paradox: C.Operator.hasParadox(op),
            potentials: C.Operator.hasPotentials(op),
            range: C.Operator.hasRange(op),
            stats: C.Operator.hasStats(op),
            skills: C.Operator.hasSkills(op),
            skins: C.Operator.hasSkins(op),
            talents: C.Operator.hasTalents(op),
            trait: C.Operator.hasTrait(op),
        };
    }

    return dict;
}

async function testSkills() {
    const skills = await api.all('skill');
    skills.sort((a, b) => a.excel.skillId.localeCompare(b.excel.skillId));

    const dict: { [key: string]: { [key: string]: boolean } } = {};

    for (const skill of skills) {
        dict[skill.excel.skillId] = {
            deploys: C.Skill.hasDeployable(skill)
        };
    }

    return dict;
}

main();
