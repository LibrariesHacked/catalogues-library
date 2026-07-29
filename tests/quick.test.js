/* eslint-env jest */

import * as idx from './index.js'

const t = 300000

// One representative test from each connector type

// spydus
test('S12000033', async () => await idx.runTest('Aberdeen City'), t)

// arena
test('E06000022', async () => await idx.runTest('Bath and North East Somerset'), t)

// enterprise
test('E09000002', async () => await idx.runTest('Barking and Dagenham'), t)

// prism3
test('E09000003', async () => await idx.runTest('Barnet'), t)

// koha
test('E06000049', async () => await idx.runTest('Cheshire East'), t)

// durham
test('E06000047', async () => await idx.runTest('Durham'), t)

// aspen
test('S12000045', async () => await idx.runTest('East Dunbartonshire'), t)

// iguana
test('S12000006', async () => await idx.runTest('Dumfries and Galloway'), t)

// luci
test('E06000032', async () => await idx.runTest('Luton'), t)

// webpac
test('S12000028', async () => await idx.runTest('South Ayrshire'), t)
