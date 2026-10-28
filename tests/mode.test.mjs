import {test} from 'node:test';import assert from 'node:assert/strict';import {selectExperience} from '../src/experience.mjs';
test('React é a experiência padrão, sem encaminhamento para o original',()=>{assert.equal(selectExperience(''),'react');assert.equal(selectExperience('?modo=original'),'react');});
