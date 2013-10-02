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
	// url to fetch data from server (expect a JSON response)
    url: function(p) {
        return '/search/autocomplete/?q=' + p;
    }
})

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
```
