const chai = require('chai');
const { expect } = chai;
const fillMissingAnnotationsAfterDownsampling = require('../src/assets/js/FillMissingAnnotationsAfterDownsampling');

describe('testFillMissingAnnotationsAfterDownsampling', () => {

  const testCases = [
    {
      title: "standard case",
      dataArray: [
        { time: 1, label: '' },
        { time: 3, label: '' },
        { time: 5, label: '' },
      ],
      labelsArray: [
        { time: 2, label: 'X' },
        { time: 4, label: 'Y' },
      ],
      expected: [
        { time: 1, label: '' },
        { time: 2, label: 'X' },
        { time: 3, label: '' },
        { time: 4, label: 'Y' },
        { time: 5, label: '' },
      ]
    },
    {
      title: "labels between labels",
      dataArray: [
        { time: 1, label: 'A' },
        { time: 3, label: 'B' },
        { time: 5, label: 'C' },
      ],
      labelsArray: [
        { time: 2, label: 'X' },
        { time: 4, label: 'Y' },
      ],
      expected: [
        { time: 1, label: 'A' },
        { time: 2, label: 'X' },
        { time: 3, label: 'B' },
        { time: 4, label: 'Y' },
        { time: 5, label: 'C' },
      ]
    },
    {
      title: "data equals labels",
      dataArray: [
        { time: 1, label: 'X' },
        { time: 3, label: 'X' },
      ],
      labelsArray: [
        { time: 1, label: 'X' },
        { time: 3, label: 'X' },
      ],
      expected: [
        { time: 1, label: 'X' },
        { time: 3, label: 'X' },
      ]
    },
    {
      title: "fill only a single middle label",
      dataArray: [
        { time: 1, label: 'A' },
        { time: 5, label: 'B' },
      ],
      labelsArray: [
        { time: 2, label: 'X' },
        { time: 3, label: 'X' },
        { time: 4, label: 'X' },
      ],
      expected: [
        { time: 1, label: 'A' },
        { time: 3, label: 'X' },
        { time: 5, label: 'B' },
      ]
    },
    {
      title: "labels outside the data time range not included",
      dataArray: [
        { time: 1, label: 'A' },
        { time: 5, label: 'B' },
      ],
      labelsArray: [
        { time: 0, label: 'X' },
        { time: 2, label: 'X' },
        { time: 6, label: 'X' },
      ],
      expected: [
        { time: 1, label: 'A' },
        { time: 2, label: 'X' },
        { time: 5, label: 'B' },
      ]
    },
    {
      title: "all empty",
      dataArray: [],
      labelsArray: [],
      expected: []
    },
    {
      title: "empty labels",
      dataArray:  [ { time: 1, label: 'A' }, ],
      labelsArray: [],
      expected: [ { time: 1, label: 'A' }, ]
    },
  ];

  testCases.forEach(({ title, dataArray, labelsArray, expected }, index) => {
    it(`Test Case - ${title}`, () => {
      const result = fillMissingAnnotationsAfterDownsampling(dataArray, labelsArray);

      expect(result).to.deep.equal(expected);
    });
  });
});
