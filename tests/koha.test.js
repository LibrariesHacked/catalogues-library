/* eslint-env jest */

import * as idx from './index.js'

const t = 300000

test('S12000005', async () => await idx.runTest('Clackmannanshire'), t)
test('E06000049', async () => await idx.runTest('Cheshire East'), t)
test('E06000050', async () => await idx.runTest('Cheshire West and Chester'), t)
test('E06000063', async () => await idx.runTest('Cumberland'), t)
test('E06000006', async () => await idx.runTest('Halton'), t)
test('E08000011', async () => await idx.runTest('Knowsley'), t)
test('E08000013', async () => await idx.runTest('St Helens'), t)
test('E06000007', async () => await idx.runTest('Warrington'), t)
test('E06000064', async () => await idx.runTest('Westmorland and Furness'), t)
