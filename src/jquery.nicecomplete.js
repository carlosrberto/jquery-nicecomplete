/*
* jQuery nicecomplete
* https://github.com/carlosrberto/jquery-nicecomplete
*
* Copyright (c) 2013 Carlos Roberto Gomes Junior
* http://carlosroberto.name/
*
* Licensed under a Creative Commons Attribution 3.0 License
* http://creativecommons.org/licenses/by-sa/3.0/
*
* Version: 0.2.1
*/

(function($) {
    var defaults = {
        renderResults: true,
        searchDelay: 500,
        resultsSelector: '.nc-results-list',
        linkSelector: '>a',
        activeClass: 'nc-item-active',

        url: function(p) {
            return '/search/autocomplete/?q=' + p;
        },

        parseResults: function(data) {
            return data.results || data;
        },

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
    };

    var NiceComplete = function(el, options) {
        this.el = $(el);
        this.options = $.extend({}, defaults, options);
        this.resultsContainer = $(this.options.resultsSelector);
        this.lastText = null;
        this.delayInProgress = false;
        this.searchInterval = null;
        this.cache = {};

        if (!this.options.url) {
            throw new Error('You must specify the service url using options.url');
        }

        this._initEvens();
    };

    NiceComplete.prototype = {
        setOptions: function( options ) {
            this.options = $.extend({}, this.options, options);
        },

        _initEvens: function() {
            this.el.on('load.nicecomplete', $.proxy(function(event, data){
                this._renderResults(data);
            }, this));

            this.el.on('keyup.nicecomplete', $.proxy(this._keyUpHandler, this));

            if ( this.options.renderResults ) {
                this.el.on('keydown.nicecomplete', $.proxy(this._keyDownHandler, this));
            }
        },

        _handleResultsNavigation: function(event) {
            if ( this.resultsContainer.is(':empty') ) {
                return;
            }

            var keyCode = event.keyCode,
                current = this.resultsContainer.find('.'+this.options.activeClass+':eq(0)');


            if ( keyCode === 38 ) { // up
                event.preventDefault();
                var prev = current.prev();

                if ( !prev.length ) {
                    prev = this.resultsContainer.find('>*').last();
                }

                if ( prev.length ) {
                    prev.addClass(this.options.activeClass);
                    current.removeClass(this.options.activeClass);
                }
            } else if( keyCode === 40 ) { // down
                event.preventDefault();
                var next = current.next();

                if ( !next.length ) {
                    next = this.resultsContainer.find('>*').first();
                }

                if ( next.length ) {
                    next.addClass(this.options.activeClass);
                    current.removeClass(this.options.activeClass);
                }
            }
        },

        _handleResultSelection: function(event) {
            var linkEl = this.resultsContainer.find('.'+this.options.activeClass+':eq(0) ' + this.options.linkSelector),
                url = linkEl.attr('href');
            if ( event.keyCode === 13 && !this.resultsContainer.is(':empty') && linkEl ) {
                event.preventDefault();
                location.href = url;
            }
        },

        _keyUpHandler: function(event) {
            if ( !this.delayInProgress ) {
                this._searchTimer(this.el.val());
            }
        },

        _keyDownHandler: function(event) {
            this._handleResultSelection(event);
            this._handleResultsNavigation(event);
        },

        _searchTimer: function(text) {
            var that = this;
            this.delayInProgress = true;
            this.searchInterval = setTimeout(function() {
                if (that.lastText !== text) {
                    that.lastText = text;
                    that.search(text).done(function() {
                        clearTimeout(that.searchInterval);
                        that.delayInProgress = false;
                        if ( text !== that.el.val()) {
                            that._searchTimer(that.el.val());
                        }
                    }).fail(function(){
                        clearTimeout(that.searchInterval);
                        that.delayInProgress = false;
                    });
                } else {
                    clearTimeout(that.searchInterval);
                    that.delayInProgress = false;
                }
            }, this.options.searchDelay);
        },

        search: function(text) {
            this.el.trigger('beforeload.nicecomplete');
            return this._searchRequest(text).done(function(data) {
                this.el.trigger('load.nicecomplete', [data]);
            }).fail(function() {
                this.el.trigger('loaderror.nicecomplete', arguments);
            });
        },

        _searchRequest: function( text ) {
            var deferred = new $.Deferred();
            var cache = this.cache[text];

            if ( cache ) {
                deferred.resolveWith(this, [cache]);
            } else {
                $.ajax({
                    context: this,
                    url: this.options.url(text)
                }).done(function(data) {
                    this.cache[text] = data;
                    deferred.resolveWith(this, [data]);
                }).fail(function() {
                    deferred.rejectWith(this, arguments);
                });
            }

            return deferred.promise();
        },

        _renderResults: function( data ) {
            var resultsContainer = this.resultsContainer,
                resultsList = this.options.parseResults(data),
                renderItem = this.options.renderResultItem;

            resultsContainer.empty();
            $.each(resultsList, function(index, item){
                resultsContainer.append(renderItem(item));
            });
            resultsContainer.find('>*').first().addClass('nc-item-active');
        }
    };

    $.fn.nicecomplete = function( method ) {
        var args = arguments;

        return this.each(function() {

            if ( !$.data(this, 'nicecomplete') ) {
                $.data(this, 'nicecomplete', new NiceComplete(this, method));
                return;
            }

            var api = $.data(this, 'nicecomplete');

            if ( typeof method === 'string' && method.charAt(0) !== '_' && api[ method ] ) {
                api[ method ].apply( api, Array.prototype.slice.call( args, 1 ) );
            } else {
                $.error( 'Method ' +  method + ' does not exist on jQuery.nicecomplete' );
            }
        });
    };
})(jQuery);
