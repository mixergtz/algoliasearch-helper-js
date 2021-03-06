'use strict';

test('hierarchical facets: objects with multiple categories', function(done) {
  var algoliasearch = require('algoliasearch');

  var algoliasearchHelper = require('../../../');

  var appId = 'hierarchical-simple-appId';
  var apiKey = 'hierarchical-simple-apiKey';
  var indexName = 'hierarchical-simple-indexName';

  var client = algoliasearch(appId, apiKey);
  var helper = algoliasearchHelper(client, indexName, {
    hierarchicalFacets: [{
      name: 'categories',
      attributes: ['categories.lvl0', 'categories.lvl1']
    }]
  });

  helper.toggleRefine('categories', 'beers > IPA');

  var algoliaResponse = {
    'results': [{
      'query': 'a',
      'index': indexName,
      'hits': [{'objectID': 'one'}],
      'nbHits': 3,
      'page': 0,
      'nbPages': 1,
      'hitsPerPage': 20,
      'facets': {
        'categories.lvl0': {'beers': 3, 'bières': 3},
        'categories.lvl1': {'beers > IPA': 3, 'bières > Rousses': 3}
      }
    }, {
      'query': 'a',
      'index': indexName,
      'hits': [{'objectID': 'one'}],
      'nbHits': 1,
      'page': 0,
      'nbPages': 1,
      'hitsPerPage': 20,
      'facets': {
        'categories.lvl0': {'beers': 5, 'bières': 3},
        'categories.lvl1': {'beers > IPA': 3, 'beers > Guiness': 2, 'bières > Rousses': 3}
      }
    }, {
      'query': 'a',
      'index': indexName,
      'hits': [{'objectID': 'one'}],
      'nbHits': 1,
      'page': 0,
      'nbPages': 1,
      'hitsPerPage': 20,
      'facets': {
        'categories.lvl0': {'beers': 5, 'bières': 3}
      }
    }]
  };

  var expectedHelperResponse = [{
    'name': 'categories',
    'count': null,
    'isRefined': true,
    'path': null,
    'data': [{
      'name': 'beers',
      'path': 'beers',
      'count': 5,
      'isRefined': true,
      'data': [{
        'name': 'IPA',
        'path': 'beers > IPA',
        'count': 3,
        'isRefined': true,
        'data': null
      }, {
        'name': 'Guiness',
        'path': 'beers > Guiness',
        'count': 2,
        'isRefined': false,
        'data': null
      }]
    }, {
      'name': 'bières',
      'path': 'bières',
      'count': 3,
      'isRefined': false,
      'data': null
    }]
  }];

  client.search = jest.fn(function() {
    return Promise.resolve(algoliaResponse);
  });

  helper.setQuery('a').search();
  helper.once('result', function(content) {
    expect(content.hierarchicalFacets).toEqual(expectedHelperResponse);
    done();
  });
});
