*Coming from V1 (or js client v2)?* Read the [migration guide](https://github.com/algolia/algoliasearch-helper-js/wiki/Migration-guide-:-V1-to-V2) to the new version of the Helper.

# algoliasearch-helper-js

This module is the companion of the [algolia/algoliasearch-client-js](https://github.com/algolia/algoliasearch-client-js). It helps you keep
track of the search parameters and provides a higher level API.

This is the library you will need to easily build a good search UX like our [instant search demo](http://demos.algolia.com/instant-search-demo/).

[See the helper in action](http://algolia.github.io/algoliasearch-helper-js/)

[![Version][version-svg]][package-url] [![Build Status][travis-svg]][travis-url] [![License][license-image]][license-url] [![Downloads][downloads-image]][downloads-url]

[![Browser tests][browser-test-matrix]][browser-test-url]

[travis-svg]: https://img.shields.io/travis/algolia/algoliasearch-helper-js/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/algolia/algoliasearch-helper-js
[license-image]: http://img.shields.io/badge/license-MIT-green.svg?style=flat-square
[license-url]: LICENSE
[downloads-image]: https://img.shields.io/npm/dm/algoliasearch-helper.svg?style=flat-square
[downloads-url]: http://npm-stat.com/charts.html?package=algoliasearch-helper
[browser-test-matrix]: https://saucelabs.com/browser-matrix/as-helper-js.svg
[browser-test-url]: https://saucelabs.com/u/as-helper-js
[version-svg]: https://img.shields.io/npm/v/algoliasearch-helper.svg?style=flat-square
[package-url]: https://npmjs.org/package/algoliasearch-helper


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Features](#features)
- [What does it look like?](#what-does-it-look-like)
- [How to use this module](#how-to-use-this-module)
- [Helper cheatsheet](#helper-cheatsheet)
  - [Add the helper in your project](#add-the-helper-in-your-project)
  - [Init the helper](#init-the-helper)
  - [Helper lifecycle](#helper-lifecycle)
  - [Objects](#objects)
  - [Search](#search)
  - [Events](#events)
  - [Query](#query)
  - [Filtering results](#filtering-results)
  - [Tags](#tags)
  - [Pagination](#pagination)
  - [Index](#index)
  - [Query parameters](#query-parameters)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Features
 - Search parameters management
 - Facets exclusions
 - Pagination
 - Disjunctive facetting (search on two or more values for a single facet)

## What does it look like?

A small example that uses Browserify to manage modules.

```javascript
var algoliasearch = require( "algoliasearch" );
var algoliasearchHelper = require( "algoliasearch-helper" );

var client = algoliasearch( "app_id", "secret" );

var helper = algoliasearchHelper( client, "myMainIndex", { 
  facets : [ "mainCharacterFirstName", "year" ],
  disjunctiveFacets : [ "director" ]
});

helper.on( "result", function( data ){
  console.log( data.hits );
} );

helper.addDisjunctiveRefine( "director", "Clint Eastword" );
helper.addDisjunctiveRefine( "director", "Sofia Coppola" );

helper.addNumericRefinement( "year", "=", 2003 );

// Search for any movie filmed in 2003 and directed by either C. Eastwood or S. Coppola
helper.search();
```

## Helper cheatsheet

[There is also a complete JSDoc](http://algolia.github.io/algoliasearch-helper-js/docs)

### Add the helper in your project

#### If you use NPM

`npm install algoliasearch-helper`

#### If you use bower

`bower install algoliasearch-helper`

#### If you use a CDN

Include this in your page :

`<script src="//cdn.jsdelivr.net/algoliasearch.helper/2.0.0/algoliasearch.helper.min.js"></script>`

### Init the helper

```
var helper = algoliasearchHelper( client, indexName, parameters );
```

### Helper lifecycle

1. modify the parameters of the search (usually through user interactions)
        ```js
        helper.setQuery( "iphone" ).addRefine( "category", "phone" )
        ```

2. trigger the search (after all the modification have been applied)
        ```js
        helper.search()
        ```

3. read the results (with the event "result" handler) and update the UI with the results
        ```js
        helper.on( "result", function( results ) {
             updateUI( results );
        } );
        ```

4. go back to 1

### Objects

**AlgoliasearchHelper** : the helper. Keeps the state of the search, makes the queries and calls the handlers when an event happen.

**SearchParameters** : the object representing the state of the search. 

**SearchResults** : the object in which the Algolia answers are transformed into. This object is passed to the result event handler.

### Search

The search is triggered by the search() method.

It takes all the previous modifications to the search and use them to create the queries to Algolia. The search parameters are stateful.

Example : 

```javascript
var helper = algoliasearchHelper( client, "index", {} );
// Let's monitor the results with the console
helper.on( "result", function( content ) { console.log( content ) } ); 
// Let's make an empty search
// The results are all sorted using the dashboard configuration
helper.search();
// Let's search for "landscape"
helper.setQuery( "landscape" ).search();
// Let's add a category "photo"
// Will make a search with "photo" tag and "landscape" as the query
helper.addTag( "photo" ).search();
```

### Events

`result` : get the new results when available. The handler function will receive
two objects (`SearchResults` and `SearchParameters`).

`error` : get the errors from the API

`change` : get notified when a property has changed in the helper

#### Listen to the `result` event

```
helper.on( "result", function( results ){
  updateTheResults( results );
} )
```

#### Listen to a `result`" event once

```
helper.once( "result", function( results ){
  updateTheResults( results );
} )
```

#### Remove all `result` listeners

```
helper.removeListener( "result" )
```

### Query

#### Do a search with the query "fruit"

```
helper.setQuery( "fruit" ).search();
```

### Filtering results

Facets are categories created upon attributes. First you need to define which attribute will be used as facet in the dashboard : [https://www.algolia.com/explorer#?tab=display](https://www.algolia.com/explorer#?tab=display)

#### "AND" facets

##### Facet definition

```
var helper = algoliasearchHelper( client, indexName, {
	facets : [ "ANDFacet" ]
} );
```

##### Add a facet filter

```
helper.addRefine( "ANDFacet", "valueOfANDFacet" ).search();
```

##### Remove a facet filter

```
helper.removeRefine( "ANDFacet", "valueOfANDFacet" ).search();
```

#### "OR" facets

##### Facet definition

```
var helper = algoliasearchHelper( client, indexName, {
	disjunctiveFacets : [ "ORFacet" ]
} );
```

##### Add a facet filter

```
helper.addDisjunctiveRefine( "ORFacet", "valueOfORFacet" ).search();
```

##### Remove a facet filter

```
helper.removeDisjunctiveRefine( "ORFacet", "valueOfORFacet" ).search();
```

#### Negative facets

filter so that we do NOT get a given category

##### Facet definition (same as "AND" facet)

```
var helper = algoliasearchHelper( client, indexName, {
	facets: [ "ANDFacet" ]
} ).search();
```

##### Exclude a value for a facet

```
helper.addExclude( "ANDFacet", "valueOfANDFacetToExclude" );
```

##### Remove an exclude from the list of excluded values

```
helper.removeExclude( "ANDFacet", "valueOfANDFacetToExclude" );
```

#### Numeric facets

Filter over numeric attributes with math operations like `=`, `>`, `<`, `>=`, `<=`. Can be used for numbers and dates (if converted to timestamp)

##### Facet definition

```
var helper = algoliasearchHelper( client, indexName, {
	disjunctiveFacets : [ "numericFacet" ]
} );
```

##### Add a numeric refinement

```
helper.addNumericRefinement( "numericFacet", "=", "3" ).search();
```

##### Remove a numeric refinement

```
helper.removeNumericRefinemetn( "numericFacet", "=", "3" ).search();
```

#### Clearing filters

##### Clear all the refinements for all the refined attributes

```
helper.clearRefinements().search();
```

##### Clear all the refinements for a specific attribute

```
helper.clearRefinements( "ANDFacet" ).search();
```

##### [ADVANCED] Clear only the exclusions on the "ANDFacet" attribute

```
helper.clearRefinements( function( value, attribute, type ) {
  return type==="exclude" && attribute==="ANDFacet";
} ).search();
```

### Tags

Tags are an easy way to do filtering. They are based on a special attribute in the records named `_tags`, which can be a single string value or an array of strings.

#### Add a tag filter for the value "landscape"

```
helper.addTag( "landscape" ).search();
```

#### Remove a tag filter for the value "landscape"

```
helper.removeTag( "landscape" ).search();
```

#### Clear all the tags filters

```
helper.clearTags().search();
```

### Pagination

#### Get the current page 

```
helper.getCurrentPage();
```

#### Change page

```
helper.setCurrentPage( 3 ).search();
```

### Index

Index can be changed. The common use case is when you have several slaves with different sort values (sort by relevance, sort by price…).

#### Change the current index

```
helper.setIndex( "index_orderByPrice" ).search();
```

#### Get the current index

```
var currentIndex = helper.state.index;
```

### Query parameters

There are lots of other parameters you can set.

#### Set a parameter at the initialization of the helper

```
var helper = algoliasearchHelper( client, indexName, {
	hitsPerPage : 50
} );
```

#### Set a parameter later

```
helper.setQueryParameter( "hitsPerPage", 20 ).search();
```

#### List of parameters that can be set
<table cellspacing="0" cellpadding="0" class="params">
  <tbody>
    <tr>
      <td valign="top" class="td1">
        <p class="p1"><span class="s1"><b>Name</b></span></p>
      </td>
      <td valign="top" class="td2">
        <p class="p1"><span class="s1"><b>Type</b></span></p>
      </td>
      <td valign="top" class="td3">
        <p class="p1"><span class="s1"><b>Description</b></span></p>
      </td>
    </tr>
    <tr>
      <td valign="top" class="td4">
        <p class="p2"><span class="s2">advancedSyntax</span></p>
      </td>
      <td valign="top" class="td5">
        <p class="p3"><span class="s1">boolean</span></p>
      </td>
      <td valign="top" class="td6">
        <p class="p4"><span class="s1">Enable the advanced syntax.</span></p>
        <p class="p5"><span class="s1"><a href="https://www.algolia.com/doc#advancedSyntax">advancedSyntax on Algolia.com<span class="s3"></span></a></span></p>
      </td>
    </tr>
    <tr>
      <td valign="top" class="td4">
        <p class="p2"><span class="s2">allowTyposOnNumericTokens</span></p>
      </td>
      <td valign="top" class="td5">
        <p class="p3"><span class="s1">boolean</span></p>
      </td>
      <td valign="top" class="td6">
        <p class="p4"><span class="s1">Should the engine allow typos on numerics.</span></p>
        <p class="p5"><span class="s1"><a href="https://www.algolia.com/doc#allowTyposOnNumericTokens">allowTyposOnNumericTokens on Algolia.com<span class="s3"></span></a></span></p>
      </td>
    </tr>
    <tr>
      <td valign="top" class="td4">
        <p class="p2"><span class="s2">analytics</span></p>
      </td>
      <td valign="top" class="td5">
        <p class="p3"><span class="s1">boolean</span></p>
      </td>
      <td valign="top" class="td6">
        <p class="p4"><span class="s1">Enable the analytics</span></p>
        <p class="p5"><span class="s1"><a href="https://www.algolia.com/doc#analytics">analytics on Algolia.com<span class="s3"></span></a></span></p>
      </td>
    </tr>
    <tr>
      <td valign="top" class="td4">
        <p class="p2"><span class="s2">analyticsTags</span></p>
      </td>
      <td valign="top" class="td5">
        <p class="p3"><span class="s1">string</span></p>
      </td>
      <td valign="top" class="td6">
        <p class="p4"><span class="s1">Tag of the query in the analytics.</span></p>
        <p class="p5"><span class="s1"><a href="https://www.algolia.com/doc#analyticsTags">analyticsTags on Algolia.com<span class="s3"></span></a></span></p>
      </td>
    </tr>
    <tr>
      <td valign="top" class="td4">
        <p class="p2"><span class="s2">aroundLatLng</span></p>
      </td>
      <td valign="top" class="td5">
        <p class="p3"><span class="s1">string</span></p>
      </td>
      <td valign="top" class="td6">
        <p class="p4"><span class="s1">Center of the geo search.</span></p>
        <p class="p5"><span class="s1"><a href="https://www.algolia.com/doc#aroundLatLng">aroundLatLng on Algolia.com<span class="s3"></span></a></span></p>
      </td>
    </tr>
    <tr>
      <td valign="top" class="td4">
        <p class="p2"><span class="s2">aroundLatLngViaIP</span></p>
      </td>
      <td valign="top" class="td5">
        <p class="p3"><span class="s1">boolean</span></p>
      </td>
      <td valign="top" class="td6">
        <p class="p4"><span class="s1">Center of the search, retrieve from the user IP.</span></p>
        <p class="p5"><span class="s1"><a href="https://www.algolia.com/doc#aroundLatLngViaIP">aroundLatLngViaIP on Algolia.com<span class="s3"></span></a></span></p>
      </td>
    </tr>
    <tr>
      <td valign="top" class="td4">
        <p class="p2"><span class="s2">aroundPrecision</span></p>
      </td>
      <td valign="top" class="td5">
        <p class="p3"><span class="s1">number</span></p>
      </td>
      <td valign="top" class="td6">
        <p class="p4"><span class="s1">Precision of the geo search.</span></p>
        <p class="p5"><span class="s1"><a href="https://www.algolia.com/doc#aroundPrecision">aroundPrecision on Algolia.com<span class="s3"></span></a></span></p>
      </td>
    </tr>
    <tr>
      <td valign="top" class="td4">
        <p class="p2"><span class="s2">aroundRadius</span></p>
      </td>
      <td valign="top" class="td5">
        <p class="p3"><span class="s1">number</span></p>
      </td>
      <td valign="top" class="td6">
        <p class="p4"><span class="s1">Radius of the geo search.</span></p>
        <p class="p5"><span class="s1"><a href="https://www.algolia.com/doc#aroundRadius">aroundRadius on Algolia.com<span class="s3"></span></a></span></p>
      </td>
    </tr>
    <tr>
      <td valign="top" class="td4">
        <p class="p2"><span class="s2">attributesToHighlight</span></p>
      </td>
      <td valign="top" class="td5">
        <p class="p3"><span class="s1">string</span></p>
      </td>
      <td valign="top" class="td6">
        <p class="p4"><span class="s1">List of attributes to highlight</span></p>
        <p class="p5"><span class="s1"><a href="https://www.algolia.com/doc#attributesToHighlight">attributesToHighlight on Algolia.com<span class="s3"></span></a></span></p>
      </td>
    </tr>
    <tr>
      <td valign="top" class="td4">
        <p class="p2"><span class="s2">attributesToRetrieve</span></p>
      </td>
      <td valign="top" class="td5">
        <p class="p3"><span class="s1">string</span></p>
      </td>
      <td valign="top" class="td6">
        <p class="p4"><span class="s1">List of attributes to retrieve</span></p>
        <p class="p5"><span class="s1"><a href="https://www.algolia.com/doc#attributesToRetrieve">attributesToRetrieve on Algolia.com<span class="s3"></span></a></span></p>
      </td>
    </tr>
    <tr>
      <td valign="top" class="td4">
        <p class="p2"><span class="s2">attributesToSnippet</span></p>
      </td>
      <td valign="top" class="td5">
        <p class="p3"><span class="s1">string</span></p>
      </td>
      <td valign="top" class="td6">
        <p class="p4"><span class="s1">List of attributes to snippet</span></p>
        <p class="p5"><span class="s1"><a href="https://www.algolia.com/doc#attributesToSnippet">attributesToSnippet on Algolia.com<span class="s3"></span></a></span></p>
      </td>
    </tr>
    <tr>
      <td valign="top" class="td4">
        <p class="p2"><span class="s2">disjunctiveFacets</span></p>
      </td>
      <td valign="top" class="td5">
        <p class="p3"><span class="s1">Array.&lt;string&gt;</span></p>
      </td>
      <td valign="top" class="td6">
        <p class="p1"><span class="s1">All the declared disjunctive facets</span></p>
      </td>
    </tr>
    <tr>
      <td valign="top" class="td4">
        <p class="p2"><span class="s2">distinct</span></p>
      </td>
      <td valign="top" class="td5">
        <p class="p3"><span class="s1">boolean</span></p>
      </td>
      <td valign="top" class="td6">
        <p class="p4"><span class="s1">Remove duplicates based on the index setting attributeForDistinct</span></p>
        <p class="p5"><span class="s1"><a href="https://www.algolia.com/doc#distinct">distinct on Algolia.com<span class="s3"></span></a></span></p>
      </td>
    </tr>
    <tr>
      <td valign="top" class="td4">
        <p class="p2"><span class="s2">facets</span></p>
      </td>
      <td valign="top" class="td5">
        <p class="p3"><span class="s1">Array.&lt;string&gt;</span></p>
      </td>
      <td valign="top" class="td6">
        <p class="p1"><span class="s1">All the facets that will be requested to the server</span></p>
      </td>
    </tr>
    <tr>
      <td valign="top" class="td4">
        <p class="p2"><span class="s2">getRankingInfo</span></p>
      </td>
      <td valign="top" class="td5">
        <p class="p3"><span class="s1">integer</span></p>
      </td>
      <td valign="top" class="td6">
        <p class="p4"><span class="s1">Enable the ranking informations in the response</span></p>
        <p class="p5"><span class="s1"><a href="https://www.algolia.com/doc#getRankingInfo">getRankingInfo on Algolia.com<span class="s3"></span></a></span></p>
      </td>
    </tr>
    <tr>
      <td valign="top" class="td4">
        <p class="p2"><span class="s2">hitsPerPage</span></p>
      </td>
      <td valign="top" class="td5">
        <p class="p3"><span class="s1">number</span></p>
      </td>
      <td valign="top" class="td6">
        <p class="p4"><span class="s1">Number of hits to be returned by the search API</span></p>
        <p class="p5"><span class="s1"><a href="https://www.algolia.com/doc#hitsPerPage">hitsPerPage on Algolia.com<span class="s3"></span></a></span></p>
      </td>
    </tr>
    <tr>
      <td valign="top" class="td4">
        <p class="p2"><span class="s2">ignorePlurals</span></p>
      </td>
      <td valign="top" class="td5">
        <p class="p3"><span class="s1">boolean</span></p>
      </td>
      <td valign="top" class="td6">
        <p class="p4"><span class="s1">Should the plurals be ignored</span></p>
        <p class="p5"><span class="s1"><a href="https://www.algolia.com/doc#ignorePlurals">ignorePlurals on Algolia.com<span class="s3"></span></a></span></p>
      </td>
    </tr>
    <tr>
      <td valign="top" class="td4">
        <p class="p2"><span class="s2">insideBoundingBox</span></p>
      </td>
      <td valign="top" class="td5">
        <p class="p3"><span class="s1">string</span></p>
      </td>
      <td valign="top" class="td6">
        <p class="p4"><span class="s1">Geo search inside a box.</span></p>
        <p class="p5"><span class="s1"><a href="https://www.algolia.com/doc#insideBoundingBox">insideBoundingBox on Algolia.com<span class="s3"></span></a></span></p>
      </td>
    </tr>
    <tr>
      <td valign="top" class="td4">
        <p class="p2"><span class="s2">maxValuesPerFacet</span></p>
      </td>
      <td valign="top" class="td5">
        <p class="p3"><span class="s1">number</span></p>
      </td>
      <td valign="top" class="td6">
        <p class="p4"><span class="s1">Number of values for each facetted attribute</span></p>
        <p class="p5"><span class="s1"><a href="https://www.algolia.com/doc#maxValuesPerFacet">maxValuesPerFacet on Algolia.com<span class="s3"></span></a></span></p>
      </td>
    </tr>
    <tr>
      <td valign="top" class="td4">
        <p class="p2"><span class="s2">minWordSizefor1Typo</span></p>
      </td>
      <td valign="top" class="td5">
        <p class="p3"><span class="s1">number</span></p>
      </td>
      <td valign="top" class="td6">
        <p class="p4"><span class="s1">Number of characters to wait before doing one character replacement.</span></p>
        <p class="p5"><span class="s1"><a href="https://www.algolia.com/doc#minWordSizefor1Typo">minWordSizefor1Typo on Algolia.com<span class="s3"></span></a></span></p>
      </td>
    </tr>
    <tr>
      <td valign="top" class="td4">
        <p class="p2"><span class="s2">minWordSizefor2Typos</span></p>
      </td>
      <td valign="top" class="td5">
        <p class="p3"><span class="s1">number</span></p>
      </td>
      <td valign="top" class="td6">
        <p class="p4"><span class="s1">Number of characters to wait before doing a second character replacement.</span></p>
        <p class="p5"><span class="s1"><a href="https://www.algolia.com/doc#minWordSizefor2Typos">minWordSizefor2Typos on Algolia.com<span class="s3"></span></a></span></p>
      </td>
    </tr>
    <tr>
      <td valign="top" class="td4">
        <p class="p2"><span class="s2">optionalWords</span></p>
      </td>
      <td valign="top" class="td5">
        <p class="p3"><span class="s1">string</span></p>
      </td>
      <td valign="top" class="td6">
        <p class="p4"><span class="s1">Add some optional words to those defined in the dashboard</span></p>
        <p class="p5"><span class="s1"><a href="https://www.algolia.com/doc#optionalWords">optionalWords on Algolia.com<span class="s3"></span></a></span></p>
      </td>
    </tr>
    <tr>
      <td valign="top" class="td4">
        <p class="p2"><span class="s2">page</span></p>
      </td>
      <td valign="top" class="td5">
        <p class="p3"><span class="s1">number</span></p>
      </td>
      <td valign="top" class="td6">
        <p class="p4"><span class="s1">The current page number</span></p>
        <p class="p5"><span class="s1"><a href="https://www.algolia.com/doc#page">page on Algolia.com<span class="s3"></span></a></span></p>
      </td>
    </tr>
    <tr>
      <td valign="top" class="td4">
        <p class="p2"><span class="s2">query</span></p>
      </td>
      <td valign="top" class="td5">
        <p class="p3"><span class="s1">string</span></p>
      </td>
      <td valign="top" class="td6">
        <p class="p4"><span class="s1">Query string of the instant search. The empty string is a valid query.</span></p>
        <p class="p5"><span class="s1"><a href="https://www.algolia.com/doc#query">query on Algolia.com<span class="s3"></span></a></span></p>
      </td>
    </tr>
    <tr>
      <td valign="top" class="td4">
        <p class="p2"><span class="s2">queryType</span></p>
      </td>
      <td valign="top" class="td5">
        <p class="p3"><span class="s1">string</span></p>
      </td>
      <td valign="top" class="td6">
        <p class="p4"><span class="s1">How the query should be treated by the search engine. Possible values : prefixAll, prefixLast, prefixNone</span></p>
        <p class="p5"><span class="s1"><a href="https://www.algolia.com/doc#queryType">queryType on Algolia.com<span class="s3"></span></a></span></p>
      </td>
    </tr>
    <tr>
      <td valign="top" class="td4">
        <p class="p2"><span class="s2">removeWordsIfNoResults</span></p>
      </td>
      <td valign="top" class="td5">
        <p class="p3"><span class="s1">string</span></p>
      </td>
      <td valign="top" class="td6">
        <p class="p4"><span class="s1">Possible values are "lastWords" "firstWords" "allOptionnal" "none" (default)</span></p>
        <p class="p5"><span class="s1"><a href="https://www.algolia.com/doc#removeWordsIfNoResults">removeWordsIfNoResults on Algolia.com<span class="s3"></span></a></span></p>
      </td>
    </tr>
    <tr>
      <td valign="top" class="td4">
        <p class="p2"><span class="s2">replaceSynonymsInHighlight</span></p>
      </td>
      <td valign="top" class="td5">
        <p class="p3"><span class="s1">boolean</span></p>
      </td>
      <td valign="top" class="td6">
        <p class="p4"><span class="s1">Should the engine replace the synonyms in the highlighted results.</span></p>
        <p class="p5"><span class="s1"><a href="https://www.algolia.com/doc#replaceSynonymsInHighlight">replaceSynonymsInHighlight on Algolia.com<span class="s3"></span></a></span></p>
      </td>
    </tr>
    <tr>
      <td valign="top" class="td4">
        <p class="p2"><span class="s2">restrictSearchableAttributes</span></p>
      </td>
      <td valign="top" class="td5">
        <p class="p3"><span class="s1">string</span></p>
      </td>
      <td valign="top" class="td6">
        <p class="p4"><span class="s1">Restrict which attribute is searched.</span></p>
        <p class="p5"><span class="s1"><a href="https://www.algolia.com/doc#restrictSearchableAttributes">restrictSearchableAttributes on Algolia.com<span class="s3"></span></a></span></p>
      </td>
    </tr>
    <tr>
      <td valign="top" class="td4">
        <p class="p2"><span class="s2">synonyms</span></p>
      </td>
      <td valign="top" class="td5">
        <p class="p3"><span class="s1">boolean</span></p>
      </td>
      <td valign="top" class="td6">
        <p class="p4"><span class="s1">Enable the synonyms</span></p>
        <p class="p5"><span class="s1"><a href="https://www.algolia.com/doc#synonyms">synonyms on Algolia.com<span class="s3"></span></a></span></p>
      </td>
    </tr>
    <tr>
      <td valign="top" class="td4">
        <p class="p2"><span class="s2">tagFilters</span></p>
      </td>
      <td valign="top" class="td5">
        <p class="p3"><span class="s1">string</span></p>
      </td>
      <td valign="top" class="td6">
        <p class="p4"><span class="s1">Contains the tag filters in the raw format of the Algolia API. Setting this parameter is not compatible with the of the add/remove/toggle methods of the tag api.</span></p>
        <p class="p5"><span class="s1"><a href="https://www.algolia.com/doc#tagFilters">tagFilters on Algolia.com<span class="s3"></span></a></span></p>
      </td>
    </tr>
    <tr>
      <td valign="top" class="td4">
        <p class="p2"><span class="s2">typoTolerance</span></p>
      </td>
      <td valign="top" class="td5">
        <p class="p3"><span class="s1">string</span></p>
      </td>
      <td valign="top" class="td6">
        <p class="p4"><span class="s1">How the typo tolerance behave in the search engine. Possible values : true, false, min, strict</span></p>
        <p class="p5"><span class="s1"><a href="https://www.algolia.com/doc#typoTolerance">typoTolerance on Algolia.com<span class="s3"></span></a></span></p>
      </td>
    </tr>
  </tbody>
</table>

