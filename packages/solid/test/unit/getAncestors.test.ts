import {getNodeAncestors} from '../../src/utils/nodes';

test('returns an array of ancestors', () => {
  expect(
    getNodeAncestors(
      [
        {id: '0', parentId: null},
        {id: '1', parentId: '0'},
        {id: '2', parentId: '1'},
      ],
      '2'
    )
  ).toEqual([
    {id: '1', parentId: '0'},
    {id: '0', parentId: null},
  ]);
});
