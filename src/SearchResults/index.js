'use strict';

var orderBy = require('lodash/orderBy');

var merge = require('lodash/merge');

var isFunction = require('lodash/isFunction');

var partial = require('lodash/partial');
var partialRight = require('lodash/partialRight');

var defaultsPure = require('../functions/defaultsPure');
var compact = require('../functions/compact');
var find = require('../functions/find');
var findIndex = require('../functions/findIndex');
var formatSort = require('../functions/formatSort');

var generateHierarchicalTree = require('./generate-hierarchical-tree');

/**
 * @typedef SearchResults.Facet
 * @type {object}
 * @property {string} name name of the attribute in the record
 * @property {object} data the faceting data: value, number of entries
 * @property {object} stats undefined unless facet_stats is retrieved from algolia
 */

/**
 * @typedef SearchResults.HierarchicalFacet
 * @type {object}
 * @property {string} name name of the current value given the hierarchical level, trimmed.
 * If root node, you get the facet name
 * @property {number} count number of objects matching this hierarchical value
 * @property {string} path the current hierarchical value full path
 * @property {boolean} isRefined `true` if the current value was refined, `false` otherwise
 * @property {HierarchicalFacet[]} data sub values for the current level
 */

/**
 * @typedef SearchResults.FacetValue
 * @type {object}
 * @property {string} name the facet value itself
 * @property {number} count times this facet appears in the results
 * @property {boolean} isRefined is the facet currently selected
 * @property {boolean} isExcluded is the facet currently excluded (only for conjunctive facets)
 */

/**
 * @typedef Refinement
 * @type {object}
 * @property {string} type the type of filter used:
 * `numeric`, `facet`, `exclude`, `disjunctive`, `hierarchical`
 * @property {string} attributeName name of the attribute used for filtering
 * @property {string} name the value of the filter
 * @property {number} numericValue the value as a number. Only for numeric filters.
 * @property {string} operator the operator used. Only for numeric filters.
 * @property {number} count the number of computed hits for this filter. Only on facets.
 * @property {boolean} exhaustive if the count is exhaustive
 */

/**
 * @param {string[]} attributes
 */
function getIndices(attributes) {
  var indices = {};

  attributes.forEach(function(val, idx) {
    indices[val] = idx;
  });

  return indices;
}

function assignFacetStats(dest, facetStats, key) {
  if (facetStats && facetStats[key]) {
    dest.stats = facetStats[key];
  }
}

/**
 * @typedef {Object} HierarchicalFacet
 * @property {string} name
 * @property {string[]} attributes
 */

/**
 * @param {HierarchicalFacet[]} hierarchicalFacets
 * @param {string} hierarchicalAttributeName
 */
function findMatchingHierarchicalFacetFromAttributeName(
  hierarchicalFacets,
  hierarchicalAttributeName
) {
  return find(hierarchicalFacets, function facetKeyMatchesAttribute(
    hierarchicalFacet
  ) {
    var facetNames = hierarchicalFacet.attributes || [];
    return facetNames.indexOf(hierarchicalAttributeName) > -1;
  });
}

/*eslint-disable */
/**
 * Constructor for SearchResults
 * @class
 * @classdesc SearchResults contains the results of a query to Algolia using the
 * {@link AlgoliaSearchHelper}.
 * @param {SearchParameters} state state that led to the response
 * @param {array.<object>} results the results from algolia client
 * @example <caption>SearchResults of the first query in
 * <a href="http://demos.algolia.com/instant-search-demo">the instant search demo</a></caption>
{
   "hitsPerPage": 10,
   "processingTimeMS": 2,
   "facets": [
      {
         "name": "type",
         "data": {
            "HardGood": 6627,
            "BlackTie": 550,
            "Music": 665,
            "Software": 131,
            "Game": 456,
            "Movie": 1571
         },
         "exhaustive": false
      },
      {
         "exhaustive": false,
         "data": {
            "Free shipping": 5507
         },
         "name": "shipping"
      }
  ],
   "hits": [
      {
         "thumbnailImage": "http://img.bbystatic.com/BestBuy_US/images/products/1688/1688832_54x108_s.gif",
         "_highlightResult": {
            "shortDescription": {
               "matchLevel": "none",
               "value": "Safeguard your PC, Mac, Android and iOS devices with comprehensive Internet protection",
               "matchedWords": []
            },
            "category": {
               "matchLevel": "none",
               "value": "Computer Security Software",
               "matchedWords": []
            },
            "manufacturer": {
               "matchedWords": [],
               "value": "Webroot",
               "matchLevel": "none"
            },
            "name": {
               "value": "Webroot SecureAnywhere Internet Security (3-Device) (1-Year Subscription) - Mac/Windows",
               "matchedWords": [],
               "matchLevel": "none"
            }
         },
         "image": "http://img.bbystatic.com/BestBuy_US/images/products/1688/1688832_105x210_sc.jpg",
         "shipping": "Free shipping",
         "bestSellingRank": 4,
         "shortDescription": "Safeguard your PC, Mac, Android and iOS devices with comprehensive Internet protection",
         "url": "http://www.bestbuy.com/site/webroot-secureanywhere-internet-security-3-devi…d=1219060687969&skuId=1688832&cmp=RMX&ky=2d3GfEmNIzjA0vkzveHdZEBgpPCyMnLTJ",
         "name": "Webroot SecureAnywhere Internet Security (3-Device) (1-Year Subscription) - Mac/Windows",
         "category": "Computer Security Software",
         "salePrice_range": "1 - 50",
         "objectID": "1688832",
         "type": "Software",
         "customerReviewCount": 5980,
         "salePrice": 49.99,
         "manufacturer": "Webroot"
      },
      ....
  ],
   "nbHits": 10000,
   "disjunctiveFacets": [
      {
         "exhaustive": false,
         "data": {
            "5": 183,
            "12": 112,
            "7": 149,
            ...
         },
         "name": "customerReviewCount",
         "stats": {
            "max": 7461,
            "avg": 157.939,
            "min": 1
         }
      },
      {
         "data": {
            "Printer Ink": 142,
            "Wireless Speakers": 60,
            "Point & Shoot Cameras": 48,
            ...
         },
         "name": "category",
         "exhaustive": false
      },
      {
         "exhaustive": false,
         "data": {
            "> 5000": 2,
            "1 - 50": 6524,
            "501 - 2000": 566,
            "201 - 500": 1501,
            "101 - 200": 1360,
            "2001 - 5000": 47
         },
         "name": "salePrice_range"
      },
      {
         "data": {
            "Dynex™": 202,
            "Insignia™": 230,
            "PNY": 72,
            ...
         },
         "name": "manufacturer",
         "exhaustive": false
      }
  ],
   "query": "",
   "nbPages": 100,
   "page": 0,
   "index": "bestbuy"
}
 **/
/*eslint-enable */
function SearchResults(state, results) {
  var mainSubResponse = results[0];

  this._rawResults = results;

  /**
   * query used to generate the results
   * @member {string}
   */
  this.query = mainSubResponse.query;
  /**
   * The query as parsed by the engine given all the rules.
   * @member {string}
   */
  this.parsedQuery = mainSubResponse.parsedQuery;
  /**
   * all the records that match the search parameters. Each record is
   * augmented with a new attribute `_highlightResult`
   * which is an object keyed by attribute and with the following properties:
   *  - `value` : the value of the facet highlighted (html)
   *  - `matchLevel`: full, partial or none depending on how the query terms match
   * @member {object[]}
   */
  this.hits = mainSubResponse.hits;
  /**
   * index where the results come from
   * @member {string}
   */
  this.index = mainSubResponse.index;
  /**
   * number of hits per page requested
   * @member {number}
   */
  this.hitsPerPage = mainSubResponse.hitsPerPage;
  /**
   * total number of hits of this query on the index
   * @member {number}
   */
  this.nbHits = mainSubResponse.nbHits;
  /**
   * total number of pages with respect to the number of hits per page and the total number of hits
   * @member {number}
   */
  this.nbPages = mainSubResponse.nbPages;
  /**
   * current page
   * @member {number}
   */
  this.page = mainSubResponse.page;
  /**
   * sum of the processing time of all the queries
   * @member {number}
   */
  this.processingTimeMS = results.reduce(function(sum, result) {
    return result.processingTimeMS === undefined
      ? sum
      : sum + result.processingTimeMS;
  }, 0);
  /**
   * The position if the position was guessed by IP.
   * @member {string}
   * @example "48.8637,2.3615",
   */
  this.aroundLatLng = mainSubResponse.aroundLatLng;
  /**
   * The radius computed by Algolia.
   * @member {string}
   * @example "126792922",
   */
  this.automaticRadius = mainSubResponse.automaticRadius;
  /**
   * String identifying the server used to serve this request.
   * @member {string}
   * @example "c7-use-2.algolia.net",
   */
  this.serverUsed = mainSubResponse.serverUsed;
  /**
   * Boolean that indicates if the computation of the counts did time out.
   * @deprecated
   * @member {boolean}
   */
  this.timeoutCounts = mainSubResponse.timeoutCounts;
  /**
   * Boolean that indicates if the computation of the hits did time out.
   * @deprecated
   * @member {boolean}
   */
  this.timeoutHits = mainSubResponse.timeoutHits;

  /**
   * True if the counts of the facets is exhaustive
   * @member {boolean}
   */
  this.exhaustiveFacetsCount = mainSubResponse.exhaustiveFacetsCount;

  /**
   * True if the number of hits is exhaustive
   * @member {boolean}
   */
  this.exhaustiveNbHits = mainSubResponse.exhaustiveNbHits;


  /**
   * Contains the userData if they are set by a [query rule](https://www.algolia.com/doc/guides/query-rules/query-rules-overview/).
   * @member {object[]}
   */
  this.userData = mainSubResponse.userData;

  /**
   * queryID is the unique identifier of the query used to generate the current search results.
   * This value is only available if the `clickAnalytics` search parameter is set to `true`.
   * @member {string}
   */
  this.queryID = mainSubResponse.queryID;

  /**
   * disjunctive facets results
   * @member {SearchResults.Facet[]}
   */
  this.disjunctiveFacets = [];
  /**
   * disjunctive facets results
   * @member {SearchResults.HierarchicalFacet[]}
   */
  this.hierarchicalFacets = state.hierarchicalFacets.map(function initFutureTree() {
    return [];
  });
  /**
   * other facets results
   * @member {SearchResults.Facet[]}
   */
  this.facets = [];

  var disjunctiveFacets = state.getRefinedDisjunctiveFacets();

  var facetsIndices = getIndices(state.facets);
  var disjunctiveFacetsIndices = getIndices(state.disjunctiveFacets);
  var nextDisjunctiveResult = 1;

  var self = this;
  // Since we send request only for disjunctive facets that have been refined,
  // we get the facets information from the first, general, response.

  var mainFacets = mainSubResponse.facets || {};

  Object.keys(mainFacets).forEach(function(facetKey) {
    var facetValueObject = mainFacets[facetKey];

    var hierarchicalFacet = findMatchingHierarchicalFacetFromAttributeName(
      state.hierarchicalFacets,
      facetKey
    );

    if (hierarchicalFacet) {
      // Place the hierarchicalFacet data at the correct index depending on
      // the attributes order that was defined at the helper initialization
      var facetIndex = hierarchicalFacet.attributes.indexOf(facetKey);
      var idxAttributeName = findIndex(state.hierarchicalFacets, function(f) {
        return f.name === hierarchicalFacet.name;
      });
      self.hierarchicalFacets[idxAttributeName][facetIndex] = {
        attribute: facetKey,
        data: facetValueObject,
        exhaustive: mainSubResponse.exhaustiveFacetsCount
      };
    } else {
      var isFacetDisjunctive = state.disjunctiveFacets.indexOf(facetKey) !== -1;
      var isFacetConjunctive = state.facets.indexOf(facetKey) !== -1;
      var position;

      if (isFacetDisjunctive) {
        position = disjunctiveFacetsIndices[facetKey];
        self.disjunctiveFacets[position] = {
          name: facetKey,
          data: facetValueObject,
          exhaustive: mainSubResponse.exhaustiveFacetsCount
        };
        assignFacetStats(self.disjunctiveFacets[position], mainSubResponse.facets_stats, facetKey);
      }
      if (isFacetConjunctive) {
        position = facetsIndices[facetKey];
        self.facets[position] = {
          name: facetKey,
          data: facetValueObject,
          exhaustive: mainSubResponse.exhaustiveFacetsCount
        };
        assignFacetStats(self.facets[position], mainSubResponse.facets_stats, facetKey);
      }
    }
  });

  // Make sure we do not keep holes within the hierarchical facets
  this.hierarchicalFacets = compact(this.hierarchicalFacets);

  // aggregate the refined disjunctive facets
  disjunctiveFacets.forEach(function(disjunctiveFacet) {
    var result = results[nextDisjunctiveResult];
    var facets = result && result.facets ? result.facets : {};
    var hierarchicalFacet = state.getHierarchicalFacetByName(disjunctiveFacet);

    // There should be only item in facets.
    Object.keys(facets).forEach(function(dfacet) {
      var facetResults = facets[dfacet];

      var position;

      if (hierarchicalFacet) {
        position = findIndex(state.hierarchicalFacets, function(f) {
          return f.name === hierarchicalFacet.name;
        });
        var attributeIndex = findIndex(self.hierarchicalFacets[position], function(f) {
          return f.attribute === dfacet;
        });

        // previous refinements and no results so not able to find it
        if (attributeIndex === -1) {
          return;
        }

        self.hierarchicalFacets[position][attributeIndex].data = merge(
          {},
          self.hierarchicalFacets[position][attributeIndex].data,
          facetResults
        );
      } else {
        position = disjunctiveFacetsIndices[dfacet];

        var dataFromMainRequest = mainSubResponse.facets && mainSubResponse.facets[dfacet] || {};

        self.disjunctiveFacets[position] = {
          name: dfacet,
          data: defaultsPure({}, facetResults, dataFromMainRequest),
          exhaustive: result.exhaustiveFacetsCount
        };
        assignFacetStats(self.disjunctiveFacets[position], result.facets_stats, dfacet);

        if (state.disjunctiveFacetsRefinements[dfacet]) {
          state.disjunctiveFacetsRefinements[dfacet].forEach(function(refinementValue) {
            // add the disjunctive refinements if it is no more retrieved
            if (!self.disjunctiveFacets[position].data[refinementValue] &&
              state.disjunctiveFacetsRefinements[dfacet].indexOf(refinementValue) > -1) {
              self.disjunctiveFacets[position].data[refinementValue] = 0;
            }
          });
        }
      }
    });
    nextDisjunctiveResult++;
  });

  // if we have some root level values for hierarchical facets, merge them
  state.getRefinedHierarchicalFacets().forEach(function(refinedFacet) {
    var hierarchicalFacet = state.getHierarchicalFacetByName(refinedFacet);
    var separator = state._getHierarchicalFacetSeparator(hierarchicalFacet);

    var currentRefinement = state.getHierarchicalRefinement(refinedFacet);
    // if we are already at a root refinement (or no refinement at all), there is no
    // root level values request
    if (currentRefinement.length === 0 || currentRefinement[0].split(separator).length < 2) {
      return;
    }

    var result = results[nextDisjunctiveResult];
    var facets = result && result.facets
      ? result.facets
      : {};
    Object.keys(facets).forEach(function(dfacet) {
      var facetResults = facets[dfacet];
      var position = findIndex(state.hierarchicalFacets, function(f) {
        return f.name === hierarchicalFacet.name;
      });
      var attributeIndex = findIndex(self.hierarchicalFacets[position], function(f) {
        return f.attribute === dfacet;
      });

      // previous refinements and no results so not able to find it
      if (attributeIndex === -1) {
        return;
      }

      // when we always get root levels, if the hits refinement is `beers > IPA` (count: 5),
      // then the disjunctive values will be `beers` (count: 100),
      // but we do not want to display
      //   | beers (100)
      //     > IPA (5)
      // We want
      //   | beers (5)
      //     > IPA (5)
      var defaultData = {};

      if (currentRefinement.length > 0) {
        var root = currentRefinement[0].split(separator)[0];
        defaultData[root] = self.hierarchicalFacets[position][attributeIndex].data[root];
      }

      self.hierarchicalFacets[position][attributeIndex].data = defaultsPure(
        defaultData,
        facetResults,
        self.hierarchicalFacets[position][attributeIndex].data
      );
    });

    nextDisjunctiveResult++;
  });

  // add the excludes
  Object.keys(state.facetsExcludes).forEach(function(facetName) {
    var excludes = state.facetsExcludes[facetName];
    var position = facetsIndices[facetName];

    self.facets[position] = {
      name: facetName,
      data: mainSubResponse.facets[facetName],
      exhaustive: mainSubResponse.exhaustiveFacetsCount
    };
    excludes.forEach(function(facetValue) {
      self.facets[position] = self.facets[position] || {name: facetName};
      self.facets[position].data = self.facets[position].data || {};
      self.facets[position].data[facetValue] = 0;
    });
  });

  /**
   * @type {Array}
   */
  this.hierarchicalFacets = this.hierarchicalFacets.map(generateHierarchicalTree(state));

  /**
   * @type {Array}
   */
  this.facets = compact(this.facets);
  /**
   * @type {Array}
   */
  this.disjunctiveFacets = compact(this.disjunctiveFacets);

  this._state = state;
}

/**
 * Get a facet object with its name
 * @deprecated
 * @param {string} name name of the faceted attribute
 * @return {SearchResults.Facet} the facet object
 */
SearchResults.prototype.getFacetByName = function(name) {
  function predicate(facet) {
    return facet.name === name;
  }

  return find(this.facets, predicate) ||
    find(this.disjunctiveFacets, predicate) ||
    find(this.hierarchicalFacets, predicate);
};

/**
 * Get the facet values of a specified attribute from a SearchResults object.
 * @private
 * @param {SearchResults} results the search results to search in
 * @param {string} attribute name of the faceted attribute to search for
 * @return {array|object} facet values. For the hierarchical facets it is an object.
 */
function extractNormalizedFacetValues(results, attribute) {
  function predicate(facet) {
    return facet.name === attribute;
  }

  if (results._state.isConjunctiveFacet(attribute)) {
    var facet = find(results.facets, predicate);
    if (!facet) return [];

    return Object.keys(facet.data).map(function(name) {
      return {
        name: name,
        count: facet.data[name],
        isRefined: results._state.isFacetRefined(attribute, name),
        isExcluded: results._state.isExcludeRefined(attribute, name)
      };
    });
  } else if (results._state.isDisjunctiveFacet(attribute)) {
    var disjunctiveFacet = find(results.disjunctiveFacets, predicate);
    if (!disjunctiveFacet) return [];

    return Object.keys(disjunctiveFacet.data).map(function(name) {
      return {
        name: name,
        count: disjunctiveFacet.data[name],
        isRefined: results._state.isDisjunctiveFacetRefined(attribute, name)
      };
    });
  } else if (results._state.isHierarchicalFacet(attribute)) {
    return find(results.hierarchicalFacets, predicate);
  }
}

/**
 * Sort nodes of a hierarchical facet results
 * @private
 * @param {HierarchicalFacet} node node to upon which we want to apply the sort
 */
function recSort(sortFn, node) {
  if (!node.data || node.data.length === 0) {
    return node;
  }

  var children = node.data.map(partial(recSort, sortFn));
  var sortedChildren = sortFn(children);
  var newNode = merge({}, node, {data: sortedChildren});
  return newNode;
}

SearchResults.DEFAULT_SORT = ['isRefined:desc', 'count:desc', 'name:asc'];

function vanillaSortFn(order, data) {
  return data.sort(order);
}

/**
 * Get a the list of values for a given facet attribute. Those values are sorted
 * refinement first, descending count (bigger value on top), and name ascending
 * (alphabetical order). The sort formula can overridden using either string based
 * predicates or a function.
 *
 * This method will return all the values returned by the Algolia engine plus all
 * the values already refined. This means that it can happen that the
 * `maxValuesPerFacet` [configuration](https://www.algolia.com/doc/rest-api/search#param-maxValuesPerFacet)
 * might not be respected if you have facet values that are already refined.
 * @param {string} attribute attribute name
 * @param {object} opts configuration options.
 * @param {Array.<string> | function} opts.sortBy
 * When using strings, it consists of
 * the name of the [FacetValue](#SearchResults.FacetValue) or the
 * [HierarchicalFacet](#SearchResults.HierarchicalFacet) attributes with the
 * order (`asc` or `desc`). For example to order the value by count, the
 * argument would be `['count:asc']`.
 *
 * If only the attribute name is specified, the ordering defaults to the one
 * specified in the default value for this attribute.
 *
 * When not specified, the order is
 * ascending.  This parameter can also be a function which takes two facet
 * values and should return a number, 0 if equal, 1 if the first argument is
 * bigger or -1 otherwise.
 *
 * The default value for this attribute `['isRefined:desc', 'count:desc', 'name:asc']`
 * @return {FacetValue[]|HierarchicalFacet} depending on the type of facet of
 * the attribute requested (hierarchical, disjunctive or conjunctive)
 * @example
 * helper.on('result', function(event){
 *   //get values ordered only by name ascending using the string predicate
 *   event.results.getFacetValues('city', {sortBy: ['name:asc']});
 *   //get values  ordered only by count ascending using a function
 *   event.results.getFacetValues('city', {
 *     // this is equivalent to ['count:asc']
 *     sortBy: function(a, b) {
 *       if (a.count === b.count) return 0;
 *       if (a.count > b.count)   return 1;
 *       if (b.count > a.count)   return -1;
 *     }
 *   });
 * });
 */
SearchResults.prototype.getFacetValues = function(attribute, opts) {
  var facetValues = extractNormalizedFacetValues(this, attribute);
  if (!facetValues) throw new Error(attribute + ' is not a retrieved facet.');

  var options = defaultsPure({}, opts, {sortBy: SearchResults.DEFAULT_SORT});

  if (Array.isArray(options.sortBy)) {
    var order = formatSort(options.sortBy, SearchResults.DEFAULT_SORT);
    if (Array.isArray(facetValues)) {
      return orderBy(facetValues, order[0], order[1]);
    }
    // If facetValues is not an array, it's an object thus a hierarchical facet object
    return recSort(partialRight(orderBy, order[0], order[1]), facetValues);
  } else if (isFunction(options.sortBy)) {
    if (Array.isArray(facetValues)) {
      return facetValues.sort(options.sortBy);
    }
    // If facetValues is not an array, it's an object thus a hierarchical facet object
    return recSort(partial(vanillaSortFn, options.sortBy), facetValues);
  }
  throw new Error(
    'options.sortBy is optional but if defined it must be ' +
    'either an array of string (predicates) or a sorting function'
  );
};

/**
 * Returns the facet stats if attribute is defined and the facet contains some.
 * Otherwise returns undefined.
 * @param {string} attribute name of the faceted attribute
 * @return {object} The stats of the facet
 */
SearchResults.prototype.getFacetStats = function(attribute) {
  if (this._state.isConjunctiveFacet(attribute)) {
    return getFacetStatsIfAvailable(this.facets, attribute);
  } else if (this._state.isDisjunctiveFacet(attribute)) {
    return getFacetStatsIfAvailable(this.disjunctiveFacets, attribute);
  }

  throw new Error(attribute + ' is not present in `facets` or `disjunctiveFacets`');
};

/**
 * @typedef {Object} FacetListItem
 * @property {string} name
 */

/**
 * @param {FacetListItem[]} facetList (has more items, but enough for here)
 * @param {string} facetName
 */
function getFacetStatsIfAvailable(facetList, facetName) {
  var data = find(facetList, function(facet) {
    return facet.name === facetName;
  });
  return data && data.stats;
}

/**
 * Returns all refinements for all filters + tags. It also provides
 * additional information: count and exhaustiveness for each filter.
 *
 * See the [refinement type](#Refinement) for an exhaustive view of the available
 * data.
 *
 * @return {Array.<Refinement>} all the refinements
 */
SearchResults.prototype.getRefinements = function() {
  var state = this._state;
  var results = this;
  var res = [];

  Object.keys(state.facetsRefinements).forEach(function(attributeName) {
    state.facetsRefinements[attributeName].forEach(function(name) {
      res.push(getRefinement(state, 'facet', attributeName, name, results.facets));
    });
  });

  Object.keys(state.facetsExcludes).forEach(function(attributeName) {
    state.facetsExcludes[attributeName].forEach(function(name) {
      res.push(getRefinement(state, 'exclude', attributeName, name, results.facets));
    });
  });

  Object.keys(state.disjunctiveFacetsRefinements).forEach(function(attributeName) {
    state.disjunctiveFacetsRefinements[attributeName].forEach(function(name) {
      res.push(getRefinement(state, 'disjunctive', attributeName, name, results.disjunctiveFacets));
    });
  });

  Object.keys(state.hierarchicalFacetsRefinements).forEach(function(attributeName) {
    state.hierarchicalFacetsRefinements[attributeName].forEach(function(name) {
      res.push(getHierarchicalRefinement(state, attributeName, name, results.hierarchicalFacets));
    });
  });


  Object.keys(state.numericRefinements).forEach(function(attributeName) {
    var operators = state.numericRefinements[attributeName];
    Object.keys(operators).forEach(function(operator) {
      operators[operator].forEach(function(value) {
        res.push({
          type: 'numeric',
          attributeName: attributeName,
          name: value,
          numericValue: value,
          operator: operator
        });
      });
    });
  });

  state.tagRefinements.forEach(function(name) {
    res.push({type: 'tag', attributeName: '_tags', name: name});
  });

  return res;
};

/**
 * @typedef {Object} Facet
 * @property {string} name
 * @property {Object} data
 * @property {boolean} exhaustive
 */

/**
 * @param {*} state
 * @param {*} type
 * @param {string} attributeName
 * @param {*} name
 * @param {Facet[]} resultsFacets
 */
function getRefinement(state, type, attributeName, name, resultsFacets) {
  var facet = find(resultsFacets, function(f) {
    return f.name === attributeName;
  });
  var count = facet && facet.data && facet.data[name] ? facet.data[name] : 0;
  var exhaustive = (facet && facet.exhaustive) || false;

  return {
    type: type,
    attributeName: attributeName,
    name: name,
    count: count,
    exhaustive: exhaustive
  };
}

/**
 * @param {*} state
 * @param {string} attributeName
 * @param {*} name
 * @param {Facet[]} resultsFacets
 */
function getHierarchicalRefinement(state, attributeName, name, resultsFacets) {
  var facetDeclaration = state.getHierarchicalFacetByName(attributeName);
  var separator = state._getHierarchicalFacetSeparator(facetDeclaration);
  var split = name.split(separator);
  var rootFacet = find(resultsFacets, function(facet) {
    return facet.name === attributeName;
  });

  var facet = split.reduce(function(intermediateFacet, part) {
    var newFacet =
      intermediateFacet && find(intermediateFacet.data, function(f) {
        return f.name === part;
      });
    return newFacet !== undefined ? newFacet : intermediateFacet;
  }, rootFacet);

  var count = (facet && facet.count) || 0;
  var exhaustive = (facet && facet.exhaustive) || false;
  var path = (facet && facet.path) || '';

  return {
    type: 'hierarchical',
    attributeName: attributeName,
    name: path,
    count: count,
    exhaustive: exhaustive
  };
}

module.exports = SearchResults;
