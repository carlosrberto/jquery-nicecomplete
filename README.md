# jQuery nicecomplete

jQuery plugin to create autocomplete inputs from ajax requests

## How to use

### JavaScript

```javascript
var input = $('#search-input');

// init plugin
input.nicecomplete({
	// delay before start searching
	searchDelay: 500,

	// if true will render results in options.resultsSelector
    renderResults: true,

	// element to place results
    resultsSelector: '.nc-results-list',

	// link selector child of a item from rendered results,
	// used to redirect when the user hit the enter key
    linkSelector: '>a',

    // class name applied to active result item
    activeClass: 'nc-item-active',

	// url to fetch data from server (expect a JSON response)
    url: function(p) {
        return '/search/autocomplete/?q=' + p;
    },

    // get the right key from returned JSON
    parseResults: function(data) {
        return data.results || data;
    },

	// default function to render a result item
    renderResultItem: function( item ) {
        var html = '' +
        '<li>'+
            '<a href="'+item.url+'" class="link">'+
                '<div class="image"><img src="'+item.img+'"></div>'+
                '<p class="title">'+item.name+'</p>'+
            '</a>'+
        '</li>';
        return html;
    }
})
```

If you want to handle the data returned yoursel, use the option `renderResults: false`

```javascript
var input = $('#search-input');

input.nicecomplete({
    renderResults: false
});

// use events
input.on('load.nicecomplete', function(event, data){
	// do something with data received from server
	// render search results
});

input.on('beforeload.nicecomplete', function(event, data){
	// do something before request starts
});

input.on('loaderror.nicecomplete', function(event, data){
	// do something on request error
});

input.on('show.nicecomplete', function(event, data){
    // do something when results are visible
});

input.on('hide.nicecomplete', function(event, data){
    // do something when results are hidden
});

input.on('results.nicecomplete', function(event, data){
    // do something when any results are returned
});

input.on('noresults.nicecomplete', function(event, data){
    // do something when no results are returned
});
```
